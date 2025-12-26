"use client"

import * as React from "react"
import { format, startOfDay } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"

interface DateTimePickerProps {
  date: Date | undefined
  time: string
  onDateChange: (date: Date | undefined) => void
  onTimeChange: (time: string) => void
  onClear?: () => void
  label?: string
  className?: string
  disabled?: boolean
}

export function DateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  onClear,
  label = "Due Date & Time",
  className,
  disabled = false,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [dateError, setDateError] = React.useState<string>("")
  const [timeError, setTimeError] = React.useState<string>("")
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const validateDateTime = React.useCallback((selectedDate: Date | undefined, selectedTime: string): boolean => {
    setDateError("")
    setTimeError("")

    if (!selectedDate) {
      return true
    }

    const today = startOfDay(new Date())
    const selectedDateOnly = startOfDay(selectedDate)

    if (selectedDateOnly < today) {
      setDateError("Cannot select a past date")
      return false
    }

    if (selectedDateOnly.getTime() === today.getTime() && selectedTime) {
      const [hours, minutes] = selectedTime.split(":").map(Number)
      if (!isNaN(hours) && !isNaN(minutes)) {
        const selectedDateTime = new Date(selectedDate)
        selectedDateTime.setHours(hours, minutes, 0, 0)
        const now = new Date()

        if (selectedDateTime < now) {
          setTimeError("Cannot select a time in the past")
          return false
        }
      }
    }

    return true
  }, [])

  const handleDateSelect = (selectedDate: Date | undefined): void => {
    if (disabled) return
    if (validateDateTime(selectedDate, time)) {
      onDateChange(selectedDate)
      if (isDesktop) {
        setIsOpen(false)
      }
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (disabled) return
    const selectedTime = e.target.value
    if (validateDateTime(date, selectedTime)) {
      onTimeChange(selectedTime)
    }
  }

  const handleTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && date && time) {
      setIsOpen(false)
    }
  }

  const handleClear = (): void => {
    if (disabled) return
    onDateChange(undefined)
    onTimeChange("")
    setDateError("")
    setTimeError("")
    onClear?.()
  }

  const handleClearKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleClear()
    }
  }

  const handleDone = (): void => {
    setIsOpen(false)
  }

  const handleDoneKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleDone()
    }
  }

  React.useEffect(() => {
    validateDateTime(date, time)
  }, [date, time, validateDateTime])

  const getDisplayText = (): string => {
    if (!date && !time) return "Select date & time"
    const dateStr = date ? format(date, "MMM d, yyyy") : "No date"
    const timeStr = time || "No time"
    return `${dateStr} ${timeStr}`
  }

  const PickerContent = (): React.JSX.Element => (
    <div className="space-y-5">
      {/* Date Selection */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Date
        </Label>
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            disabled={(date) => {
              const today = startOfDay(new Date())
              const checkDate = startOfDay(date)
              return checkDate < today
            }}
            initialFocus
            className="rounded-lg"
          />
        </div>
        {dateError && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2.5 rounded-md">
            <span>{dateError}</span>
          </div>
        )}
      </div>

      {/* Time Selection */}
      <div className="space-y-3 border-t pt-5">
        <Label htmlFor="time-input" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Time
        </Label>
        <Input
          id="time-input"
          type="time"
          value={time}
          onChange={handleTimeChange}
          onKeyDown={handleTimeKeyDown}
          className={cn("w-full h-11 text-base tabular-nums font-medium", timeError && "border-destructive")}
          disabled={disabled}
          aria-label="Select time"
          aria-invalid={!!timeError}
          tabIndex={disabled ? -1 : 0}
        />
        {timeError && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2.5 rounded-md">
            <span>{timeError}</span>
          </div>
        )}
      </div>
    </div>
  )

  if (isDesktop) {
    return (
      <div className={cn("space-y-2", className)}>
        <Label className="text-sm font-medium" htmlFor="date-time-trigger">
          {label}
        </Label>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date-time-trigger"
              variant="outline"
              disabled={disabled}
              className={cn(
                "w-full justify-between text-left font-normal h-10 px-3",
                "border transition-all hover:border-primary/50 focus:ring-2 focus:ring-primary focus:ring-offset-2",
                !date && !time && "text-muted-foreground",
                (date || time) && "border-primary/30 bg-primary/5"
              )}
              aria-label="Open date and time picker"
              aria-expanded={isOpen}
              tabIndex={disabled ? -1 : 0}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-sm tabular-nums leading-tight">
                  {getDisplayText()}
                </span>
              </div>
              {(date || time) && onClear && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 shrink-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClear()
                  }}
                  onKeyDown={handleClearKeyDown}
                  aria-label="Clear date and time"
                  tabIndex={disabled ? -1 : 0}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-5" align="start" sideOffset={4}>
            <PickerContent />
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                onKeyDown={handleClearKeyDown}
                disabled={(!date && !time) || disabled}
                className="text-sm h-9 px-4"
                aria-label="Clear selection"
                tabIndex={disabled ? -1 : 0}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={handleDone}
                onKeyDown={handleDoneKeyDown}
                className="text-sm h-9 px-4"
                aria-label="Confirm selection"
                tabIndex={0}
              >
                Done
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium" htmlFor="date-time-trigger-mobile">
        {label}
      </Label>
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button
            id="date-time-trigger-mobile"
            variant="outline"
            disabled={disabled}
            className="w-full justify-between text-left font-normal h-11 px-3 border focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Open date and time picker"
            aria-expanded={isOpen}
            tabIndex={disabled ? -1 : 0}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-sm tabular-nums leading-tight">
                {getDisplayText()}
              </span>
            </div>
            {(date || time) && onClear && (
              <span
                role="button"
                className="h-7 w-7 p-0 shrink-0 flex items-center justify-center rounded-sm hover:bg-destructive hover:text-destructive-foreground cursor-pointer transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
                onKeyDown={handleClearKeyDown}
                aria-label="Clear date and time"
                tabIndex={disabled ? -1 : 0}
              >
                <X className="h-4 w-4" />
              </span>
            )}
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh]" aria-describedby={undefined}>
          <DrawerHeader className="text-left pb-2">
            <DrawerTitle className="text-lg font-semibold">Select Date & Time</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto flex-1 px-4">
            <PickerContent />
          </div>
          <div className="p-4 border-t space-y-2">
            <Button
              className="w-full h-11 text-base font-semibold"
              onClick={handleDone}
              onKeyDown={handleDoneKeyDown}
              aria-label="Confirm selection"
              tabIndex={0}
            >
              Confirm
            </Button>
            {(date || time) && (
              <Button
                variant="outline"
                className="w-full h-10"
                onClick={() => {
                  handleClear()
                  setIsOpen(false)
                }}
                onKeyDown={handleClearKeyDown}
                disabled={disabled}
                aria-label="Clear selection"
                tabIndex={disabled ? -1 : 0}
              >
                Clear
              </Button>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
