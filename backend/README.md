# Vibe Hub 后端

基于 FastAPI 的 API 服务，提供待办持久化、服务器时间与 Groq AI Agent 战术指引。

## 安装依赖

在项目根目录或本目录下执行：

```bash
cd backend
pip install -r requirements.txt
```

或使用虚拟环境（推荐）：

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

## 环境变量（可选）

在 `backend` 目录下创建 `.env` 文件，用于 Groq Agent：

```
GROQ_API_KEY=gsk_xxxxxxxx
```

未配置或 Key 无效时，`POST /api/agent/briefing` 会返回写死的赛博朋克风格错误信息。

## 启动服务

在 `backend` 目录下执行：

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- 默认地址：**http://localhost:8000**
- 前端（Vite）运行在 **http://localhost:5173** 时，CORS 已允许，可直接访问 API。

## API 说明

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/todos` | 获取全部待办 |
| POST | `/api/todos` | 新增待办，body: `{ "text": "任务内容" }` |
| PATCH | `/api/todos/{id}` | 更新待办，body: `{ "done": true }` 等 |
| DELETE | `/api/todos/{id}` | 删除待办 |
| GET | `/api/time` | 返回服务器当前时间（UTC），用于前端时钟同步 |
| POST | `/api/agent/briefing` | AI 战术指引，body: `{ "todo_count": 0 }`，使用 Groq `llama-3.3-70b-versatile` |

待办数据保存在 `backend/todos.json`，刷新页面或重启后端数据不丢失。
