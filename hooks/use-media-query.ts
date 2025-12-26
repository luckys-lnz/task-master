"use client"

import * as React from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    
    // Set initial value
    setMatches(mediaQuery.matches)

    // Create event listener
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setMatches(event.matches)
    }

    // Add listener (modern browsers)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [query])

  return matches
}
