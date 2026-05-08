export type LogLevel = "log" | "warn" | "error" | "fetch-req" | "fetch-res" | "fetch-err"

export interface LogEntry {
  id: string
  level: LogLevel
  message: string
  timestamp: Date
}

type Subscriber = (entries: LogEntry[]) => void

class LoggerStore {
  private entries: LogEntry[] = []
  private subscribers = new Set<Subscriber>()

  add(level: LogLevel, message: string) {
    this.entries = [
      ...this.entries,
      { id: crypto.randomUUID(), level, message, timestamp: new Date() },
    ]
    this.notify()
  }

  clear() {
    this.entries = []
    this.notify()
  }

  getEntries(): LogEntry[] {
    return this.entries
  }

  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn)
    fn(this.entries)
    return () => this.subscribers.delete(fn)
  }

  private notify() {
    this.subscribers.forEach((fn) => fn(this.entries))
  }
}

export const loggerStore = new LoggerStore()
