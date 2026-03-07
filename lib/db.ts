import fs from 'fs'
import path from 'path'
import { Project } from '@/types'
import { supabase, supabaseEnabled } from '@/lib/supabase'

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

// Keep the local JSON file in sync after every Supabase write so the
// fallback is always up to date if Supabase ever becomes unavailable.
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
// Public API — all functions are async; Supabase is primary, JSON is fallback
// ═══════════════════════════════════════════════════════════════════════════════

export async function readProjects(): Promise<Project[]> {
  if (supabaseEnabled) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('data')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []).map((row) => row.data as Project)
    } catch (err) {
      console.error('[db] Supabase readProjects failed, using JSON fallback:', err)
    }
  }
  return jsonReadProjects()
}

export async function writeProjects(projects: Project[]): Promise<void> {
  // writeProjects is a bulk-replace used only by the add-client admin route.
  // With Supabase we upsert each project individually instead.
  if (supabaseEnabled) {
    try {
      const rows = projects.map((p) => ({
        id: p.id,
        admin_token: p.adminToken,
        client_token: p.clientToken,
        data: p,
        updated_at: new Date().toISOString(),
      }))
      const { error } = await supabase
        .from('projects')
        .upsert(rows, { onConflict: 'id' })
      if (error) throw error
      jsonWriteProjects(projects)
      return
    } catch (err) {
      console.error('[db] Supabase writeProjects failed, using JSON fallback:', err)
    }
  }
  jsonWriteProjects(projects)
}

export async function getProject(id: string): Promise<Project | undefined> {
  if (supabaseEnabled) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('data')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      if (data) return data.data as Project
      return undefined
    } catch (err) {
      console.error('[db] Supabase getProject failed, using JSON fallback:', err)
    }
  }
  return jsonReadProjects().find((p) => p.id === id)
}

export async function getProjectByAdminToken(token: string): Promise<Project | undefined> {
  if (supabaseEnabled) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('data')
        .eq('admin_token', token)
        .maybeSingle()
      if (error) throw error
      if (data) return data.data as Project
      return undefined
    } catch (err) {
      console.error('[db] Supabase getProjectByAdminToken failed, using JSON fallback:', err)
    }
  }
  return jsonReadProjects().find((p) => p.adminToken === token)
}

export async function getProjectByClientToken(token: string): Promise<Project | undefined> {
  if (supabaseEnabled) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('data')
        .eq('client_token', token)
        .maybeSingle()
      if (error) throw error
      if (data) return data.data as Project
      return undefined
    } catch (err) {
      console.error('[db] Supabase getProjectByClientToken failed, using JSON fallback:', err)
    }
  }
  return jsonReadProjects().find((p) => p.clientToken === token)
}

export async function saveProject(project: Project): Promise<void> {
  if (supabaseEnabled) {
    try {
      const { error } = await supabase
        .from('projects')
        .upsert(
          {
            id: project.id,
            admin_token: project.adminToken,
            client_token: project.clientToken,
            data: project,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
      if (error) throw error
      jsonSaveProject(project) // keep fallback in sync
      return
    } catch (err) {
      console.error('[db] Supabase saveProject failed, using JSON fallback:', err)
    }
  }
  jsonSaveProject(project)
}

export async function updateProject(
  id: string,
  updates: Partial<Project>
): Promise<Project | null> {
  if (supabaseEnabled) {
    try {
      // Fetch current data, merge updates, write back
      const { data: existing, error: fetchErr } = await supabase
        .from('projects')
        .select('data')
        .eq('id', id)
        .maybeSingle()
      if (fetchErr) throw fetchErr
      if (!existing) return null

      const merged: Project = {
        ...(existing.data as Project),
        ...updates,
        updatedAt: new Date().toISOString(),
      }

      const { error: upsertErr } = await supabase
        .from('projects')
        .upsert(
          {
            id: merged.id,
            admin_token: merged.adminToken,
            client_token: merged.clientToken,
            data: merged,
            updated_at: merged.updatedAt,
          },
          { onConflict: 'id' }
        )
      if (upsertErr) throw upsertErr

      jsonSaveProject(merged) // keep fallback in sync
      return merged
    } catch (err) {
      console.error('[db] Supabase updateProject failed, using JSON fallback:', err)
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
