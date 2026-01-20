"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface FloatingActionButtonProps {
  onClick: () => void
  className?: string
}

export function FloatingActionButton({ onClick, className }: FloatingActionButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn("fixed bottom-6 right-4 sm:right-6 z-50", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex items-center gap-3">
        {/* Tooltip Label */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: 8, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              className="hidden sm:block pointer-events-none"
            >
              <div className="relative">
                <div className="bg-popover border border-border/50 text-popover-foreground px-3.5 py-2 rounded-lg shadow-lg backdrop-blur-sm">
                  <div className="text-sm font-medium">Add New Task</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Press Alt+N</div>
                </div>
                {/* Arrow */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
                  <div className="w-0 h-0 border-l-[5px] border-l-popover border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB Button */}
        <motion.button
          onClick={onClick}
          className={cn(
            "group relative",
            "h-14 w-14 rounded-full",
            "bg-accent hover:bg-accent/90",
            "text-accent-foreground",
            "shadow-lg shadow-accent/25",
            "border border-accent/20",
            "flex items-center justify-center",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background",
            "active:scale-95"
          )}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: 1, 
            opacity: 1,
            boxShadow: isHovered 
              ? "0 20px 25px -5px rgba(168, 85, 247, 0.3), 0 10px 10px -5px rgba(168, 85, 247, 0.2)"
              : "0 10px 15px -3px rgba(168, 85, 247, 0.25), 0 4px 6px -2px rgba(168, 85, 247, 0.1)"
          }}
          whileHover={{ 
            scale: 1.05,
            y: -2
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 25,
            opacity: { duration: 0.2 }
          }}
          aria-label="Add new task"
          title="Add New Task (Alt+N)"
        >
          {/* Ripple effect on hover */}
          <motion.div
            className="absolute inset-0 rounded-full bg-white/20"
            initial={{ scale: 0, opacity: 0 }}
            animate={isHovered ? { scale: 1.3, opacity: [0, 0.3, 0] } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          
          {/* Icon */}
          <motion.div
            animate={{ rotate: isHovered ? 90 : 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <Plus 
              className="h-5 w-5 relative z-10" 
              strokeWidth={2.5}
            />
          </motion.div>

          {/* Shine effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.button>
      </div>
    </div>
  )
}
