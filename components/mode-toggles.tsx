"use client"

import { Moon, Sun, Zap, TestTube } from "lucide-react"
import { useTheme } from "next-themes"
import { useDemoMode } from "@/lib/realtime"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { useEffect, useState } from "react"

export function ModeToggles() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const { isDemoMode, toggleDemoMode } = useDemoMode()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Sun className="h-4 w-4" />
        <span className="sr-only">Toggle modes</span>
      </Button>
    )
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          {theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="sr-only">Toggle modes</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Display & Mode</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
          {theme === "light" ? (
            <>
              <Moon className="mr-2 h-4 w-4" />
              <span>Switch to Dark Mode</span>
            </>
          ) : (
            <>
              <Sun className="mr-2 h-4 w-4" />
              <span>Switch to Light Mode</span>
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="px-2 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isDemoMode ? (
                <TestTube className="h-4 w-4 text-amber-500" />
              ) : (
                <Zap className="h-4 w-4 text-green-500" />
              )}
              <span className="text-sm font-medium">{isDemoMode ? "Demo Mode" : "Live Mode"}</span>
            </div>
            <Switch checked={isDemoMode} onCheckedChange={toggleDemoMode} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isDemoMode ? "Testing with simulated data" : "Connected to Jenga PGW"}
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
