/**
 * 后端 API 基地址（与 backend main.py 一致）
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function getTodos() {
  const res = await fetch(`${API_BASE}/api/todos`)
  if (!res.ok) throw new Error('获取待办失败')
  return res.json()
}

export async function createTodo(text) {
  const res = await fetch(`${API_BASE}/api/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error('添加待办失败')
  return res.json()
}

export async function updateTodo(id, { done, text }) {
  const body = {}
  if (done !== undefined) body.done = done
  if (text !== undefined) body.text = text
  const res = await fetch(`${API_BASE}/api/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error('更新待办失败')
  return res.json()
}

export async function deleteTodo(id) {
  const res = await fetch(`${API_BASE}/api/todos/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('删除待办失败')
  return res.json()
}

export async function getServerTime() {
  const res = await fetch(`${API_BASE}/api/time`)
  if (!res.ok) throw new Error('获取时间失败')
  return res.json()
}

/**
 * 请求 Agent 战术指引（待办数量 + 服务器时间）。失败时后端会返回写死的赛博朋克错误信息。
 * @returns {{ text: string }}
 */
export async function agentBriefing(todoCount) {
  const res = await fetch(`${API_BASE}/api/agent/briefing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ todo_count: todoCount }),
  })
  if (!res.ok) throw new Error('请求战术指引失败')
  return res.json()
}
