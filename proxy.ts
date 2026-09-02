import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { AUTH_COOKIE_NAME } from "@/lib/constants"

export function proxy(request: NextRequest) {
  const isAuthed = !!request.cookies.get(AUTH_COOKIE_NAME)?.value
  const isLoginPage = request.nextUrl.pathname === "/login"

  if (!isAuthed && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isAuthed && isLoginPage) {
    return NextResponse.redirect(new URL("/sites", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
