"use client"

import * as React from "react"

type Theme = "light" | "dark" | "system"

type ThemeContextValue = {
  theme: Theme
  resolvedTheme: Exclude<Theme, "system">
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

function getSystemTheme(): Exclude<Theme, "system"> {
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark"
  }

  return "light"
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") {
    return
  }

  const resolvedTheme = theme === "system" ? getSystemTheme() : theme
  document.documentElement.classList.toggle("dark", resolvedTheme === "dark")
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

function ThemeHotkey({ resolvedTheme, setTheme }: Pick<ThemeContextValue, "resolvedTheme" | "setTheme">) {
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key?.toLowerCase() !== "d") return
      if (isTypingTarget(event.target)) return

      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }

    window.addEventListener("keydown", onKeyDown)

    return () => window.removeEventListener("keydown", onKeyDown)
  }, [resolvedTheme, setTheme])

  return null
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "system"
    }

    const storedTheme = window.localStorage.getItem("theme") as Theme | null

    if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
      return storedTheme
    }

    return "system"
  })

  React.useEffect(() => {
    applyTheme(theme)
  }, [theme])

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

    function onChange() {
      if ((window.localStorage.getItem("theme") as Theme | null) === "system") {
        applyTheme("system")
      }
    }

    mediaQuery.addEventListener("change", onChange)

    return () => mediaQuery.removeEventListener("change", onChange)
  }, [])

  const resolvedTheme = theme === "system" ? getSystemTheme() : theme

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme: (nextTheme: Theme) => {
        window.localStorage.setItem("theme", nextTheme)
        setThemeState(nextTheme)
        applyTheme(nextTheme)
      },
    }),
    [theme, resolvedTheme]
  )

  return (
    <ThemeContext.Provider value={value}>
      <ThemeHotkey resolvedTheme={resolvedTheme} setTheme={value.setTheme} />
      {children}
    </ThemeContext.Provider>
  )
}

function useTheme() {
  const context = React.useContext(ThemeContext)

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }

  return context
}

export { ThemeProvider, useTheme }
