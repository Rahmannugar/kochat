import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

const authRoutes = ["/sign-in", "/sign-up"]
const protectedPrefixes = ["/dashboard"]

export const proxy = async (request: NextRequest) => {
  const { pathname } = request.nextUrl
  const sessionCookie = getSessionCookie(request)

  const isAuthRoute = authRoutes.includes(pathname)
  const isProtectedRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix))

  if (!sessionCookie && isProtectedRoute) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  if (sessionCookie && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],
}
