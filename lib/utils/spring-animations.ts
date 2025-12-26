/**
 * Spring Animation Utilities
 * Provides helper functions for applying spring-based animations
 */

/**
 * Get spring transition style object
 */
export const getSpringTransition = (
  duration: 150 | 200 | 300 | 400 = 300,
  delay: number = 0
) => {
  const easingMap = {
    150: "var(--spring-ease-out)",
    200: "var(--spring-ease-out)",
    300: "var(--spring-ease-out-back)",
    400: "var(--spring-ease-out-back)",
  };

  return {
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: easingMap[duration],
    transitionDelay: delay > 0 ? `${delay}ms` : undefined,
  };
};

/**
 * Get stagger delay for list items
 */
export const getStaggerDelay = (index: number, baseDelay: number = 50) => {
  return {
    transitionDelay: `${index * baseDelay}ms`,
    transitionTimingFunction: "var(--spring-ease-out-back)",
  };
};

/**
 * Spring animation classes for common patterns
 */
export const springClasses = {
  // Fast spring (150-200ms) - buttons, toggles
  fast: "transition-spring-fast",
  
  // Normal spring (300ms) - cards, modals
  normal: "transition-spring",
  
  // Smooth spring (400ms) - page transitions
  smooth: "transition-spring-smooth",
  
  // Scale animations
  scale: "spring-scale",
  
  // Lift animations
  lift: "spring-lift",
};

/**
 * Apply spring animation to element
 */
export const applySpringAnimation = (
  element: HTMLElement,
  type: "fade" | "slide" | "scale" = "fade",
  duration: 150 | 200 | 300 | 400 = 300
) => {
  const transitions = {
    fade: { opacity: "0" },
    slide: { opacity: "0", transform: "translateY(10px)" },
    scale: { opacity: "0", transform: "scale(0.95)" },
  };

  const initial = transitions[type];
  const final = {
    opacity: "1",
    transform: type === "fade" ? undefined : type === "slide" ? "translateY(0)" : "scale(1)",
  };

  // Apply initial state
  Object.entries(initial).forEach(([prop, value]) => {
    if (value) {
      (element.style as any)[prop] = value;
    }
  });

  // Animate to final state
  requestAnimationFrame(() => {
    const transition = getSpringTransition(duration);
    Object.entries(transition).forEach(([prop, value]) => {
      if (value) {
        (element.style as any)[prop] = value;
      }
    });

    requestAnimationFrame(() => {
      Object.entries(final).forEach(([prop, value]) => {
        if (value) {
          (element.style as any)[prop] = value;
        }
      });
    });
  });
};
