"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { Sun, Moon, Sunset } from "lucide-react"
import { cn } from "@/lib/utils"

interface WelcomeMessageProps {
  userName: string
  className?: string
}

const motivationalQuotes = [
  "Every accomplishment starts with the decision to try.",
  "You're capable of more than you know. Trust yourself.",
  "Small steps every day lead to big changes over time.",
  "Your potential is limitless when you believe in yourself.",
  "Today is a fresh start. Make it count.",
  "Progress, not perfection, is what matters most.",
  "You have everything you need to succeed right now.",
  "The best time to start was yesterday. The second best time is now.",
  "Your future self will thank you for the work you do today.",
  "Challenges are opportunities in disguise.",
  "You're stronger than you think and more capable than you imagine.",
  "Every expert was once a beginner. Keep going.",
  "Success is the sum of small efforts repeated day in and day out.",
  "The only way to do great work is to love what you do.",
  "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.",
  "You don't have to be great to start, but you have to start to be great.",
  "Your limitation—it's only your imagination.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you. You have to go out and get it.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Dream bigger. Do bigger.",
  "Don't stop when you're tired. Stop when you're done.",
  "Wake up with determination. Go to bed with satisfaction.",
  "Do something today that your future self will thank you for.",
  "Little things make big things happen.",
  "Don't wait for opportunity. Create it.",
  "If it matters to you, you'll find a way.",
  "The only way to do great work is to love what you do.",
]

// Get time-based greeting
function getTimeBasedGreeting(): { greeting: string; icon: typeof Sun; timeOfDay: string } {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) {
    return { greeting: "Good morning", icon: Sun, timeOfDay: "morning" }
  } else if (hour >= 12 && hour < 17) {
    return { greeting: "Good afternoon", icon: Sun, timeOfDay: "afternoon" }
  } else if (hour >= 17 && hour < 21) {
    return { greeting: "Good evening", icon: Sunset, timeOfDay: "evening" }
  } else {
    return { greeting: "Good night", icon: Moon, timeOfDay: "night" }
  }
}

// Get personalized message based on time and context
function getPersonalizedMessage(userName: string, timeOfDay: string): string {
  const name = userName.split(" ")[0] // Use first name only for more intimacy
  const messages = {
    morning: [
      `Ready to make today amazing, ${name}?`,
      `Let's start this day strong, ${name}!`,
      `Time to shine, ${name}! What will you accomplish today?`,
      `A fresh start awaits you, ${name}. Let's make it count!`,
      `Rise and thrive, ${name}! Today is full of possibilities.`,
    ],
    afternoon: [
      `How's your day going, ${name}? Keep that momentum!`,
      `You're doing great, ${name}! Let's keep the energy up.`,
      `Still plenty of time to make today productive, ${name}!`,
      `You've got this, ${name}! What's next on your list?`,
      `Midday check-in: You're on track, ${name}!`,
    ],
    evening: [
      `You've made it through the day, ${name}! How did it go?`,
      `Evening reflection time, ${name}. What did you accomplish?`,
      `Winding down, ${name}? Let's finish strong!`,
      `Great work today, ${name}! Time to wrap things up.`,
      `You've done well today, ${name}. What's left to tackle?`,
    ],
    night: [
      `Still working, ${name}? Remember to rest when you need it.`,
      `Late night session, ${name}? You're dedicated!`,
      `Don't forget to take breaks, ${name}. Your well-being matters.`,
      `Powering through, ${name}? You've got this!`,
      `Night owl mode activated, ${name}! Keep going.`,
    ],
  }
  
  const timeMessages = messages[timeOfDay as keyof typeof messages] || messages.morning
  return timeMessages[Math.floor(Math.random() * timeMessages.length)]
}

export function WelcomeMessage({ userName, className }: WelcomeMessageProps) {
  const [quote, setQuote] = useState("")
  const [mounted, setMounted] = useState(false)

  const { greeting, icon: TimeIcon, timeOfDay } = useMemo(() => getTimeBasedGreeting(), [])
  const personalizedMessage = useMemo(() => getPersonalizedMessage(userName, timeOfDay), [userName, timeOfDay])

  useEffect(() => {
    setMounted(true)
    // Get a random quote
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
    setQuote(randomQuote)
  }, [])

  if (!mounted) return null

  const displayName = userName || "there"
  const firstName = displayName.split(" ")[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className={cn("mb-8", className)}
    >
      <div className="space-y-5">
        {/* Main Greeting Section */}
        <div className="flex items-start gap-4">
          {/* Time Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              delay: 0.2, 
              type: "spring", 
              stiffness: 200, 
              damping: 15 
            }}
            className="flex-shrink-0"
          >
            <div className="relative">
              <TimeIcon className="h-9 w-9 sm:h-11 sm:w-11 text-accent" />
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-accent/20 rounded-full blur-md"
              />
            </div>
          </motion.div>

          {/* Text Content - Properly Aligned */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Level 1: Time Greeting + Name */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="flex items-baseline gap-2.5 flex-wrap"
            >
              <span className="text-sm sm:text-base font-medium text-muted-foreground leading-tight">
                {greeting},
              </span>
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                className="text-3xl sm:text-5xl font-bold text-foreground leading-none tracking-tight"
              >
                {firstName}
              </motion.span>
              <motion.span
                animate={{
                  rotate: [0, 14, -8, 14, -8, 0],
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.6,
                }}
                className="text-3xl sm:text-5xl leading-none"
                aria-hidden="true"
              >
                👋
              </motion.span>
            </motion.div>

            {/* Level 2: Personalized Message */}
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="text-base sm:text-lg font-semibold text-foreground leading-relaxed max-w-3xl"
            >
              {personalizedMessage}
            </motion.p>
          </div>
        </div>

        {/* Level 3: Motivational Quote */}
        {quote && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="relative pl-5 sm:pl-6 border-l-3 border-accent/40 ml-4 sm:ml-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
              className="absolute -left-[7px] top-0 w-3.5 h-3.5 rounded-full bg-accent shadow-sm shadow-accent/30"
            />
            <p className="text-sm sm:text-base text-muted-foreground italic leading-relaxed font-medium">
              {quote}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
