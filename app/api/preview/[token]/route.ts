import { NextRequest, NextResponse } from 'next/server'
import { getProjectByAdminToken, getProjectByClientToken } from '@/lib/db'
import { isAdminAuthenticated } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Try admin token first (admin must be authenticated)
  let project = getProjectByAdminToken(token)
  if (project) {
    if (!(await isAdminAuthenticated())) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
  } else {
    // Try client token
    project = getProjectByClientToken(token)
    if (!project) {
      return new NextResponse('Not Found', { status: 404 })
    }
  }

  if (!project.generatedHtml) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:monospace;padding:40px;background:#080c10;color:#8ab8b5;">
        <p>Website generation is in progress. Please check back soon.</p>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  return new NextResponse(project.generatedHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'SAMEORIGIN',
    },
  })
}
