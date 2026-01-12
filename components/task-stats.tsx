"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Clock, AlertCircle, Calendar, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface TodoStatsProps {
  stats: {
    total: number
    completed: number
    pending: number
    overdue: number
    dueToday: number
  }
  onStatClick?: (statKey: "total" | "completed" | "pending" | "overdue" | "dueToday") => void
}

const statConfig = [
  {
    key: "total" as const,
    label: "Total Tasks",
    icon: Clock,
    color: "primary",
    bgGradient: "from-primary/20 to-primary/10",
    iconColor: "text-primary",
    borderColor: "border-primary/20",
  },
  {
    key: "completed" as const,
    label: "Completed",
    icon: CheckCircle,
    color: "green",
    bgGradient: "from-green-500/20 to-green-600/10",
    iconColor: "text-green-600 dark:text-green-400",
    borderColor: "border-green-500/20",
  },
  {
    key: "pending" as const,
    label: "Pending",
    icon: Clock,
    color: "blue",
    bgGradient: "from-blue-500/20 to-blue-600/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-500/20",
  },
  {
    key: "overdue" as const,
    label: "Overdue",
    icon: AlertCircle,
    color: "red",
    bgGradient: "from-red-500/20 to-red-600/10",
    iconColor: "text-red-600 dark:text-red-400",
    borderColor: "border-red-500/20",
  },
  {
    key: "dueToday" as const,
    label: "Due Today",
    icon: Calendar,
    color: "yellow",
    bgGradient: "from-yellow-500/20 to-yellow-600/10",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    borderColor: "border-yellow-500/20",
  },
]

export function TodoStats({ stats, onStatClick }: TodoStatsProps) {
  const [mounted, setMounted] = useState(false)
  const [animatedStats, setAnimatedStats] = useState(stats)

  useEffect(() => {
    setMounted(true)
    // Animate numbers
    const duration = 1000
    const steps = 30
    const stepDuration = duration / steps

    statConfig.forEach((config) => {
      const targetValue = stats[config.key]
      const startValue = 0
      const increment = targetValue / steps

      let currentStep = 0
      const timer = setInterval(() => {
        currentStep++
        const currentValue = Math.min(
          Math.floor(startValue + increment * currentStep),
          targetValue
        )

        setAnimatedStats((prev) => ({
          ...prev,
          [config.key]: currentValue,
        }))

        if (currentStep >= steps) {
          clearInterval(timer)
          setAnimatedStats((prev) => ({
            ...prev,
            [config.key]: targetValue,
          }))
        }
      }, stepDuration)
    })
  }, [stats])

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statConfig.map((config, index) => {
          const Icon = config.icon
          const value = animatedStats[config.key]

          return (
            <Card
              key={config.key}
              className={cn(
                "border-2 transition-spring hover:shadow-lg hover:scale-[1.02] group overflow-hidden relative",
                config.borderColor,
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
                onStatClick && "cursor-pointer active:scale-[0.98]"
              )}
              style={{
                transitionDelay: `${index * 50}ms`,
                transitionTimingFunction: "var(--spring-ease-out-back)",
              }}
              onClick={() => onStatClick?.(config.key)}
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300", config.bgGradient)} />
              <CardContent className="p-5 relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center group-hover:scale-110 transition-transform duration-300", config.bgGradient)}>
                    <Icon className={cn("h-5 w-5", config.iconColor)} />
                  </div>
                  {config.key === "completed" && completionRate > 0 && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400">
                      <TrendingUp className="h-3 w-3" />
                      <span>{completionRate}%</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {config.label}
                  </p>
                  <p className="text-3xl font-bold tabular-nums transition-all duration-300">
                    {value}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Progress Bar */}
      {stats.total > 0 && (
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-bold text-primary">{completionRate}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
