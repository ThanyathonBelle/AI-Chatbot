"""KubeChat: self-hosted multi-provider AI chat with streamed responses."""
from __future__ import annotations

import asyncio
import base64
import binascii
import hmac
import json
import os
import sqlite3
import uuid
from contextlib import asynccontextmanager, contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import AsyncIterator
from urllib.parse import quote

import httpx
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import JSONResponse, Response, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.getenv("DATABASE_PATH", "/app/data/kubechat.sqlite3"))
DEFAULT_SYSTEM_PROMPT = "You are a helpful, accurate AI assistant. Respond in the user's language."


def env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


def models_from_env(name: str, default: str) -> list[str]:
    return [m.strip() for m in env(name, default).split(",") if m.strip()]


def providers() -> list[dict]:
    return [
        {
            "id": "ollama", "name": "Ollama", "kind": "local", "icon": "local",
            "configured": bool(env("OLLAMA_BASE_URL", "http://host.docker.internal:11434")),
            "endpoint": env("OLLAMA_BASE_URL", "http://host.docker.internal:11434"),
            "models": models_from_env("OLLAMA_MODELS", "qwen3:8b,llama3.2:3b"),
            "hint": "Ollama native API · /api/chat",
        },
        {
            "id": "vllm", "name": "vLLM / LM Studio", "kind": "local", "icon": "local",
            "configured": bool(env("VLLM_BASE_URL")),
            "endpoint": env("VLLM_BASE_URL"),
            "models": models_from_env("VLLM_MODELS", "Qwen/Qwen3-8B"),
            "hint": "OpenAI-compatible API · /v1/chat/completions",
        },
        {
            "id": "openai", "name": "OpenAI", "kind": "cloud", "icon": "cloud",
            "configured": bool(env("OPENAI_API_KEY")),
            "endpoint": env("OPENAI_BASE_URL", "https://api.openai.com/v1"),
            "models": models_from_env("OPENAI_MODELS", "gpt-4.1-mini,gpt-5-mini"),
            "hint": "Requires OPENAI_API_KEY",
        },
        {
            "id": "gemini", "name": "Google Gemini", "kind": "cloud", "icon": "cloud",
            "configured": bool(env("GEMINI_API_KEY")),
            "endpoint": "https://generativelanguage.googleapis.com/v1beta",
            "models": models_from_env("GEMINI_MODELS", "gemini-2.5-flash,gemini-3.8-flash"),
            "hint": "Requires GEMINI_API_KEY",
        },
        {
            "id": "openrouter", "name": "OpenRouter", "kind": "cloud", "icon": "cloud",
            "configured": bool(env("OPENROUTER_API_KEY")),
            "endpoint": "https://openrouter.ai/api/v1",
            "models": models_from_env("OPENROUTER_MODELS", "openai/gpt-4.1-mini,google/gemini-2.5-flash"),
            "hint": "Requires OPENROUTER_API_KEY",
        },
    ]


def get_provider(provider_id: str) -> dict:
    match = next((p for p in providers() if p["id"] == provider_id), None)
    if match is None:
        raise HTTPException(status_code=400, detail="Unknown provider")
    if not match["configured"]:
        raise HTTPException(status_code=400, detail=f"{match['name']} is not configured. Update the .env file and restart the container.")
    return match


