import fs from 'fs'
import path from 'path'

export interface DemoSession {
  id: string
  createdAt: string
  lastActiveAt: string
  tabsUsed: string[]
  submissions: Record<string, number>
}

const DB_PATH = path.join(process.cwd(), 'data', 'demo-sessions.json')

function ensureDb() {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '[]', 'utf-8')
}

export function readDemoSessions(): DemoSession[] {
  ensureDb()
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as DemoSession[]
  } catch {
    return []
  }
}

export function logDemoActivity(sessionId: string, service: string): void {
  ensureDb()
  const sessions = readDemoSessions()
  const now = new Date().toISOString()
  const idx = sessions.findIndex((s) => s.id === sessionId)

  if (idx >= 0) {
    const session = sessions[idx]
    session.lastActiveAt = now
    if (!session.tabsUsed.includes(service)) {
      session.tabsUsed.push(service)
    }
    session.submissions[service] = (session.submissions[service] ?? 0) + 1
    sessions[idx] = session
  } else {
    sessions.push({
      id: sessionId,
      createdAt: now,
      lastActiveAt: now,
      tabsUsed: [service],
      submissions: { [service]: 1 },
    })
  }

  // Keep only the most recent 2000 sessions
  const trimmed = sessions.slice(-2000)
  fs.writeFileSync(DB_PATH, JSON.stringify(trimmed, null, 2), 'utf-8')
}
