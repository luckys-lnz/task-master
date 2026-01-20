"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, CheckCircle2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface OnboardingGreetingProps {
  userName: string
  isNewUser?: boolean
  onDismiss?: () => void
}

export function OnboardingGreeting({ 
  userName, 
  isNewUser = false,
  onDismiss 
}: OnboardingGreetingProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Check if user has already seen the greeting for this session
    const greetingKey = isNewUser 
      ? `onboarding-greeting-new-${userName}` 
      : `onboarding-greeting-return-${userName}`
    const hasSeenGreeting = sessionStorage.getItem(greetingKey)
    
    // Show greeting if they haven't seen it in this session
    // For new users, always show. For returning users, show once per session
    if (isNewUser || !hasSeenGreeting) {
      // Small delay for smooth entrance
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 500)
      return () => clearTimeout(timer)
    }
    
    return undefined
  }, [userName, isNewUser])

  const handleDismiss = () => {
    setIsDismissed(true)
    const greetingKey = isNewUser 
      ? `onboarding-greeting-new-${userName}` 
      : `onboarding-greeting-return-${userName}`
    // Store in sessionStorage so it shows again next session, but not repeatedly in same session
    sessionStorage.setItem(greetingKey, "true")
    if (onDismiss) {
      onDismiss()
    }
  }

  // Auto-dismiss after 8 seconds if not manually dismissed
  useEffect(() => {
    if (isVisible && !isDismissed) {
      const autoDismissTimer = setTimeout(() => {
        handleDismiss()
      }, 8000)
      return () => clearTimeout(autoDismissTimer)
    }
    return undefined
  }, [isVisible, isDismissed])

  if (!isVisible || isDismissed) return null

  const greeting = isNewUser 
    ? `Welcome to TaskMaster, ${userName}! 🎉`
    : `Welcome back, ${userName}! 👋`

  const message = isNewUser
    ? "Let's get you started! Create your first task to begin organizing your day."
    : "Ready to tackle your tasks? Let's make today productive!"

  const features = isNewUser
    ? [
        "Create and organize tasks with subtasks",
        "Track your progress with analytics",
        "Set priorities and due dates",
        "Stay on top of your goals"
      ]
    : [
        "You have tasks to complete",
        "Track your progress",
        "Stay organized and productive"
      ]

  return (
    <AnimatePresence>
      {isVisible && !isDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            duration: 0.5
          }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
        >
          <Card className="relative overflow-hidden border-2 border-accent/20 bg-gradient-to-br from-background via-background to-accent/5 shadow-xl">
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent pointer-events-none" />
            
            {/* Sparkle decoration */}
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute top-4 right-4 text-accent/30"
            >
              <Sparkles className="h-6 w-6" />
            </motion.div>

            <div className="relative p-6 sm:p-8">
              {/* Header with dismiss button */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <motion.h2
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-2xl sm:text-3xl font-bold text-foreground mb-2"
                  >
                    {greeting}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm sm:text-base text-muted-foreground"
                  >
                    {message}
                  </motion.p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="h-8 w-8 rounded-full hover:bg-muted flex-shrink-0 ml-4"
                  aria-label="Dismiss greeting"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Features list */}
              {isNewUser && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-3 mt-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {features.map((feature, index) => (
                      <motion.div
                        key={feature}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: 0.6 + index * 0.1,
                            type: "spring",
                            stiffness: 200,
                            damping: 15
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                        </motion.div>
                        <span>{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: isNewUser ? 0.9 : 0.4 }}
                className="mt-6 flex items-center gap-3"
              >
                <Button
                  onClick={handleDismiss}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-6 h-11 shadow-lg shadow-accent/25"
                >
                  {isNewUser ? "Get Started" : "Continue"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Dismiss
                </Button>
              </motion.div>
            </div>

            {/* Progress bar for auto-dismiss */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 8, ease: "linear" }}
              className="absolute bottom-0 left-0 h-1 bg-accent/30"
            />
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
