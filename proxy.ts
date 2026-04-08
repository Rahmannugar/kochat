import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

const protectedPrefixes = ["/dashboard", "/onboarding", "/verify-email"]

export const proxy = async (request: NextRequest) => {
  const { pathname } = request.nextUrl
  const sessionCookie = getSessionCookie(request)

  const isProtectedRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix))

  if (!sessionCookie && isProtectedRoute) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding", "/verify-email", "/sign-in", "/sign-up"],
}
