"use client"

import * as React from "react"
import DatePicker, { registerLocale } from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { format, startOfDay, isAfter, isSameDay } from "date-fns"
import { CalendarIcon, Clock, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DateTimePickerV2Props {
  date: Date | undefined
  time: string
  onDateChange: (date: Date | undefined) => void
  onTimeChange: (time: string) => void
  onClear?: () => void
  label?: string
  className?: string
  disabled?: boolean
  placeholder?: string
}

export function DateTimePickerV2({
  date,
  time,
  onDateChange,
  onTimeChange,
  onClear,
  label,
  className,
  disabled = false,
  placeholder = "Select date and time",
}: DateTimePickerV2Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(date || null)
  const [selectedTime, setSelectedTime] = React.useState(time || "")

  // Sync with external props
  React.useEffect(() => {
    setSelectedDate(date || null)
  }, [date])

  React.useEffect(() => {
    setSelectedTime(time || "")
  }, [time])

  // Combine date and time into a single Date object
  const combinedDateTime = React.useMemo(() => {
    if (!selectedDate) return null
    
    const dateTime = new Date(selectedDate)
    if (selectedTime) {
      const [hours, minutes] = selectedTime.split(":").map(Number)
      if (!isNaN(hours) && !isNaN(minutes)) {
        dateTime.setHours(hours, minutes, 0, 0)
      }
    } else {
      dateTime.setHours(12, 0, 0, 0) // Default to noon if no time selected
    }
    
    return dateTime
  }, [selectedDate, selectedTime])

  // Validate that selected date/time is not in the past
  const isValidSelection = React.useMemo(() => {
    if (!combinedDateTime) return true
    
    const now = new Date()
    const selectedDateOnly = startOfDay(combinedDateTime)
    const today = startOfDay(now)
    
    // Date must be today or in the future
    if (selectedDateOnly < today) return false
    
    // If date is today, time must be in the future
    if (isSameDay(combinedDateTime, now) && combinedDateTime < now) {
      return false
    }
    
    return true
  }, [combinedDateTime])

  const handleDateChange = (newDate: Date | null) => {
    if (disabled) return
    
    setSelectedDate(newDate)
    if (newDate) {
      onDateChange(newDate)
    } else {
      onDateChange(undefined)
      setSelectedTime("")
      onTimeChange("")
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    
    const newTime = e.target.value
    setSelectedTime(newTime)
    onTimeChange(newTime)
    
    // If we have a date, validate the combined date-time
    if (selectedDate && newTime) {
      const [hours, minutes] = newTime.split(":").map(Number)
      if (!isNaN(hours) && !isNaN(minutes)) {
        const dateTime = new Date(selectedDate)
        dateTime.setHours(hours, minutes, 0, 0)
        
        const now = new Date()
        if (isSameDay(dateTime, now) && dateTime < now) {
          // Time is in the past, reset to current time + 1 hour
          const futureTime = new Date(now)
          futureTime.setHours(futureTime.getHours() + 1, 0, 0, 0)
          const validTime = `${String(futureTime.getHours()).padStart(2, "0")}:${String(futureTime.getMinutes()).padStart(2, "0")}`
          setSelectedTime(validTime)
          onTimeChange(validTime)
        }
      }
    }
  }

  const handleClear = () => {
    if (disabled || !onClear) return
    setSelectedDate(null)
    setSelectedTime("")
    onDateChange(undefined)
    onTimeChange("")
    onClear()
  }

  const displayValue = React.useMemo(() => {
    if (!selectedDate) return ""
    
    const dateStr = format(selectedDate, "MMM d, yyyy")
    const timeStr = selectedTime || "No time"
    return `${dateStr}${selectedTime ? ` at ${selectedTime}` : ""}`
  }, [selectedDate, selectedTime])

  // Filter out past dates
  const filterDate = (date: Date) => {
    const today = startOfDay(new Date())
    const checkDate = startOfDay(date)
    return checkDate >= today
  }

  // Filter out past times if date is today
  const filterTime = (time: Date) => {
    if (!selectedDate) return true
    const today = startOfDay(new Date())
    const selectedDateOnly = startOfDay(selectedDate)
    
    if (isSameDay(selectedDateOnly, today)) {
      const now = new Date()
      return time > now
    }
    return true
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-11",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            <span className="flex-1 text-sm">{displayValue}</span>
          ) : (
            <span className="flex-1 text-sm text-muted-foreground">{placeholder}</span>
          )}
          {selectedDate && onClear && (
            <X
              className="ml-2 h-4 w-4 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Date
            </label>
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              filterDate={filterDate}
              inline
              calendarClassName="!border-0"
              className="react-datepicker-custom"
              minDate={new Date()}
              dateFormat="MMM d, yyyy"
            />
          </div>

          {/* Time Picker */}
          {selectedDate && (
            <div className="space-y-2 border-t pt-4">
              <label
                htmlFor="time-input"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2"
              >
                <Clock className="h-3.5 w-3.5" />
                Time
              </label>
              <input
                id="time-input"
                type="time"
                value={selectedTime}
                onChange={handleTimeChange}
                className={cn(
                  "w-full h-11 px-3 rounded-md border border-input bg-background text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  !isValidSelection && "border-destructive"
                )}
                disabled={disabled}
              />
              {!isValidSelection && (
                <p className="text-xs text-destructive">
                  Selected time is in the past
                </p>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
