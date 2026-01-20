"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  PlusCircle, 
  CheckSquare2, 
  SearchX, 
  Rocket,
  Zap,
  FilterX,
  ListTodo
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedEmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "default" | "tasks" | "filtered";
  filterType?: "all" | "today" | "upcoming" | "inProgress" | "completed" | "overdue";
}

export function EnhancedEmptyState({
  title,
  description,
  actionLabel = "Get Started",
  onAction,
  variant = "default",
  filterType,
}: EnhancedEmptyStateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Color mapping based on filter type (matching stats card colors)
  const getFilterColors = (filter?: string) => {
    switch (filter) {
      case "today":
        return {
          gradient: "from-yellow-500/20 via-amber-500/20 to-orange-500/20",
          iconColor: "text-yellow-600 dark:text-yellow-400",
          accentColor: "bg-yellow-500/10 border-yellow-500/20",
        };
      case "inProgress":
        return {
          gradient: "from-blue-500/20 via-indigo-500/20 to-purple-500/20",
          iconColor: "text-blue-600 dark:text-blue-400",
          accentColor: "bg-blue-500/10 border-blue-500/20",
        };
      case "overdue":
        return {
          gradient: "from-red-500/20 via-rose-500/20 to-pink-500/20",
          iconColor: "text-red-600 dark:text-red-400",
          accentColor: "bg-red-500/10 border-red-500/20",
        };
      case "completed":
        return {
          gradient: "from-emerald-500/20 via-teal-500/20 to-cyan-500/20",
          iconColor: "text-emerald-600 dark:text-emerald-400",
          accentColor: "bg-emerald-500/10 border-emerald-500/20",
        };
      case "upcoming":
        return {
          gradient: "from-cyan-500/20 via-sky-500/20 to-blue-500/20",
          iconColor: "text-cyan-600 dark:text-cyan-400",
          accentColor: "bg-cyan-500/10 border-cyan-500/20",
        };
      default:
        return {
          gradient: "from-emerald-500/20 via-teal-500/20 to-cyan-500/20",
          iconColor: "text-emerald-600 dark:text-emerald-400",
          accentColor: "bg-emerald-500/10 border-emerald-500/20",
        };
    }
  };

  const filterColors = getFilterColors(filterType);

  const variants = {
    default: {
      icons: [CheckSquare2, ListTodo],
      title: title || "Ready to get things done?",
      description: description || "Your task list is empty. Start by creating your first task and begin your journey to productivity.",
      ...filterColors,
    },
    tasks: {
      icons: [Rocket, Zap],
      title: "Let's build something amazing",
      description: "Every great achievement starts with a single task. Create your first task and watch your productivity take flight!",
      ...filterColors,
    },
    filtered: {
      icons: [SearchX, FilterX],
      title: title || "No matches found",
      description: description || "Your current filters don't match any tasks. Try adjusting your search criteria or create a new task that fits.",
      ...filterColors,
    },
  };

  const config = variants[variant];
  const [PrimaryIcon, SecondaryIcon] = config.icons;

  return (
    <Card className={cn(
      "border-2 overflow-hidden relative",
      config.accentColor,
      "shadow-lg shadow-black/5 dark:shadow-black/20"
    )}>
      <CardContent className="p-12 sm:p-16 md:p-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col items-center justify-center text-center space-y-8"
        >
          {/* Animated Icon Composition */}
          <motion.div
            className="relative"
            initial={{ scale: 0, rotate: -180 }}
            animate={mounted ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
            transition={{ 
              duration: 0.6, 
              ease: [0.34, 1.56, 0.64, 1],
              delay: 0.1
            }}
          >
            {/* Main Icon Container */}
            <div className={cn(
              "relative h-28 w-28 rounded-3xl bg-gradient-to-br flex items-center justify-center",
              config.gradient,
              "shadow-xl shadow-black/10"
            )}>
              {/* Glow effect */}
              <motion.div
                className={cn(
                  "absolute inset-0 rounded-3xl bg-gradient-to-br opacity-0",
                  config.gradient
                )}
                animate={{
                  opacity: [0, 0.3, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Primary Icon */}
              <motion.div
                animate={{
                  y: [0, -4, 0],
                  rotate: [0, 5, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <PrimaryIcon
                  className={cn(
                    "h-12 w-12 relative z-10",
                    config.iconColor
                  )}
                  strokeWidth={2}
                />
              </motion.div>

              {/* Secondary Icon - Floating */}
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{
                  y: [0, -6, 0],
                  rotate: [0, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.3
                }}
              >
                <div className={cn(
                  "h-10 w-10 rounded-xl bg-background/80 backdrop-blur-sm",
                  "border-2 shadow-lg flex items-center justify-center",
                  config.accentColor
                )}>
                  <SecondaryIcon
                    className={cn(
                      "h-5 w-5",
                      config.iconColor
                    )}
                    strokeWidth={2.5}
                  />
                </div>
              </motion.div>

              {/* Decorative dots */}
              <motion.div
                className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full bg-emerald-500/60"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            className="space-y-4 max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {config.title}
            </h3>
            <p className="text-muted-foreground text-base leading-relaxed">
              {config.description}
            </p>
          </motion.div>

          {/* CTA Button */}
          {onAction && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={mounted ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
            >
              <Button
                onClick={onAction}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                {actionLabel}
              </Button>
            </motion.div>
          )}

          {/* Animated Background Elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
            <motion.div
              className={cn(
                "absolute top-1/4 left-1/4 w-40 h-40 rounded-full bg-gradient-to-br opacity-5 blur-3xl",
                config.gradient
              )}
              animate={{
                scale: [1, 1.2, 1],
                x: [0, 20, 0],
                y: [0, -20, 0]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className={cn(
                "absolute bottom-1/4 right-1/4 w-32 h-32 rounded-full bg-gradient-to-br opacity-5 blur-2xl",
                config.gradient
              )}
              animate={{
                scale: [1, 1.3, 1],
                x: [0, -15, 0],
                y: [0, 15, 0]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />
            <motion.div
              className={cn(
                "absolute top-1/2 right-1/3 w-24 h-24 rounded-full bg-gradient-to-br opacity-5 blur-xl",
                config.gradient
              )}
              animate={{
                scale: [1, 1.4, 1],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
