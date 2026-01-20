"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Clock, AlertCircle, Calendar, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { CircularProgress } from "@/components/circular-progress"
import type { Task } from "@/lib/types"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns"

interface AnalyticsSectionProps {
  tasks: Task[]
}

export function AnalyticsSection({ tasks }: AnalyticsSectionProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 })

    const total = tasks.length
    const completed = tasks.filter(t => t.status === "COMPLETED").length
    const inProgress = tasks.filter(t => t.status === "PENDING").length
    const overdue = tasks.filter(t => {
      if (!t.dueDate || t.status === "COMPLETED") return false
      const dueDate = new Date(t.dueDate)
      if (t.dueTime) {
        const [hours, minutes] = t.dueTime.split(":").map(Number)
        dueDate.setHours(hours, minutes, 0, 0)
      } else {
        dueDate.setHours(23, 59, 59, 999)
      }
      return dueDate < now
    }).length

    const dueToday = tasks.filter(t => {
      if (!t.dueDate || t.status === "COMPLETED") return false
      return isSameDay(new Date(t.dueDate), today)
    }).length

    const completedThisWeek = tasks.filter(t => {
      if (t.status !== "COMPLETED" || !t.completedAt) return false
      const completedDate = new Date(t.completedAt)
      return completedDate >= weekStart && completedDate <= weekEnd
    }).length

    // Weekly activity data
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
    const weeklyActivity = weekDays.map(day => {
      const dayTasks = tasks.filter(t => {
        if (!t.dueDate) return false
        return isSameDay(new Date(t.dueDate), day)
      })
      return {
        day: format(day, "EEE"),
        date: day,
        count: dayTasks.length,
        completed: dayTasks.filter(t => t.status === "COMPLETED").length
      }
    })

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      total,
      completed,
      inProgress,
      overdue,
      dueToday,
      completedThisWeek,
      completionRate,
      weeklyActivity
    }
  }, [tasks])

  const statCards = [
    {
      key: "dueToday",
      label: "Due Today",
      value: stats.dueToday,
      icon: Calendar,
      color: "text-yellow-600 dark:text-yellow-400",
      valueColor: "text-yellow-700 dark:text-yellow-300",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20"
    },
    {
      key: "inProgress",
      label: "In Progress",
      value: stats.inProgress,
      icon: Clock,
      color: "text-blue-600 dark:text-blue-400",
      valueColor: "text-blue-700 dark:text-blue-300",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20"
    },
    {
      key: "overdue",
      label: "Overdue",
      value: stats.overdue,
      icon: AlertCircle,
      color: "text-red-600 dark:text-red-400",
      valueColor: "text-red-700 dark:text-red-300",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20"
    },
    {
      key: "completedWeek",
      label: "Completed",
      value: stats.completedThisWeek,
      icon: CheckCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      valueColor: "text-emerald-700 dark:text-emerald-300",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20"
    }
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Circular Progress & Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Circular Progress Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={mounted ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          whileHover={{ scale: 1.02, y: -4 }}
          whileTap={{ scale: 0.98 }}
          className="cursor-pointer"
        >
          <Card className="border-2 border-accent/20 bg-card/50 backdrop-blur-sm hover:border-accent/40 hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
            {/* Hover glow */}
            <motion.div
              className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              initial={false}
            />
            
            <CardContent className="p-4 sm:p-6 relative z-10">
              <div className="flex flex-col items-center justify-center space-y-5">
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  <CircularProgress
                    value={stats.completionRate}
                    size={110}
                    strokeWidth={8}
                    className="text-accent"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.span
                      className="text-3xl font-bold text-accent tabular-nums"
                      animate={mounted ? { scale: [0.8, 1.1, 1] } : { scale: 0.8 }}
                      transition={{ delay: 0.3, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                    >
                      {stats.completionRate}%
                    </motion.span>
                  </div>
                </motion.div>
                <div className="text-center space-y-1.5">
                  <motion.p
                    className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors duration-300"
                    whileHover={{ x: 2 }}
                  >
                    Overall Progress
                  </motion.p>
                  <p className="text-xs font-medium text-muted-foreground">
                    {stats.completed} of {stats.total} tasks completed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={mounted ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1, duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-pointer"
              >
                <motion.div
                  whileHover={{
                    boxShadow: [
                      "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                      "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
                    ]
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={cn(
                    "border-2 h-full transition-all duration-300 relative overflow-hidden group",
                    stat.borderColor,
                    stat.bgColor,
                    "hover:border-opacity-40 hover:shadow-lg"
                  )}>
                    {/* Hover glow effect */}
                    <motion.div
                      className={cn(
                        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                        stat.bgColor.replace("/10", "/20")
                      )}
                      initial={false}
                    />
                    
                    <CardContent className="p-4 relative z-10">
                      <div className="flex flex-col space-y-3">
                        {/* Icon with animation */}
                        <motion.div
                          className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300",
                            stat.bgColor,
                            "group-hover:scale-110 group-hover:rotate-3"
                          )}
                          whileHover={{ rotate: [0, -5, 5, 0] }}
                          transition={{ duration: 0.5 }}
                        >
                          <motion.div
                            animate={{
                              scale: [1, 1.1, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          >
                            <Icon className={cn("h-5 w-5", stat.color)} strokeWidth={2.5} />
                          </motion.div>
                        </motion.div>

                        {/* Text content with better hierarchy */}
                        <div className="space-y-1">
                          <motion.p
                            className={cn(
                              "text-[11px] font-semibold uppercase tracking-wider",
                              "text-muted-foreground group-hover:text-foreground transition-colors duration-300"
                            )}
                            whileHover={{ x: 2 }}
                          >
                            {stat.label}
                          </motion.p>
                          <motion.p
                            className={cn(
                              "text-3xl font-bold tabular-nums",
                              stat.valueColor,
                              "group-hover:scale-105 transition-transform duration-300"
                            )}
                            animate={mounted ? { scale: [0.8, 1] } : { scale: 0.8 }}
                            transition={{ delay: 0.2 + index * 0.1, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                          >
                            {stat.value}
                          </motion.p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Weekly Activity Chart */}
      {stats.weeklyActivity.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.4, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm hover:border-accent/30 hover:shadow-lg transition-all duration-300 group">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <motion.h3
                    className="text-base font-bold text-foreground group-hover:text-accent transition-colors duration-300"
                    whileHover={{ x: 2 }}
                  >
                    Weekly Activity
                  </motion.h3>
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </motion.div>
                </div>
              <div className="flex items-end justify-between gap-2 h-32">
                {stats.weeklyActivity.map((day, index) => {
                  const maxCount = Math.max(...stats.weeklyActivity.map(d => d.count), 1)
                  const height = day.count > 0 ? (day.count / maxCount) * 100 : 5
                  
                  return (
                    <motion.div
                      key={day.day}
                      initial={{ height: 0 }}
                      animate={mounted ? { height: `${height}%` } : { height: 0 }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.5, ease: "easeOut" }}
                      className="flex-1 flex flex-col items-center justify-end gap-1"
                    >
                      <div className="w-full bg-accent/20 rounded-t-lg relative group">
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={mounted ? { scaleY: 1 } : { scaleY: 0 }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.5, ease: "easeOut" }}
                          className="w-full bg-gradient-to-t from-accent to-accent/80 rounded-t-lg origin-bottom"
                          style={{ height: `${height}%` }}
                        />
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-foreground text-background text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                            {day.count} {day.count === 1 ? 'task' : 'tasks'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {day.day}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      )}
    </div>
  )
}
