# KubeChat — Docker AI Chat UI (Local + Public)

เว็บแอป Chatbot แบบ self-hosted หน้าตาทันสมัย คล้าย ChatGPT / Gemini โดยเลือกใช้โมเดลได้ทั้ง **Local AI** และ **Public AI** ภายในหน้าเดียว พร้อม Streaming Response แบบเรียลไทม์

**รองรับ:** Ollama, vLLM / LM Studio (OpenAI-compatible), OpenAI API, Google Gemini API และ OpenRouter API

## 1. เริ่มใช้งานด้วย Docker Compose

ต้องมี Docker Engine/Desktop และ Docker Compose v2

```bash
# แตกไฟล์ zip แล้วเข้าโฟลเดอร์ kubechat
cp .env.example .env
# เปิดไฟล์ .env เพื่อตั้งค่า AI provider และ API key ที่ต้องการ
# สำหรับ public AI ใส่ OPENAI_API_KEY หรือ GEMINI_API_KEY เป็นต้น

docker compose up -d --build
```

เปิด **http://localhost:8080** แล้วเลือก Provider / Model จากแถบด้านบน หากแก้ไข `.env` ให้รัน `docker compose up -d --force-recreate` (หรือ `docker compose up -d --build`) เพื่อให้ container โหลดค่าใหม่

Docker Compose ใช้ named volume `kubechat_data` สำหรับฐานข้อมูล เพื่อให้ container ที่รันแบบ non-root เขียนไฟล์ได้โดยไม่ต้องปรับ permission ของโฟลเดอร์บน host; ข้อมูลไม่หายเมื่อ restart/recreate container แต่จะหายหากสั่ง `docker compose down -v`

ตรวจสอบสถานะ:

```bash
docker compose ps
docker compose logs -f kubechat
curl http://localhost:8080/health
```

**หมายเหตุ:** `docker-compose.yml` เปิด UI เฉพาะ `127.0.0.1` ของเครื่อง host เพื่อความปลอดภัย ถ้าต้องการเปิดจากเครื่องอื่นในเครือข่าย ต้องตั้งค่ารหัสผ่านและ HTTPS แล้วแก้ port binding เป็น `0.0.0.0:${APP_PORT:-8080}:8080` พร้อม firewall ที่เหมาะสม

## 2. เชื่อม Local AI

### Option A — Ollama ที่ติดตั้งบนเครื่อง host

ตั้งค่าใน `.env`:

```env
OLLAMA_BASE_URL=http://host.docker.internal:11434
OLLAMA_MODELS=qwen3:8b,llama3.2:3b
```

ต้องให้ Ollama service รันอยู่ก่อน และดาวน์โหลดโมเดลที่ต้องการ เช่น:

```bash
ollama pull qwen3:8b
ollama list
```

ใน Docker Desktop (Windows/macOS) `host.docker.internal` มักใช้งานได้ทันที ส่วน Linux ใช้ Compose `extra_hosts: host-gateway` ที่ใส่ไว้ให้แล้ว แต่ Ollama ที่ bind เฉพาะ `127.0.0.1` อาจไม่รับการเชื่อมต่อจาก container; หากจำเป็นให้ปรับ `OLLAMA_HOST` ให้ฟังที่ interface ที่ container เข้าถึงได้ **และจำกัดด้วย firewall** ห้ามเปิด Ollama สู่ public Internet โดยไม่มีการป้องกัน

### Option B — Ollama บน Kubernetes (Kube Lab)

หาก Ollama Service เป็น NodePort `31434`:

```env
# ใส่ IP ของ Kubernetes node หรือ load balancer ที่ forward ไปยัง port นี้ได้จริง
OLLAMA_BASE_URL=http://<KUBE_NODE_IP>:31434
OLLAMA_MODELS=qwen3:8b
```

ทดสอบจากเครื่องที่รัน Docker ก่อน:

```bash
curl http://<KUBE_NODE_IP>:31434/api/tags
```

ต้องเห็นรายการ model ที่ติดตั้งอยู่ ถ้าใช้ ClusterIP Service แต่รันแอปบน Kubernetes **คลัสเตอร์เดียวกัน** ให้ใช้ service DNS เช่น `http://ollama.chatbot.svc.cluster.local:11434` โดยตรวจชื่อ service/port จริงด้วย `kubectl get svc -n chatbot` ก่อน

### Option C — vLLM / LM Studio

```env
VLLM_BASE_URL=http://host.docker.internal:8000/v1
VLLM_API_KEY=
VLLM_MODELS=Qwen/Qwen3-8B
```

