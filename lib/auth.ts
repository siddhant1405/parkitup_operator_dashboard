import { AUTH_COOKIE_NAME } from "@/lib/constants"

export function setAuthCookie(email: string) {
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(
    email
  )}; path=/; max-age=${60 * 60 * 24 * 30}`
}

export function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`
}
