import fs from 'fs'
import path from 'path'
import { Project } from '@/types'

const DB_PATH = path.join(process.cwd(), 'data', 'projects.json')

function ensureDb() {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '[]', 'utf-8')
}

export function readProjects(): Project[] {
  ensureDb()
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8')
    return JSON.parse(raw) as Project[]
  } catch {
    return []
  }
}

export function writeProjects(projects: Project[]): void {
  ensureDb()
  fs.writeFileSync(DB_PATH, JSON.stringify(projects, null, 2), 'utf-8')
}

export function getProject(id: string): Project | undefined {
  return readProjects().find((p) => p.id === id)
}

export function getProjectByAdminToken(token: string): Project | undefined {
  return readProjects().find((p) => p.adminToken === token)
}

export function getProjectByClientToken(token: string): Project | undefined {
  return readProjects().find((p) => p.clientToken === token)
}

export function saveProject(project: Project): void {
  const projects = readProjects()
  const idx = projects.findIndex((p) => p.id === project.id)
  if (idx >= 0) {
    projects[idx] = project
  } else {
    projects.push(project)
  }
  writeProjects(projects)
}

export function updateProject(id: string, updates: Partial<Project>): Project | null {
  const projects = readProjects()
  const idx = projects.findIndex((p) => p.id === id)
  if (idx < 0) return null
  projects[idx] = { ...projects[idx], ...updates, updatedAt: new Date().toISOString() }
  writeProjects(projects)
  return projects[idx]
}