เครื่องมือที่มี `/v1/chat/completions` แบบ OpenAI-compatible ใช้ได้ใน provider `vLLM / LM Studio` เช่น vLLM, LM Studio, LocalAI หรือ API gateway ของคุณ ต้องใส่ **base URL ที่ลงท้ายด้วย `/v1`** และดู model ID จริงจาก `/v1/models`

### Option D — Ollama ภายใน Docker Compose (ไม่ใช้ Ollama เดิม)

ใช้ไฟล์ override ที่ให้มาด้วยได้เลย หากยังไม่มี Ollama บน host / Kubernetes:

```bash
docker compose -f docker-compose.yml -f docker-compose.with-ollama.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.with-ollama.yml exec ollama ollama pull qwen3:8b
```

การรัน Ollama container นี้ใช้ CPU เป็นค่าเริ่มต้น หากต้องการใช้ NVIDIA GPU ต้องติดตั้ง NVIDIA Container Toolkit และเพิ่ม `gpus: all` ใน service `ollama` ในไฟล์ override; ไม่จำเป็นต้องใช้ไฟล์ override หากคุณมี Ollama บน Kubernetes อยู่แล้ว

## 3. เชื่อม Public AI

ใส่คีย์เฉพาะผู้ให้บริการที่จะใช้ใน `.env`:

```env
OPENAI_API_KEY=YOUR_OPENAI_KEY
OPENAI_MODELS=gpt-4.1-mini,gpt-5-mini

GEMINI_API_KEY=YOUR_GEMINI_KEY
GEMINI_MODELS=gemini-2.5-flash,gemini-3.8-flash

OPENROUTER_API_KEY=YOUR_OPENROUTER_KEY
OPENROUTER_MODELS=openai/gpt-4.1-mini,google/gemini-2.5-flash
```

ค่าชื่อโมเดลเป็นเพียงค่าแนะนำ แก้ให้ตรงกับโมเดลที่บัญชีของคุณมีสิทธิ์ใช้งานได้ หรือเลือก **Custom model ID…** ในหน้า UI โดยไม่จำเป็นต้องเปลี่ยนโค้ด การเรียก Public API อาจมีค่าใช้จ่ายตามผู้ให้บริการ

**API keys จะไม่ถูกส่งไปที่ Browser**: Frontend เรียกเฉพาะ `/api/` บน Backend และ Backend ส่งคำขอไปยังผู้ให้บริการโดยใช้คีย์จาก environment ของ server

## 4. ความสามารถ

| Feature | สถานะ |
| --- | --- |
| Multi-provider / Model switch | รองรับ |
| Streaming SSE | รองรับ |
| Chat history | SQLite บน Docker named volume `kubechat_data` |
| Search chat history | รองรับ (ค้นจากชื่อแชต) |
| Rename / delete chats | รองรับ |
| Markdown / code / tables | รองรับระดับพื้นฐาน |
| Export chat เป็น Markdown | รองรับ |
| Light / Dark mode | รองรับ |
| System prompt, temperature, max tokens | รองรับ |
| Ollama thinking mode | รองรับโมเดลที่มีความสามารถนี้ |
| API keys stored server-side | รองรับ |
| Optional Basic authentication | รองรับเมื่อกำหนด `APP_PASSWORD` |
| Multi-user accounts, role-based access | ยังไม่รองรับ |
| Upload PDF / RAG / MCP / Tool calling / Web search | ยังไม่รองรับ |
| Images / voice / multi-modal | ยังไม่รองรับ (เวอร์ชันนี้เน้น text chat) |

## 5. ข้อมูลและความปลอดภัย

- `/app/data/kubechat.sqlite3` เก็บประวัติสนทนา SQLite; ใน Docker Compose ใช้ named volume `kubechat_data` ซึ่งอยู่บนเครื่อง host (ไม่มีการเข้ารหัสที่ระดับ SQLite)
- คีย์ API เก็บใน `.env` บน Server **อย่า commit ไฟล์ `.env` ไปยัง Git repository**
- ค่า Settings ทั่วไป (system prompt, temperature ฯลฯ) และ Provider ที่เลือก เก็บใน localStorage ของ Browser; ไม่ได้เก็บ API Key
- เวลาคุยกับ **Public AI** เนื้อหาสนทนาที่จำเป็นจะถูกส่งออกไปยังผู้ให้บริการนั้น; ประวัติ 40 messages ล่าสุดถูกใช้เป็น context (กำหนดในโค้ด)
- มีการตั้ง Basic Auth ทางเลือกด้วย `APP_USERNAME` และ `APP_PASSWORD` แต่หากให้เข้าจากเครือข่ายภายนอก **ต้องมี HTTPS reverse proxy** เช่น Caddy/Traefik/Nginx และควรพิจารณา SSO ก่อนเปิดให้หลายผู้ใช้
- แอปนี้ออกแบบเพื่อการใช้งานส่วนตัว/ทีมใน lab; การแชร์ endpoint ให้บุคคลทั่วไปควรเพิ่ม rate limiting, user isolation, auditing, secret management และ TLS

