import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'client_token'
const THIRTY_DAYS = 30 * 24 * 60 * 60 // seconds

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Extract clientToken from /client/dashboard/[clientToken]
  const match = pathname.match(/^\/client\/dashboard\/([^/]+)/)
  if (!match) return NextResponse.next()

  const clientToken = match[1]
  const response = NextResponse.next()

  response.cookies.set(COOKIE_NAME, clientToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: THIRTY_DAYS,
    path: '/',
  })

  return response
}

export const config = {
  matcher: '/client/dashboard/:path*',
}
