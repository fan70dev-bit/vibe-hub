import { useState, useEffect, useRef } from 'react'
import { getServerTime } from '../api'

function Clock() {
  const [time, setTime] = useState(new Date())
  const offsetRef = useRef(0) // 服务器时间与本地时间的差值（ms）

  // 同步服务器时间：用服务器返回的 epoch_ms 与本地 Date 做差得到 offset，之后用 setInterval 基于 offset 推算“服务器时间”
  const syncServerTime = async () => {
    try {
      const server = await getServerTime()
      const serverMs = server.epoch_ms
      const localMs = Date.now()
      offsetRef.current = serverMs - localMs
    } catch {
      offsetRef.current = 0
    }
  }

  useEffect(() => {
    syncServerTime()
    const id = setInterval(() => {
      setTime(new Date(Date.now() + offsetRef.current))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const seconds = time.getSeconds()
  const minutes = time.getMinutes()
  const hours = time.getHours() % 12
  const secDeg = seconds * 6
  const minDeg = minutes * 6 + seconds * 0.1
  const hourDeg = hours * 30 + minutes * 0.5

  return (
    <div className="panel-glow rounded-2xl bg-cyber-panel/90 border border-cyber-border p-8 w-full max-w-sm">
      <h2 className="text-cyber-neon-cyan font-semibold text-sm uppercase tracking-widest mb-6 text-center drop-shadow-[0_0_8px_rgba(0,245,255,0.6)]">
        系统时间
      </h2>
      <div className="relative w-56 h-56 mx-auto rounded-full border-2 border-cyber-neon-cyan/50 bg-cyber-dark/80 shadow-neon-cyan">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-2 bg-cyber-neon-cyan/70 rounded-full"
            style={{
              left: '50%',
              top: '8px',
              transform: `translateX(-50%) rotate(${i * 30}deg)`,
              transformOrigin: 'center 104px',
            }}
          />
        ))}
        <div
          className="absolute left-1/2 top-1/2 w-0.5 h-[70px] bg-cyber-neon-magenta origin-bottom shadow-neon-magenta transition-transform duration-100"
          style={{
            transform: `translateX(-50%) translateY(-100%) rotate(${secDeg}deg)`,
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 w-1 h-14 bg-cyber-neon-cyan origin-bottom rounded-full transition-transform duration-300"
          style={{
            transform: `translateX(-50%) translateY(-100%) rotate(${minDeg}deg)`,
            boxShadow: '0 0 10px rgba(0,245,255,0.6)',
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 w-1.5 h-10 bg-cyber-neon-green origin-bottom rounded-full transition-transform duration-300"
          style={{
            transform: `translateX(-50%) translateY(-100%) rotate(${hourDeg}deg)`,
            boxShadow: '0 0 10px rgba(57,255,20,0.6)',
          }}
        />
        <div className="absolute left-1/2 top-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyber-neon-cyan shadow-neon-cyan" />
      </div>
      <p className="mt-6 text-center font-mono text-cyber-neon-cyan/90 text-sm tabular-nums">
        {time.toLocaleTimeString('zh-CN', { hour12: false })}
      </p>
    </div>
  )
}

export default Clock
