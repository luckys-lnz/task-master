"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle, Target, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface EnhancedEmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "default" | "tasks" | "filtered";
}

export function EnhancedEmptyState({
  title,
  description,
  actionLabel = "Get Started",
  onAction,
  variant = "default",
}: EnhancedEmptyStateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const variants = {
    default: {
      icon: Target,
      title: title || "Nothing here yet",
      description: description || "Get started by creating your first item.",
      gradient: "from-blue-500/20 to-purple-500/20",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    tasks: {
      icon: Sparkles,
      title: "No tasks yet",
      description: "Start organizing your life! Create your first task and watch your productivity soar.",
      gradient: "from-primary/20 to-accent/20",
      iconColor: "text-primary",
    },
    filtered: {
      icon: TrendingUp,
      title: "No tasks match your filters",
      description: "Try adjusting your filters to see more tasks, or create a new one that matches.",
      gradient: "from-muted/50 to-muted/30",
      iconColor: "text-muted-foreground",
    },
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <Card className="border-2 border-dashed overflow-hidden">
      <CardContent className="p-12 sm:p-16">
        <div
          className={cn(
            "flex flex-col items-center justify-center text-center space-y-6 transition-spring-smooth",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
          style={{
            transitionTimingFunction: "var(--spring-ease-out-back)",
          }}
        >
          {/* Animated Icon */}
          <div
            className={cn(
              "relative h-20 w-20 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4 transition-all duration-500",
              config.gradient,
              mounted && "scale-100" || "scale-0"
            )}
            style={{ transitionDelay: "100ms" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl" />
            <Icon
              className={cn(
                "h-10 w-10 relative z-10 transition-all duration-500",
                config.iconColor,
                mounted && "scale-100 rotate-0" || "scale-0 rotate-180"
              )}
              style={{ transitionDelay: "200ms" }}
            />
          </div>

          {/* Content */}
          <div className="space-y-3 max-w-md">
            <h3
              className={cn(
                "text-2xl font-bold transition-all duration-500",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: "300ms" }}
            >
              {config.title}
            </h3>
            <p
              className={cn(
                "text-muted-foreground transition-all duration-500",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: "400ms" }}
            >
              {config.description}
            </p>
          </div>

          {/* CTA Button */}
          {onAction && (
            <Button
              onClick={onAction}
              size="lg"
              className={cn(
                "mt-4 transition-all duration-500 hover:scale-105",
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: "500ms" }}
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              {actionLabel}
            </Button>
          )}

          {/* Decorative Elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div
              className={cn(
                "absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-gradient-to-br opacity-10 blur-2xl transition-all duration-1000",
                config.gradient,
                mounted && "scale-100 animate-pulse" || "scale-0"
              )}
            />
            <div
              className={cn(
                "absolute bottom-1/4 right-1/4 w-24 h-24 rounded-full bg-gradient-to-br opacity-10 blur-xl transition-all duration-1000",
                config.gradient,
                mounted && "scale-100 animate-pulse" || "scale-0"
              )}
              style={{ animationDelay: "500ms" }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
