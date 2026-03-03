import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getTodos, createTodo, updateTodo, deleteTodo, agentBriefing } from '../api'

const TYPEWRITER_INTERVAL_MS = 40
const EXIT_DURATION_S = 0.5

const destroyExit = {
  height: 0,
  opacity: [1, 0.5, 0],
  skewX: [0, -10, 8, 0],
  x: [0, -3, 2, 0],
  backgroundColor: ['rgba(0,0,0,0)', 'rgba(255,0,85,0.10)', 'rgba(255,0,85,0.15)'],
  borderColor: ['rgba(30,30,46,1)', 'rgba(255,0,85,0.85)', 'rgba(255,0,85,0.85)'],
  color: ['rgba(0,245,255,1)', '#ff0055', '#ff0055'],
  filter: [
    'brightness(1) contrast(1) saturate(1)',
    'brightness(1.35) contrast(1.5) saturate(1.6)',
    'brightness(0.9) contrast(1.9) saturate(1.2)',
  ],
  transition: { duration: EXIT_DURATION_S, ease: 'easeInOut' },
}

function TodoList() {
  const [todos, setTodos] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [agentLoading, setAgentLoading] = useState(false)
  const [agentFullText, setAgentFullText] = useState('')
  const [displayedAgentText, setDisplayedAgentText] = useState('')
  const [terminalOpen, setTerminalOpen] = useState(false)
  const typewriterIndexRef = useRef(0)
  const typewriterTimerRef = useRef(null)

  const loadTodos = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getTodos()
      setTodos(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message || '加载失败')
      setTodos([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTodos()
  }, [])

  // 打字机效果：当 agentFullText 更新时，从 displayedAgentText 逐字追上
  useEffect(() => {
    if (!agentFullText) {
      setDisplayedAgentText('')
      typewriterIndexRef.current = 0
      return
    }
    typewriterIndexRef.current = 0
    setDisplayedAgentText('')

    const run = () => {
      typewriterTimerRef.current = setInterval(() => {
        typewriterIndexRef.current += 1
        const next = agentFullText.slice(0, typewriterIndexRef.current)
        setDisplayedAgentText(next)
        if (typewriterIndexRef.current >= agentFullText.length) {
          clearInterval(typewriterTimerRef.current)
          typewriterTimerRef.current = null
        }
      }, TYPEWRITER_INTERVAL_MS)
    }
    run()
    return () => {
      if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current)
    }
  }, [agentFullText])

  const handleAgentBriefing = async () => {
    setTerminalOpen(true)
    setAgentLoading(true)
    setAgentFullText('')
    setDisplayedAgentText('')
    try {
      const { text } = await agentBriefing(todos.length)
      setAgentFullText(text || '')
    } catch (e) {
      setAgentFullText('系统被防火墙拦截，连接中断。')
    } finally {
      setAgentLoading(false)
    }
  }

  const addTodo = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setError(null)
    try {
      const item = await createTodo(text)
      setTodos((prev) => [...prev, item])
      setInput('')
    } catch (e) {
      setError(e.message || '添加失败')
    }
  }

  const toggleTodo = async (id) => {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return
    setError(null)
    try {
      const updated = await updateTodo(id, { done: !todo.done })
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)))
    } catch (e) {
      setError(e.message || '更新失败')
    }
  }

  const removeTodo = async (id) => {
    setError(null)
    // 先乐观移除，触发 AnimatePresence 的 exit 动画
    setTodos((prev) => prev.filter((t) => t.id !== id))
    try {
      await deleteTodo(id)
    } catch (e) {
      setError(e.message || '删除失败')
    }
  }

  const typewriterDone = agentFullText && displayedAgentText.length >= agentFullText.length
  const showCursor = (agentLoading || (agentFullText && !typewriterDone)) || (terminalOpen && !agentFullText && !agentLoading)

  return (
    <div className="panel-glow-magenta rounded-2xl bg-cyber-panel/90 border border-cyber-border p-8 h-full flex flex-col">
      <h2 className="text-cyber-neon-magenta font-semibold text-sm uppercase tracking-widest mb-6 drop-shadow-[0_0_8px_rgba(255,0,170,0.6)]">
        待办事项
      </h2>

      {/* 接入神经漫游 按钮 */}
      <div className="mb-4">
        <button
          type="button"
          onClick={handleAgentBriefing}
          disabled={agentLoading}
          className="w-full py-2.5 px-4 rounded-lg border border-cyber-neon-green/80 bg-cyber-neon-green/10 text-cyber-neon-green font-mono text-sm hover:bg-cyber-neon-green/20 hover:shadow-neon-green transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          [ 接入神经漫游 ]
        </button>

        {/* 终端窗口 */}
        {terminalOpen && (
          <div className="mt-3 rounded-lg bg-black/90 border border-cyber-neon-green/50 p-4 min-h-[120px] font-mono text-sm text-cyber-neon-green shadow-[0_0_15px_rgba(57,255,20,0.15)]">
            {agentLoading && !agentFullText && (
              <span className="text-cyber-neon-green/80">正在连接神经链路...</span>
            )}
            {displayedAgentText && (
              <span className="whitespace-pre-wrap break-words">{displayedAgentText}</span>
            )}
            {showCursor && (
              <span className="cursor-blink inline-block w-3 h-4 ml-0.5 bg-cyber-neon-green align-middle" aria-hidden="true" />
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mb-3 text-red-400 text-sm font-mono" role="alert">
          {error}
        </p>
      )}
      <form onSubmit={addTodo} className="flex gap-2 mb-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="添加新任务..."
          className="flex-1 px-4 py-2.5 rounded-lg bg-cyber-dark border border-cyber-neon-magenta/40 text-cyber-neon-cyan placeholder-cyber-neon-magenta/50 focus:outline-none focus:border-cyber-neon-magenta focus:shadow-neon-magenta transition-all font-mono text-sm"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-lg bg-cyber-neon-magenta/20 border border-cyber-neon-magenta text-cyber-neon-magenta hover:bg-cyber-neon-magenta/30 hover:shadow-neon-magenta transition-all font-mono text-sm font-medium"
        >
          添加
        </button>
      </form>
      {loading ? (
        <p className="text-cyber-neon-cyan/70 font-mono text-sm">加载中...</p>
      ) : (
        <ul className="flex-1 space-y-2 overflow-auto">
          <AnimatePresence initial={false}>
            {todos.map((todo) => (
              <motion.li
                key={todo.id}
                layout
                initial={{ opacity: 0, y: 6, height: 'auto' }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{
                  ...destroyExit,
                  paddingTop: 0,
                  paddingBottom: 0,
                  marginTop: 0,
                  marginBottom: 0,
                  y: -6,
                }}
                style={{ overflow: 'hidden' }}
                className="flex items-center gap-3 group py-2 px-3 rounded-lg border border-cyber-border hover:border-cyber-neon-magenta/40 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleTodo(todo.id)}
                  className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    todo.done
                      ? 'bg-cyber-neon-green border-cyber-neon-green text-cyber-dark shadow-neon-green'
                      : 'border-cyber-neon-magenta/60 text-transparent hover:border-cyber-neon-magenta'
                  }`}
                  aria-label={todo.done ? '标记未完成' : '标记完成'}
                >
                  {todo.done && (
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
                <span
                  className={`flex-1 font-mono text-sm transition-all ${
                    todo.done
                      ? 'text-cyber-neon-cyan/50 line-through'
                      : 'text-cyber-neon-cyan'
                  }`}
                >
                  {todo.text}
                </span>
                <button
                  type="button"
                  onClick={() => removeTodo(todo.id)}
                  className="opacity-0 group-hover:opacity-100 text-cyber-neon-magenta hover:text-red-400 transition-opacity p-1"
                  aria-label="删除"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  )
}

export default TodoList
