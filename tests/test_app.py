"""API, persistence, authentication, SSE and provider-adapter smoke tests."""
import asyncio
import json

import httpx
import pytest
from fastapi.testclient import TestClient

from app import main


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(main, "DB_PATH", tmp_path / "test.sqlite3")
    monkeypatch.setenv("OLLAMA_BASE_URL", "http://ollama.test:11434")
    monkeypatch.delenv("APP_PASSWORD", raising=False)
    with TestClient(main.app) as c:
        yield c


def test_health_and_static(client):
    assert client.get("/health").json()["status"] == "ok"
    assert "KubeChat" in client.get("/").text
    assert client.get("/styles.css").status_code == 200
    assert client.get("/app.js").status_code == 200
    assert client.get("/api/sessions").json() == {"sessions": []}


def test_provider_keys_never_returned(client, monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "secret-should-not-appear")
    response = client.get("/api/providers").text
    assert "secret-should-not-appear" not in response
    assert any(p["id"] == "openai" and p["configured"] for p in client.get("/api/providers").json()["providers"])


def test_chat_stream_history_delete(client, monkeypatch):
    async def fake_stream(provider, request, history):
        assert provider["id"] == "ollama"
        assert history[-1] == {"role": "user", "content": "Hello, world!"}
        yield "Hello "
        yield "from local AI!"

    monkeypatch.setattr(main, "provider_stream", fake_stream)
    response = client.post("/api/chat/stream", json={
        "provider": "ollama", "model": "qwen3:8b", "prompt": "Hello, world!",
    })
    assert response.status_code == 200
    assert "event: start" in response.text
    assert '"text": "Hello "' in response.text
    assert "event: done" in response.text
    sessions = client.get("/api/sessions").json()["sessions"]
    assert len(sessions) == 1
    session_id = sessions[0]["id"]
    data = client.get("/api/sessions/" + session_id).json()
    assert len(data["messages"]) == 2
    assert data["messages"][1]["content"] == "Hello from local AI!"
    assert data["messages"][1]["model"] == "qwen3:8b"
    assert client.patch("/api/sessions/" + session_id, json={"title":"Renamed"}).status_code == 200
    assert client.get("/api/sessions").json()["sessions"][0]["title"] == "Renamed"
    assert client.delete("/api/sessions/" + session_id).status_code == 200
    assert client.get("/api/sessions").json()["sessions"] == []
    assert client.get("/api/sessions/" + session_id).status_code == 404


def test_stream_error_is_delivered(client, monkeypatch):
    async def fail_stream(provider, request, history):
        raise RuntimeError("Upstream offline")
        yield "nothing"
    monkeypatch.setattr(main, "provider_stream", fail_stream)
    r = client.post("/api/chat/stream", json={"provider":"ollama","model":"qwen3:8b","prompt":"ping"})
    assert r.status_code == 200
    assert "event: error" in r.text
    assert "Upstream offline" in r.text
    session_id = client.get("/api/sessions").json()["sessions"][0]["id"]
    assert len(client.get("/api/sessions/" + session_id).json()["messages"]) == 1


def test_invalid_requests(client):
    assert client.post("/api/chat/stream",json={"provider":"invalid","model":"a","prompt":"hi"}).status_code == 400
    assert client.post("/api/chat/stream",json={"provider":"ollama","model":"a","prompt":""}).status_code == 422
    assert client.post("/api/chat/stream",json={"provider":"ollama","model":"a","prompt":"hello","session_id":"missing"}).status_code == 404


def test_basic_auth(client, monkeypatch):
    monkeypatch.setenv("APP_PASSWORD", "test-pass")
    monkeypatch.setenv("APP_USERNAME", "admin")
    assert client.get("/api/sessions").status_code == 401
    assert client.get("/").status_code == 401
    assert client.get("/api/sessions", headers={"Authorization": "Basic invalid-base64!"}).status_code == 401
    assert client.get("/api/sessions", auth=("admin", "wrong")).status_code == 401
    assert client.get("/api/sessions", auth=("admin", "test-pass")).status_code == 200
    assert client.get("/health").status_code == 200


def test_ollama_adapter_stream_and_request_body(client, monkeypatch):
    real_client = httpx.AsyncClient
    seen = {}
    def handler(request):
        seen['url'] = str(request.url)
        seen['json'] = json.loads(request.content)
        chunks = '\n'.join([
            json.dumps({"message": {"role":"assistant", "content":"Hi "}, "done":False}),
            json.dumps({"message": {"role":"assistant", "content":"there"}, "done":False}),
            json.dumps({"done":True}),
        ])
        return httpx.Response(200, content=chunks, headers={"Content-Type":"application/x-ndjson"})
    monkeypatch.setattr(main.httpx, "AsyncClient", lambda *args,**kwargs: real_client(*args, transport=httpx.MockTransport(handler), **kwargs))
    req = main.ChatRequest(provider="ollama", model="qwen3:8b", prompt="hi")
    async def run():
        return [token async for token in main.stream_ollama(main.get_provider("ollama"),req,[{"role":"user","content":"hi"}])]
    assert asyncio.run(run()) == ["Hi ", "there"]
    assert seen['url'].endswith('/api/chat')
    assert seen['json']['messages'][-1] == {"role":"user", "content":"hi"}
    assert seen['json']['stream'] is True


def test_openai_adapter_stream_and_authorization(client, monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    real_client = httpx.AsyncClient
    seen = {}
    def handler(request):
        seen['auth'] = request.headers['Authorization']
        seen['json'] = json.loads(request.content)
        body = '\n\n'.join([
            'data: ' + json.dumps({"choices":[{"delta":{"content":"Hello"}}]}),
            'data: ' + json.dumps({"choices":[{"delta":{"content":"!"}}]}),
            'data: [DONE]',
        ]) + '\n\n'
        return httpx.Response(200, content=body, headers={"Content-Type":"text/event-stream"})
    monkeypatch.setattr(main.httpx, "AsyncClient", lambda *args,**kwargs: real_client(*args, transport=httpx.MockTransport(handler), **kwargs))
    req = main.ChatRequest(provider="openai", model="gpt-4.1-mini", prompt="hi")
    async def run():
        return [token async for token in main.stream_compatible(main.get_provider("openai"),req,[{"role":"user","content":"hi"}])]
    assert asyncio.run(run()) == ["Hello", "!"]
    assert seen['auth'] == 'Bearer sk-test'
    assert seen['json']['stream'] is True
    assert seen['json']['max_completion_tokens'] == 2048


def test_gemini_adapter_stream(client, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "gem-test")
    real_client = httpx.AsyncClient
    seen = {}
    def handler(request):
        seen['url'] = str(request.url)
        seen['key'] = request.headers['x-goog-api-key']
        seen['body'] = json.loads(request.content)
        return httpx.Response(200, content='data: '+json.dumps({"candidates":[{"content":{"parts":[{"text":"Hello Gemini"}]}}]})+'\n\n',headers={'Content-Type':'text/event-stream'})
    monkeypatch.setattr(main.httpx, "AsyncClient", lambda *args,**kwargs: real_client(*args, transport=httpx.MockTransport(handler), **kwargs))
    req = main.ChatRequest(provider="gemini", model="gemini-2.5-flash", prompt="hi")
    async def run():
        return [token async for token in main.stream_gemini(req,[{"role":"user","content":"hi"}])]
    assert asyncio.run(run()) == ["Hello Gemini"]
    assert ':streamGenerateContent?alt=sse' in seen['url']
    assert seen['key'] == 'gem-test'
    assert seen['body']['contents'][0]['role'] == 'user'
