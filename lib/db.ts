import fs from 'fs'
import path from 'path'
import { Project } from '@/types'
import { pgEnabled, query } from '@/lib/pg'

// ── Local JSON fallback ────────────────────────────────────────────────────────
const DB_PATH = path.join(process.cwd(), 'data', 'projects.json')

function ensureDb() {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '[]', 'utf-8')
}

function jsonReadProjects(): Project[] {
  ensureDb()
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')) as Project[]
  } catch {
    return []
  }
}

function jsonWriteProjects(projects: Project[]): void {
  ensureDb()
  fs.writeFileSync(DB_PATH, JSON.stringify(projects, null, 2), 'utf-8')
}

function jsonSaveProject(project: Project): void {
  const projects = jsonReadProjects()
  const idx = projects.findIndex((p) => p.id === project.id)
  if (idx >= 0) {
    projects[idx] = project
  } else {
    projects.push(project)
  }
  jsonWriteProjects(projects)
}

// ═══════════════════════════════════════════════════════════════════════════════
// Public API — postgres (via pg) is primary, JSON is fallback
// ═══════════════════════════════════════════════════════════════════════════════

export async function readProjects(): Promise<Project[]> {
  if (pgEnabled) {
    try {
      const rows = await query<{ data: Project }>(
        'SELECT data FROM projects ORDER BY created_at DESC'
      )
      return rows.map((r) => r.data)
    } catch (err) {
      console.error('[db] pg readProjects failed, using JSON fallback:', err)
    }
  }
  return jsonReadProjects()
}

export async function writeProjects(projects: Project[]): Promise<void> {
  if (pgEnabled) {
    try {
      for (const p of projects) {
        await query(
          `INSERT INTO projects (id, admin_token, client_token, data, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE
             SET admin_token = EXCLUDED.admin_token,
                 client_token = EXCLUDED.client_token,
                 data = EXCLUDED.data,
                 updated_at = EXCLUDED.updated_at`,
          [p.id, p.adminToken, p.clientToken, p, p.createdAt, new Date().toISOString()]
        )
      }
      jsonWriteProjects(projects)
      return
    } catch (err) {
      console.error('[db] pg writeProjects failed, using JSON fallback:', err)
    }
  }
  jsonWriteProjects(projects)
}

export async function getProject(id: string): Promise<Project | undefined> {
  if (pgEnabled) {
    try {
      const rows = await query<{ data: Project }>(
        'SELECT data FROM projects WHERE id = $1',
        [id]
      )
      return rows[0]?.data
    } catch (err) {
      console.error('[db] pg getProject failed, using JSON fallback:', err)
    }
  }
  return jsonReadProjects().find((p) => p.id === id)
}

export async function getProjectByAdminToken(token: string): Promise<Project | undefined> {
  if (pgEnabled) {
    try {
      const rows = await query<{ data: Project }>(
        'SELECT data FROM projects WHERE admin_token = $1',
        [token]
      )
      return rows[0]?.data
    } catch (err) {
      console.error('[db] pg getProjectByAdminToken failed, using JSON fallback:', err)
    }
  }
  return jsonReadProjects().find((p) => p.adminToken === token)
}

export async function getProjectByClientToken(token: string): Promise<Project | undefined> {
  if (pgEnabled) {
    try {
      const rows = await query<{ data: Project }>(
        'SELECT data FROM projects WHERE client_token = $1',
        [token]
      )
      return rows[0]?.data
    } catch (err) {
      console.error('[db] pg getProjectByClientToken failed, using JSON fallback:', err)
    }
  }
  return jsonReadProjects().find((p) => p.clientToken === token)
}

export async function saveProject(project: Project): Promise<void> {
  if (pgEnabled) {
    try {
      await query(
        `INSERT INTO projects (id, admin_token, client_token, data, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE
           SET admin_token = EXCLUDED.admin_token,
               client_token = EXCLUDED.client_token,
               data = EXCLUDED.data,
               updated_at = EXCLUDED.updated_at`,
        [project.id, project.adminToken, project.clientToken, project, project.createdAt, new Date().toISOString()]
      )
      jsonSaveProject(project) // keep fallback in sync
      return
    } catch (err) {
      console.error('[db] pg saveProject failed, using JSON fallback:', err)
    }
  }
  jsonSaveProject(project)
}

export async function updateProject(
  id: string,
  updates: Partial<Project>
): Promise<Project | null> {
  if (pgEnabled) {
    try {
      const rows = await query<{ data: Project }>(
        'SELECT data FROM projects WHERE id = $1',
        [id]
      )
      if (!rows[0]) return null

      const merged: Project = {
        ...rows[0].data,
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      await query(
        `UPDATE projects
         SET admin_token = $2, client_token = $3, data = $4, updated_at = $5
         WHERE id = $1`,
        [merged.id, merged.adminToken, merged.clientToken, merged, merged.updatedAt]
      )

      jsonSaveProject(merged) // keep fallback in sync
      return merged
    } catch (err) {
      console.error('[db] pg updateProject failed, using JSON fallback:', err)
    }
  }

  // JSON fallback
  const projects = jsonReadProjects()
  const idx = projects.findIndex((p) => p.id === id)
  if (idx < 0) return null
  projects[idx] = { ...projects[idx], ...updates, updatedAt: new Date().toISOString() }
  jsonWriteProjects(projects)
  return projects[idx]
}
