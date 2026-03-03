import { useState } from 'react'
import Clock from './components/Clock'
import TodoList from './components/TodoList'

function App() {
  return (
    <>
      <div className="cyber-bg" aria-hidden="true" />
      <main className="app-content min-h-screen flex flex-col md:flex-row gap-6 p-6 md:p-8">
        {/* 左侧：模拟时钟 */}
        <section className="flex-1 flex items-center justify-center min-h-[320px] md:min-h-0">
          <Clock />
        </section>
        {/* 右侧：待办列表 */}
        <section className="flex-1 flex flex-col min-h-[400px] md:min-h-0">
          <TodoList />
        </section>
      </main>
    </>
  )
}

export default App
