"use client";

import TaskList from "@/components/task-list";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface DashboardClientProps {
  userName: string;
  dbConnected: boolean;
}

export function DashboardClient({ userName, dbConnected }: DashboardClientProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Hello, {userName}!</h1>
        <p className="text-muted-foreground">Manage your tasks below.</p>
      </div>
      {!dbConnected && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Database connection failed. Please check your DATABASE_URL in .env file.
            You can view the page, but data operations will not work.
          </AlertDescription>
        </Alert>
      )}
      <div>
        <TaskList />
      </div>
    </div>
  );
}
