"""
Vibe Hub 后端 API：待办事项持久化 + 服务器时间 + Groq Agent
"""
import os
import json
import logging
from pathlib import Path
from datetime import datetime, timezone,timedelta
from typing import List

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel

load_dotenv()
logger = logging.getLogger("vibe-hub")

app = FastAPI(title="Vibe Hub API")

# Groq 使用 OpenAI 兼容接口
_openai_client = None

def _get_groq_client():
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=os.getenv("GROQ_API_KEY") or "",
        )
    return _openai_client


# 允许前端 localhost:5173 跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 本地 JSON 存储路径（与 main.py 同目录）
DATA_DIR = Path(__file__).resolve().parent
TODOS_FILE = DATA_DIR / "todos.json"


# ---------- 模型 ----------
class TodoCreate(BaseModel):
    text: str


class TodoUpdate(BaseModel):
    done: bool | None = None
    text: str | None = None


class TodoItem(BaseModel):
    id: int
    text: str
    done: bool


class AgentBriefingRequest(BaseModel):
    todo_count: int = 0


class AgentBriefingResponse(BaseModel):
    text: str


# ---------- 存储读写 ----------
def _load_todos() -> List[dict]:
    if not TODOS_FILE.exists():
        return []
    try:
        data = TODOS_FILE.read_text(encoding="utf-8")
        return json.loads(data)
    except (json.JSONDecodeError, OSError):
        return []


def _save_todos(todos: List[dict]) -> None:
    TODOS_FILE.write_text(json.dumps(todos, ensure_ascii=False, indent=2), encoding="utf-8")


def _next_id(todos: List[dict]) -> int:
    if not todos:
        return 1
    return max(t.get("id", 0) for t in todos) + 1


# ---------- 路由 ----------
@app.get("/api/todos", response_model=List[TodoItem])
def get_todos():
    """获取全部待办事项"""
    todos = _load_todos()
    return [TodoItem(**t) for t in todos]


@app.post("/api/todos", response_model=TodoItem)
def create_todo(payload: TodoCreate):
    """新增待办"""
    text = (payload.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text 不能为空")
    todos = _load_todos()
    new_id = _next_id(todos)
    item = {"id": new_id, "text": text, "done": False}
    todos.append(item)
    _save_todos(todos)
    return TodoItem(**item)


@app.patch("/api/todos/{todo_id}", response_model=TodoItem)
def update_todo(todo_id: int, payload: TodoUpdate):
    """更新待办（如勾选/取消勾选）"""
    todos = _load_todos()
    for i, t in enumerate(todos):
        if t.get("id") == todo_id:
            if payload.done is not None:
                todos[i]["done"] = payload.done
            if payload.text is not None:
                todos[i]["text"] = payload.text.strip()
            _save_todos(todos)
            return TodoItem(**todos[i])
    raise HTTPException(status_code=404, detail="未找到该待办")


@app.delete("/api/todos/{todo_id}")
def delete_todo(todo_id: int):
    """删除待办"""
    todos = _load_todos()
    for i, t in enumerate(todos):
        if t.get("id") == todo_id:
            todos.pop(i)
            _save_todos(todos)
            return {"ok": True}
    raise HTTPException(status_code=404, detail="未找到该待办")


@app.get("/api/time")
def get_time():
    """返回服务器当前时间，供前端时钟同步"""
    # 1. 创建一个真正的“东八区”时区对象
    tz_cn = timezone(timedelta(hours=8))
    
    # 2. 获取该时区的当前时间
    now = datetime.now(tz_cn)
    
    return {
        # isoformat() 会自动带上 +08:00 的尾巴，不要手动加 "Z" 了！
        "iso": now.isoformat(),
        "epoch_ms": int(now.timestamp() * 1000),
    }


AGENT_SYSTEM = (
    "你是一个来自 2077 年的暗网情报官。用简短、冷酷、充满黑客术语的中文向用户汇报。"
    "请根据用户传入的待办事项数量和当前系统时间，生成一段战术指引。"
)
FALLBACK_MESSAGE = "系统被防火墙拦截，连接中断。"


@app.post("/api/agent/briefing", response_model=AgentBriefingResponse)
def agent_briefing(payload: AgentBriefingRequest):
    """根据待办数量与服务器时间，返回 AI 战术指引。Groq 失败时返回赛博朋克风格错误信息。"""
    now = datetime.utcnow()
    time_str = now.strftime("%Y-%m-%d %H:%M UTC")
    user_msg = (
        f"当前待办事项数量：{payload.todo_count}。当前系统时间：{time_str}。请生成一段简短战术指引。"
    )
    try:
        client = _get_groq_client()
        if not client.api_key:
            logger.warning("GROQ_API_KEY 未配置，返回 fallback 提示")
            return AgentBriefingResponse(text=FALLBACK_MESSAGE)
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": AGENT_SYSTEM},
                {"role": "user", "content": user_msg},
            ],
            max_tokens=512,
        )
        content = (resp.choices[0].message.content or "").strip()
        if not content:
            return AgentBriefingResponse(text=FALLBACK_MESSAGE)
        return AgentBriefingResponse(text=content)
    except Exception as e:
        logger.exception("Groq 调用失败，返回 fallback: %s", e)
        return AgentBriefingResponse(text=FALLBACK_MESSAGE)
