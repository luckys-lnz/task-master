"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface ConfettiProps {
  trigger: boolean
  duration?: number
  particleCount?: number
}

export function Confetti({ trigger, duration = 2000, particleCount = 50 }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{
    id: number
    left: number
    delay: number
    duration: number
    color: string
  }>>([])

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 300,
        duration: duration + Math.random() * 500,
        color: [
          "hsl(var(--primary))",
          "hsl(var(--accent))",
          "hsl(var(--destructive))",
          "hsl(var(--primary) / 0.8)",
          "hsl(var(--accent) / 0.8)",
        ][Math.floor(Math.random() * 5)],
      }))
      setParticles(newParticles)

      // Clear particles after animation
      const timeout = setTimeout(() => {
        setParticles([])
      }, duration + 1000)

      return () => clearTimeout(timeout)
    }
  }, [trigger, duration, particleCount])

  if (particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={cn(
            "absolute w-2 h-2 rounded-full opacity-80",
            "animate-confetti-fall"
          )}
          style={{
            left: `${particle.left}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}ms`,
            animationDuration: `${particle.duration}ms`,
          }}
        />
      ))}
    </div>
  )
}
