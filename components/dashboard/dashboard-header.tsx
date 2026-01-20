"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Settings, Plus } from "lucide-react"

interface DashboardHeaderProps {
  onQuickAdd?: () => void
}

export function DashboardHeader({ onQuickAdd }: DashboardHeaderProps) {
  const { data: session } = useSession()
  const userInitials = session?.user?.name?.charAt(0).toUpperCase() || "U"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* App Name */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
              TaskMaster
            </h1>
          </Link>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Quick Add Button (Desktop) */}
            {onQuickAdd && (
              <Button
                onClick={onQuickAdd}
                size="sm"
                className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm font-medium">Add Task</span>
              </Button>
            )}

            {/* Settings */}
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </Link>

            {/* Profile Avatar */}
            <Link href="/profile">
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                <Avatar className="h-9 w-9 ring-2 ring-emerald-500/20">
                  <AvatarImage 
                    src={session?.user?.image || undefined} 
                    alt={session?.user?.name || "User"} 
                  />
                  <AvatarFallback className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
