"use client"

import { useSyncExternalStore } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { LogOut, MapPin, Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { clearAuthCookie } from "@/lib/auth"

function useHasMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useHasMounted()

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="rounded-lg"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}

export default function SitesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  function handleLogout() {
    clearAuthCookie()
    router.push("/login")
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-background px-4 py-3">
        <Link
          href="/sites"
          className="flex items-center gap-2 font-heading font-semibold"
        >
          <MapPin className="h-5 w-5 text-primary" />
          ParkItUp Operator
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="sm" className="rounded-lg" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </div>
      </header>
      <main className="flex-1 px-4 py-6">{children}</main>
    </div>
  )
}
