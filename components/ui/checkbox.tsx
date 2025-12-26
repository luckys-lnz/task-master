"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => {
  const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([])
  const checkboxRef = React.useRef<HTMLButtonElement>(null)
  const rippleIdRef = React.useRef(0)

  const handleCheckedChange = (checked: boolean) => {
    if (checked && checkboxRef.current) {
      const rect = checkboxRef.current.getBoundingClientRect()
      const x = rect.width / 2
      const y = rect.height / 2
      const id = rippleIdRef.current++
      
      setRipples((prev) => [...prev, { id, x, y }])
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id))
      }, 600)
    }
    
    if (props.onCheckedChange) {
      props.onCheckedChange(checked)
    }
  }

  return (
    <CheckboxPrimitive.Root
      ref={(node) => {
        if (typeof ref === "function") {
          ref(node)
        } else if (ref) {
          ref.current = node
        }
        checkboxRef.current = node
      }}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground transition-all duration-200 hover:scale-110 active:scale-95 data-[state=checked]:spring-bounce relative overflow-visible",
        className
      )}
      {...props}
      onCheckedChange={handleCheckedChange}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current relative z-10")}
      >
        <Check className="h-4 w-4 animate-in zoom-in-95 duration-200" />
      </CheckboxPrimitive.Indicator>
      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="ripple-effect"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: "16px",
            height: "16px",
            marginLeft: "-8px",
            marginTop: "-8px",
          }}
        />
      ))}
    </CheckboxPrimitive.Root>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
