import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "@/lib/auth"

const publicPaths = ["/login", "/register"]
const protectedPaths = ["/dashboard", "/tenants", "/payments", "/analytics", "/settings"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get session token
  const token = request.cookies.get("session")?.value

  // Check if path is protected
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))

  // If accessing protected path without token, redirect to login
  if (isProtectedPath && !token) {
    const url = new URL("/login", request.url)
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // If accessing public path with valid token, redirect to dashboard
  if (isPublicPath && token) {
    const session = await verifyToken(token)
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  // Verify token for protected paths
  if (isProtectedPath && token) {
    const session = await verifyToken(token)
    if (!session) {
      // Invalid token, clear it and redirect to login
      const response = NextResponse.redirect(new URL("/login", request.url))
      response.cookies.delete("session")
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
