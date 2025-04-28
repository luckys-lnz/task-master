"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Clock, AlertCircle, Calendar } from "lucide-react"

interface TodoStatsProps {
  stats: {
    total: number
    completed: number
    pending: number
    overdue: number
    dueToday: number
  }
}

export function TodoStats({ stats }: TodoStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Overdue</p>
            <p className="text-2xl font-bold">{stats.overdue}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Due Today</p>
            <p className="text-2xl font-bold">{stats.dueToday}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-yellow-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
