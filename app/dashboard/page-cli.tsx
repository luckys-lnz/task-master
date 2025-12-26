"use client";

import { useState, useEffect } from "react";
import TaskList from "@/components/task-list";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardClientProps {
  userName: string;
  dbConnected: boolean;
}

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const getMotivationalMessage = () => {
  const messages = [
    "Let's make today productive!",
    "You've got this!",
    "Time to shine!",
    "Let's accomplish great things!",
    "Ready to tackle your goals?",
  ];
  // Use date-based seed for deterministic selection (same message for same day)
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return messages[dayOfYear % messages.length];
};

export function DashboardClient({ userName, dbConnected }: DashboardClientProps) {
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState(getTimeBasedGreeting());
  // Use deterministic message selection to avoid hydration mismatch
  const motivationalMessage = getMotivationalMessage();

  useEffect(() => {
    setMounted(true);
    // Update greeting every hour
    const interval = setInterval(() => {
      setGreeting(getTimeBasedGreeting());
    }, 3600000); // 1 hour

    return () => clearInterval(interval);
  }, []);

  const firstName = userName?.split(" ")[0] || "User";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Enhanced Header Section */}
        <div className="mb-8 space-y-6">
          <div
            className={cn(
              "transition-spring-smooth",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
            style={{
              transitionTimingFunction: "var(--spring-ease-out-back)",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {greeting}, {firstName}! 👋
                </h1>
                <p className="text-lg text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {motivationalMessage}
                </p>
              </div>
            </div>
          </div>

          {!dbConnected && (
            <Alert variant="destructive" className="mb-4 animate-in slide-in-from-top-2 duration-500">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Database connection failed. Please check your DATABASE_URL in .env file.
                You can view the page, but data operations will not work.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Task List Section */}
        <div
          className={cn(
            "transition-spring-smooth",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
          style={{
            transitionDelay: "150ms",
            transitionTimingFunction: "var(--spring-ease-out-back)",
          }}
        >
          <TaskList />
        </div>
      </div>
    </div>
  );
}
