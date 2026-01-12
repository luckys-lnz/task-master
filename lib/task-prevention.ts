import type { Task } from "@/lib/types";
import { getTimeUntilDue, formatTimeRemaining } from "@/lib/utils";

/**
 * Get warning level for a task based on time until due
 * Returns notification recommendations
 */
export interface TaskWarning {
  level: "none" | "info" | "warning" | "critical";
  message: string;
  shouldNotify: boolean;
  timeRemaining: string | null;
}

export function getTaskWarning(task: Task): TaskWarning {
  if (task.status === "COMPLETED") {
    return {
      level: "none",
      message: "",
      shouldNotify: false,
      timeRemaining: null,
    };
  }

  if (task.status === "OVERDUE") {
    return {
      level: "critical",
      message: "This task is overdue",
      shouldNotify: true,
      timeRemaining: task.overdueAt 
        ? formatTimeRemaining(new Date().getTime() - new Date(task.overdueAt).getTime())
        : "Overdue",
    };
  }

  if (!task.dueDate) {
    return {
      level: "none",
      message: "",
      shouldNotify: false,
      timeRemaining: null,
    };
  }

  const timeUntilDue = getTimeUntilDue({
    due_date: new Date(task.dueDate),
    due_time: task.dueTime || null,
  });

  if (timeUntilDue === null) {
    return {
      level: "none",
      message: "",
      shouldNotify: false,
      timeRemaining: null,
    };
  }

  const hoursUntilDue = timeUntilDue / (1000 * 60 * 60);

  if (timeUntilDue < 0) {
    return {
      level: "critical",
      message: "This task is overdue",
      shouldNotify: true,
      timeRemaining: formatTimeRemaining(timeUntilDue),
    };
  } else if (hoursUntilDue <= 1) {
    return {
      level: "critical",
      message: "Due in less than 1 hour",
      shouldNotify: true,
      timeRemaining: formatTimeRemaining(timeUntilDue),
    };
  } else if (hoursUntilDue <= 3) {
    return {
      level: "warning",
      message: "Due in less than 3 hours",
      shouldNotify: true,
      timeRemaining: formatTimeRemaining(timeUntilDue),
    };
  } else if (hoursUntilDue <= 24) {
    return {
      level: "warning",
      message: "Due within 24 hours",
      shouldNotify: true,
      timeRemaining: formatTimeRemaining(timeUntilDue),
    };
  } else {
    return {
      level: "info",
      message: "Upcoming task",
      shouldNotify: false,
      timeRemaining: formatTimeRemaining(timeUntilDue),
    };
  }
}

/**
 * Calculate task health score
 * Returns a score from 0-100 where:
 * - 100 = Healthy (plenty of time)
 * - 50-99 = At risk (approaching deadline)
 * - 0-49 = Critical (overdue or very close)
 */
export function calculateTaskHealthScore(task: Task): number {
  if (task.status === "COMPLETED") {
    return 100; // Completed tasks are always "healthy"
  }

  if (task.status === "OVERDUE") {
    return 0; // Overdue tasks are critical
  }

  if (!task.dueDate) {
    return 100; // No due date = no risk
  }

  const timeUntilDue = getTimeUntilDue({
    due_date: new Date(task.dueDate),
    due_time: task.dueTime || null,
  });

  if (timeUntilDue === null || timeUntilDue < 0) {
    return 0;
  }

  const hoursUntilDue = timeUntilDue / (1000 * 60 * 60);
  const daysUntilDue = hoursUntilDue / 24;

  // Score calculation:
  // - More than 7 days: 100
  // - 3-7 days: 80-99
  // - 1-3 days: 60-79
  // - 12-24 hours: 40-59
  // - 3-12 hours: 20-39
  // - 1-3 hours: 10-19
  // - Less than 1 hour: 0-9

  if (daysUntilDue > 7) {
    return 100;
  } else if (daysUntilDue >= 3) {
    return 80 + Math.floor((daysUntilDue - 3) / 4 * 19);
  } else if (daysUntilDue >= 1) {
    return 60 + Math.floor((daysUntilDue - 1) / 2 * 19);
  } else if (hoursUntilDue >= 12) {
    return 40 + Math.floor((hoursUntilDue - 12) / 12 * 19);
  } else if (hoursUntilDue >= 3) {
    return 20 + Math.floor((hoursUntilDue - 3) / 9 * 19);
  } else if (hoursUntilDue >= 1) {
    return 10 + Math.floor((hoursUntilDue - 1) / 2 * 9);
  } else {
    return Math.floor(hoursUntilDue * 10);
  }
}

/**
 * Get health status label
 */
export function getHealthStatusLabel(score: number): "Healthy" | "At Risk" | "Critical" {
  if (score >= 80) {
    return "Healthy";
  } else if (score >= 40) {
    return "At Risk";
  } else {
    return "Critical";
  }
}

/**
 * Check if task should trigger a notification
 */
export function shouldNotifyTask(task: Task): boolean {
  const warning = getTaskWarning(task);
  return warning.shouldNotify;
}

/**
 * Get suggested actions for at-risk tasks
 */
export interface SuggestedAction {
  type: "reschedule" | "reassign" | "extend" | "prioritize";
  message: string;
  priority: "low" | "medium" | "high";
}

export function getSuggestedActions(task: Task): SuggestedAction[] {
  const actions: SuggestedAction[] = [];
  const healthScore = calculateTaskHealthScore(task);
  const warning = getTaskWarning(task);

  if (healthScore < 40) {
    actions.push({
      type: "prioritize",
      message: "Consider prioritizing this task",
      priority: "high",
    });

    if (task.dueDate) {
      actions.push({
        type: "reschedule",
        message: "Consider rescheduling if not urgent",
        priority: "medium",
      });
    }
  } else if (healthScore < 80) {
    actions.push({
      type: "prioritize",
      message: "Keep this task in focus",
      priority: "medium",
    });
  }

  if (warning.level === "critical" && task.dueDate) {
    actions.push({
      type: "extend",
      message: "Request deadline extension if needed",
      priority: "high",
    });
  }

  return actions;
}
