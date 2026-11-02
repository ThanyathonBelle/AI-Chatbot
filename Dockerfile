FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DATABASE_PATH=/app/data/kubechat.sqlite3

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && groupadd -r kubechat && useradd -r -g kubechat kubechat
COPY app ./app
RUN mkdir -p /app/data && chown -R kubechat:kubechat /app/data
USER kubechat
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/health', timeout=2)"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--proxy-headers"]
