"use client";

import TaskList from "@/components/task-list";

interface DashboardClientProps {
  userName: string;
}

export function DashboardClient({ userName }: DashboardClientProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Hello, {userName}!</h1>
        <p className="text-muted-foreground">Manage your tasks below.</p>
      </div>
      <div>
        <TaskList />
      </div>
    </div>
  );
}