@contextmanager
def db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH, timeout=20)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def init_db():
    with db() as conn:
        conn.execute("PRAGMA journal_mode = WAL")
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
            role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
            content TEXT NOT NULL,
            provider TEXT NOT NULL DEFAULT '',
            model TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS messages_session_idx ON messages(session_id, id);
        CREATE INDEX IF NOT EXISTS sessions_updated_idx ON sessions(updated_at DESC);
        """)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


app = FastAPI(title="KubeChat", version="1.0.0", docs_url=None, redoc_url=None, lifespan=lifespan)


@app.middleware("http")
async def optional_basic_auth(request: Request, call_next):
    """Optional Basic auth. Set APP_PASSWORD and use TLS for any external deployment."""
    password = env("APP_PASSWORD")
    if password and request.url.path not in ("/health", "/api/health"):
        supplied = request.headers.get("authorization", "")
        valid = False
        if supplied.startswith("Basic "):
            try:
                decoded = base64.b64decode(supplied[6:], validate=True).decode("utf-8")
                user, password_entered = decoded.split(":", 1)
                valid = hmac.compare_digest(user, env("APP_USERNAME", "admin")) and hmac.compare_digest(password_entered, password)
            except (ValueError, UnicodeDecodeError, binascii.Error):
                pass
        if not valid:
            return Response(status_code=401, content="Authentication required", headers={"WWW-Authenticate": 'Basic realm="KubeChat"'})
    return await call_next(request)


class ChatRequest(BaseModel):
    session_id: str | None = None
    provider: str
    model: str = Field(min_length=1, max_length=200)
    prompt: str = Field(min_length=1, max_length=30000)
    system_prompt: str = Field(default=DEFAULT_SYSTEM_PROMPT, max_length=6000)
    temperature: float = Field(default=0.7, ge=0, le=2)
    max_tokens: int = Field(default=2048, ge=128, le=8192)
    think: bool = False


class RenameRequest(BaseModel):
    title: str = Field(min_length=1, max_length=120)


@app.get("/health")
@app.get("/api/health")
def health():
    return {"status": "ok", "app": "KubeChat"}


@app.get("/api/providers")
def list_providers():
    return {"providers": providers()}


@app.get("/api/models")
async def list_models(provider: str = Query(..., min_length=1)):
    p = get_provider(provider)
    discovered = []
    warning = None
    if provider in ("ollama", "vllm"):
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(6, connect=3), trust_env=False) as client:
                if provider == "ollama":
                    url = p["endpoint"].rstrip("/") + "/api/tags"
                    res = await client.get(url)
                    res.raise_for_status()
                    discovered = [m.get("name", "") for m in res.json().get("models", [])]
                else:
                    url = p["endpoint"].rstrip("/") + "/models"
                    headers = {"Authorization": f"Bearer {env('VLLM_API_KEY') }"} if env("VLLM_API_KEY") else {}
                    res = await client.get(url, headers=headers)
                    res.raise_for_status()
                    discovered = [m.get("id", "") for m in res.json().get("data", [])]
        except (httpx.HTTPError, ValueError, KeyError) as exc:
            warning = f"Could not reach {p['name']}: {type(exc).__name__}. Check your endpoint and network."
    models = list(dict.fromkeys([m for m in discovered + p["models"] if m]))
    return {"models": models, "warning": warning, "live": bool(discovered)}


@app.get("/api/sessions")
def list_sessions():
    with db() as conn:
        rows = conn.execute("SELECT * FROM sessions ORDER BY updated_at DESC LIMIT 300").fetchall()
        return {"sessions": [dict(r) for r in rows]}


@app.get("/api/sessions/{session_id}")
def get_session(session_id: str):
    with db() as conn:
        row = conn.execute("SELECT * FROM sessions WHERE id=?", (session_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Chat not found")
        messages = conn.execute(
            "SELECT id, role, content, provider, model, created_at FROM messages WHERE session_id=? ORDER BY id",
            (session_id,),
        ).fetchall()
        return {"session": dict(row), "messages": [dict(r) for r in messages]}


@app.patch("/api/sessions/{session_id}")
def rename_session(session_id: str, data: RenameRequest):
    with db() as conn:
        cur = conn.execute("UPDATE sessions SET title=?, updated_at=? WHERE id=?", (data.title.strip(), utc_now(), session_id))
        if not cur.rowcount:
            raise HTTPException(404, "Chat not found")
    return {"ok": True}


@app.delete("/api/sessions/{session_id}")
def delete_session(session_id: str):
    with db() as conn:
        cur = conn.execute("DELETE FROM sessions WHERE id=?", (session_id,))
        if not cur.rowcount:
            raise HTTPException(404, "Chat not found")
    return {"ok": True}


def read_history(session_id: str, limit: int = 40) -> list[dict]:
    with db() as conn:
        rows = conn.execute(
            "SELECT role, content FROM (SELECT id, role, content FROM messages WHERE session_id=? ORDER BY id DESC LIMIT ?) ORDER BY id ASC",
            (session_id, limit),
        ).fetchall()
        return [dict(r) for r in rows]


def save_message(session_id: str, role: str, content: str, provider: str, model: str):
    now = utc_now()
    with db() as conn:
        conn.execute(
            "INSERT INTO messages(session_id, role, content, provider, model, created_at) VALUES (?,?,?,?,?,?)",
            (session_id, role, content, provider, model, now),
        )
        conn.execute("UPDATE sessions SET updated_at=? WHERE id=?", (now, session_id))


def parse_sse_data(line: str):
    if not line.startswith("data:"):
        return None
    data = line[5:].strip()
    if not data or data == "[DONE]":
        return None
    try:
        return json.loads(data)
    except ValueError:
        return None


async def stream_ollama(p: dict, req: ChatRequest, history: list[dict]) -> AsyncIterator[str]:
    body = {
        "model": req.model,
        "messages": ([{"role": "system", "content": req.system_prompt}] if req.system_prompt.strip() else []) + history,
        "stream": True,
        "options": {"temperature": req.temperature, "num_predict": req.max_tokens},
    }
    # `think` is optional in Ollama and unsupported by some model families.
    if req.think or req.model.lower().startswith("qwen3"):
        body["think"] = req.think
    async with httpx.AsyncClient(timeout=httpx.Timeout(180, connect=10), trust_env=False) as client:
        async with client.stream("POST", p["endpoint"].rstrip("/") + "/api/chat", json=body) as res:
            await check_upstream(res)
            async for line in res.aiter_lines():
                if line:
                    try:
                        item = json.loads(line)
                    except ValueError:
                        continue
                    if item.get("error"):
                        raise RuntimeError(str(item["error"])[:350])
                    token = item.get("message", {}).get("content", "")
                    if token:
                        yield token


async def check_upstream(res: httpx.Response):
    if res.status_code >= 400:
        raw = (await res.aread()).decode("utf-8", errors="replace")[:600]
        try:
            obj = json.loads(raw)
            detail = obj.get("error", {}).get("message", raw) if isinstance(obj.get("error"), dict) else obj.get("error", raw)
        except (ValueError, AttributeError):
            detail = raw
        raise RuntimeError(f"Provider HTTP {res.status_code}: {str(detail)[:350]}")


def api_chat_messages(req: ChatRequest, history: list[dict], cloud: bool) -> dict:
    body = {
        "model": req.model,
        "messages": ([{"role": "system", "content": req.system_prompt}] if req.system_prompt.strip() else []) + history,
        "stream": True,
    }
    # OpenAI reasoning models usually require default sampling settings.
    reasoning_model = req.model.startswith(("gpt-5", "o1", "o3", "o4"))
    if not reasoning_model:
        body["temperature"] = req.temperature
    if cloud:
        body["max_completion_tokens"] = req.max_tokens
    else:
        body["max_tokens"] = req.max_tokens
    return body


async def stream_compatible(p: dict, req: ChatRequest, history: list[dict]) -> AsyncIterator[str]:
    is_openai = p["id"] == "openai"
    if p["id"] == "openrouter":
        api_key = env("OPENROUTER_API_KEY")
    elif is_openai:
        api_key = env("OPENAI_API_KEY")
    else:
        api_key = env("VLLM_API_KEY")
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    if p["id"] == "openrouter":
        headers["HTTP-Referer"] = "http://localhost:8080"
        headers["X-Title"] = "KubeChat"
    body = api_chat_messages(req, history, cloud=is_openai)
    async with httpx.AsyncClient(timeout=httpx.Timeout(180, connect=10), trust_env=False) as client:
        async with client.stream("POST", p["endpoint"].rstrip("/") + "/chat/completions", json=body, headers=headers) as res:
            await check_upstream(res)
            async for line in res.aiter_lines():
                item = parse_sse_data(line)
                if not item:
                    continue
                if "error" in item:
                    raise RuntimeError(str(item["error"])[:350])
                for choice in item.get("choices", []):
                    delta = choice.get("delta", {})
                    token = delta.get("content")
                    if isinstance(token, str) and token:
                        yield token


async def stream_gemini(req: ChatRequest, history: list[dict]) -> AsyncIterator[str]:
    contents = [
        {"role": "model" if msg["role"] == "assistant" else "user", "parts": [{"text": msg["content"]}]}
        for msg in history
    ]
    payload = {
        "contents": contents,
        "generationConfig": {"temperature": req.temperature, "maxOutputTokens": req.max_tokens},
    }
    if req.system_prompt.strip():
        payload["systemInstruction"] = {"parts": [{"text": req.system_prompt}]}
    url = "https://generativelanguage.googleapis.com/v1beta/models/" + quote(req.model, safe="") + ":streamGenerateContent?alt=sse"
    headers = {"Content-Type": "application/json", "x-goog-api-key": env("GEMINI_API_KEY")}
    async with httpx.AsyncClient(timeout=httpx.Timeout(180, connect=10)) as client:
        async with client.stream("POST", url, json=payload, headers=headers) as res:
            await check_upstream(res)
            async for line in res.aiter_lines():
                item = parse_sse_data(line)
                if not item:
                    continue
                if "error" in item:
                    raise RuntimeError(str(item["error"])[:350])
                for candidate in item.get("candidates", []):
                    for part in candidate.get("content", {}).get("parts", []):
                        if part.get("text") and not part.get("thought"):
                            yield part["text"]


async def provider_stream(p: dict, req: ChatRequest, history: list[dict]) -> AsyncIterator[str]:
    if p["id"] == "ollama":
        async for token in stream_ollama(p, req, history):
            yield token
    elif p["id"] == "gemini":
        async for token in stream_gemini(req, history):
            yield token
    else:
        async for token in stream_compatible(p, req, history):
            yield token


def sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


@app.post("/api/chat/stream")
async def chat(req: ChatRequest, request: Request):
    p = get_provider(req.provider)
    if not req.prompt.strip() or not req.model.strip():
        raise HTTPException(status_code=422, detail="Prompt and model must not be empty")
    session_id = req.session_id or str(uuid.uuid4())
    with db() as conn:
        existing = conn.execute("SELECT id FROM sessions WHERE id=?", (session_id,)).fetchone()
        if req.session_id and not existing:
            raise HTTPException(404, "Chat not found")
        if not existing:
            now = utc_now()
            title = req.prompt.strip().replace("\n", " ")[:58]
            conn.execute("INSERT INTO sessions(id, title, created_at, updated_at) VALUES(?,?,?,?)", (session_id, title, now, now))
    save_message(session_id, "user", req.prompt.strip(), req.provider, req.model)
    history = read_history(session_id)

    async def event_stream():
        chunks: list[str] = []
        finished = False
        try:
            yield sse("start", {"session_id": session_id})
            async for token in provider_stream(p, req, history):
                if await request.is_disconnected():
                    break
                chunks.append(token)
                yield sse("delta", {"text": token})
            else:
                finished = True
            if finished and not chunks:
                yield sse("error", {"message": "Model returned an empty response. Check its configuration and available output tokens."})
            elif finished:
                yield sse("done", {"session_id": session_id})
        except asyncio.CancelledError:
            raise
        except (httpx.HTTPError, RuntimeError, ValueError) as exc:
            yield sse("error", {"message": str(exc)[:500]})
        except Exception:
            yield sse("error", {"message": "Unexpected server error while generating a response."})
        finally:
            if chunks:
                save_message(session_id, "assistant", "".join(chunks), req.provider, req.model)

    return StreamingResponse(event_stream(), media_type="text/event-stream", headers={"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no", "Connection": "keep-alive"})


app.mount("/", StaticFiles(directory=BASE_DIR / "static", html=True), name="static")
