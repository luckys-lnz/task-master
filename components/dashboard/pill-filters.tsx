"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export type FilterType = "all" | "today" | "upcoming" | "inProgress" | "completed" | "overdue"

interface PillFiltersProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
}

const filters: { id: FilterType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "inProgress", label: "In Progress" },
  { id: "completed", label: "Completed" },
  { id: "overdue", label: "Overdue" }
]

export function PillFilters({ activeFilter, onFilterChange }: PillFiltersProps) {
  return (
    <div className="relative">
      {/* Horizontal Scrollable Container */}
      <div className="overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4">
        <div className="flex gap-2 min-w-max relative">
          {filters.map((filter, index) => {
            const isActive = activeFilter === filter.id
            return (
              <motion.button
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                className={cn(
                  "relative px-4 py-2.5 rounded-full text-sm font-semibold",
                  "whitespace-nowrap z-10",
                  "transition-colors duration-200",
                  isActive
                    ? "text-white font-bold"
                    : "text-muted-foreground hover:text-foreground font-medium"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                }}
                transition={{ 
                  duration: 0.3,
                  delay: index * 0.05,
                  ease: [0.4, 0, 0.2, 1]
                }}
              >
                {/* Active Background with smooth transition */}
                {isActive && (
                  <motion.div
                    layoutId="activeFilter"
                    className="absolute inset-0 bg-accent rounded-full shadow-md shadow-accent/20"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                  />
                )}
                
                {/* Text content */}
                <span className="relative z-10">{filter.label}</span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
