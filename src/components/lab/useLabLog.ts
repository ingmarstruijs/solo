import { useCallback, useRef, useState } from 'react'

export type LogLevel = 'info' | 'success' | 'warn' | 'error'

export type LogEntry = {
  id: number
  time: string
  level: LogLevel
  message: string
}

export function useLabLog(maxEntries = 50) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const logId = useRef(0)

  const appendLog = useCallback((level: LogLevel, message: string) => {
    const time = new Date().toLocaleTimeString('nl-NL', { hour12: false })
    setLogs((prev) => [
      { id: ++logId.current, time, level, message },
      ...prev.slice(0, maxEntries - 1),
    ])
  }, [maxEntries])

  const clearLogs = useCallback(() => setLogs([]), [])

  return { logs, appendLog, clearLogs }
}

export function logLevelColor(level: LogLevel): string {
  switch (level) {
    case 'success':
      return 'text-success'
    case 'warn':
      return 'text-warn'
    case 'error':
      return 'text-danger'
    default:
      return 'text-faint'
  }
}
