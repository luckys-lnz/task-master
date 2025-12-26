"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  showTodayButton?: boolean
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  showTodayButton = false,
  mode = "single",
  ...props
}: CalendarProps) {
  return (
    <div className="w-full max-w-full">
      <DayPicker
        mode={mode}
        showOutsideDays={showOutsideDays}
        className={cn(
          "p-3 sm:p-4 bg-background border rounded-lg shadow-sm",
          className
        )}
        captionLayout="dropdown"
        fromYear={1900}
        toYear={2100}
        classNames={{
          // Responsive grid layout
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-3 sm:space-y-4",
          
          // Responsive caption with better mobile nav
          caption: "flex justify-center pt-1 sm:pt-2 pb-2 sm:pb-3 relative items-center px-2 sm:px-6 md:px-8",
          caption_label: "text-sm font-medium hidden sm:block",
          caption_dropdowns: "flex justify-center gap-1 sm:gap-2 flex-wrap",
          
          // Improved responsive navigation
          nav: "space-x-1 flex items-center h-8 sm:h-9",
          nav_button: cn(
            "h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center bg-transparent p-0 opacity-50 hover:opacity-100 transition-all border border-muted-foreground/30 hover:border-muted-foreground rounded-sm shadow-xs",
            "active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          ),
          nav_button_previous: "absolute left-1 sm:left-2 -translate-y-0.5 sm:-translate-y-0.5",
          nav_button_next: "absolute right-1 sm:right-2 -translate-y-0.5 sm:-translate-y-0.5",
          
          // Responsive table layout
          table: "w-full border-collapse space-y-1.5 sm:space-y-1",
          head_row: "flex mb-1 sm:mb-1.5",
          head_cell: "text-muted-foreground rounded-sm w-9 sm:w-10 font-normal text-xs uppercase tracking-wider px-1 sm:px-0.5",
          
          row: "flex w-full mt-1 sm:mt-2 h-9 sm:h-10",
          
          // Enhanced cell styling
          cell: cn(
            "relative p-0 text-center text-sm relative [&:has([aria-selected])]:bg-accent/60 [&:has([aria-selected])]:ring-1 [&:has([aria-selected])]:ring-inset [&:has([aria-selected])]:ring-accent",
            "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
            mode === "range"
              ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md"
              : "[&:has([aria-selected])]:shadow-sm [&:has([aria-selected])]:rounded-md"
          ),
          
          // Day button improvements
          day: cn(
            "h-9 w-9 sm:h-10 sm:w-10 p-0 font-normal text-sm leading-none aria-selected:opacity-100",
            "hover:bg-accent hover:text-accent-foreground hover:shadow-md transition-all duration-200 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
          ),
          day_range_start: "day-range-start rounded-l-md [&:not([aria-selected])]:ring-1 [&:not([aria-selected])]:ring-accent",
          day_range_end: "day-range-end rounded-r-md [&:not([aria-selected])]:ring-1 [&:not([aria-selected])]:ring-accent",
          
          day_selected: cn(
            "bg-primary text-primary-foreground shadow-md border-2 border-primary hover:bg-primary/90 hover:shadow-lg hover:scale-[1.02]",
            "focus:bg-primary focus:text-primary-foreground focus:shadow-xl focus:shadow-primary/25"
          ),
          day_today: "ring-2 ring-accent ring-offset-2 ring-offset-background bg-gradient-to-r from-accent/20 to-accent/30 text-accent-foreground font-semibold shadow-sm",
          day_outside: "text-muted-foreground/40 opacity-40",
          day_disabled: "text-muted-foreground/50 line-through opacity-50",
          day_range_middle: "aria-selected:bg-accent/50 aria-selected:text-accent-foreground aria-selected:shadow-inner",
          day_hidden: "invisible",
          
          // Enhanced dropdowns
          vhidden: "hidden",
          dropdown_month: "relative inline-flex items-center h-9 sm:h-10 px-2",
          dropdown_year: "relative inline-flex items-center h-9 sm:h-10 px-2",
          dropdown: cn(
            "bg-background border border-input text-sm sm:text-base font-medium px-2.5 sm:px-3 py-1.5 sm:py-2",
            "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "rounded-md shadow-sm transition-colors cursor-pointer appearance-none"
          ),
          
          // Footer improvements
          footer: "px-2 sm:px-4 pt-3 sm:pt-4 mt-2 sm:mt-3 border-t border-border",
          ...classNames,
        }}
        components={{
          Chevron: ({ orientation }) => {
            if (orientation === "left") {
              return <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            }
            return <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          },
        }}
        footer={
          showTodayButton && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 h-9 sm:h-10 text-xs sm:text-sm px-3 justify-center"
                onClick={() => {
                  const onSelect = (props as any).onSelect as ((date: Date | undefined) => void) | undefined
                  if (onSelect) {
                    onSelect(new Date())
                  }
                }}
              >
                <RotateCcw className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                Reset to Today
              </Button>
            </div>
          )
        }
        {...(props as any)}
      />
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