## 6. รันโดยไม่ใช้ Docker (เพื่อ Debug)

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# ตั้ง environment ตาม .env.example ก่อนรัน
export DATABASE_PATH=./data/kubechat.sqlite3
export OLLAMA_BASE_URL=http://127.0.0.1:11434
uvicorn app.main:app --host 127.0.0.1 --port 8080 --reload
```

ทดสอบ Backend:

```bash
pip install pytest
python -m pytest -q
```

## 7. โครงสร้างโปรเจกต์

```text
kubechat/
├── Dockerfile
├── docker-compose.yml
├── docker-compose.with-ollama.yml  # Optional Ollama service
├── k8s/kubechat.yaml               # Optional Kubernetes deployment
├── .env.example
├── .dockerignore
├── requirements.txt
├── README.md
├── app/
│   ├── main.py            # FastAPI, streaming adapters, SQLite
│   └── static/
│       ├── index.html     # Responsive Chat UI
│       ├── app.js         # Chat controls, SSE, Markdown, state
│       ├── styles.css     # Light/Dark UI
│       └── favicon.svg
├── tests/
│   └── test_app.py
└── data/                   # For local development only (Compose uses named volume)
```

## 8. Deploy บน Kubernetes (Optional)

ไฟล์ `k8s/kubechat.yaml` มี Deployment, PVC และ ClusterIP Service สำหรับ namespace `chatbot` (ตัวอย่างที่ต้องปรับก่อนใช้):

1. Build และ push image เข้า registry ที่ Kube node ดึงได้ เช่น `docker build -t YOUR_REGISTRY/kubechat:1.0.0 .` แล้ว `docker push YOUR_REGISTRY/kubechat:1.0.0`
2. แก้ค่า `image:` ให้เป็นชื่อจริง และ `OLLAMA_BASE_URL` ให้ตรงกับ Service/port ของ Ollama (ตรวจด้วย `kubectl get svc -n chatbot`)
3. ถ้าใช้ cloud provider ให้เพิ่ม secrets ด้วยคำสั่งตัวอย่างด้านล่าง ห้ามฝังคีย์จริงใน YAML หรือ Git:

```bash
kubectl -n chatbot create secret generic kubechat-secrets \
  --from-literal=APP_USERNAME=admin \
  --from-literal=APP_PASSWORD='CHANGE_TO_A_STRONG_PASSWORD' \
  --from-literal=OPENAI_API_KEY='YOUR_OPENAI_KEY' \
  --from-literal=GEMINI_API_KEY='YOUR_GEMINI_KEY'
kubectl apply -f k8s/kubechat.yaml
kubectl -n chatbot get pods,svc,pvc -l app=kubechat
kubectl -n chatbot port-forward svc/kubechat 8080:8080
```

เปิด `http://localhost:8080` บนเครื่องที่รัน port-forward. `PVC` ต้องมี StorageClass ใช้งานได้ และ Deployment ใช้ replica 1 เนื่องจาก SQLite ไม่เหมาะกับการแชร์ write ระหว่างหลาย replicas; manifest มี `readOnlyRootFilesystem: true` จึงอาจต้องปรับให้เข้ากับ runtime หรือเพิ่ม writable temp mount หาก environment กำหนด

## 9. Quick troubleshooting

- **Ollama connection error:** เช็ก `/api/tags` จาก host และการ bind interface; IP ที่เห็นใน Kubernetes POD อาจไม่เท่ากับ NodePort address
- **No model available:** pull โมเดลด้วย `ollama pull` หรือกำหนด Custom model ID และตรวจชื่อด้วย `/v1/models`
- **401/403 จาก OpenAI/Gemini:** ตรวจ API key และสิทธิ์โมเดล; คีย์ OpenAI API แยกจาก ChatGPT subscription
- **UI เข้าไม่ได้จากเครื่องอื่น:** ตั้งใจ bind `127.0.0.1` เท่านั้น; ให้ตรวจ port, reverse proxy และ firewall
- **โมเดลคิดนาน:** Local LLM อาจโหลด weights ครั้งแรก, โมเดล Qwen3 อาจใช้ thinking; ลองปิด thinking ใน Settings หรือใช้โมเดลขนาดเล็ก

---

สร้างสำหรับ Kube_Belle Lab — KubeChat v1.0
"# AI-Chatbot" 
