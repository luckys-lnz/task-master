/**
 * Animation utilities for premium micro-interactions
 * Following spring-based, natural motion principles
 */

export const springConfig = {
  // Fast, snappy interactions (buttons, toggles)
  fast: {
    duration: 150,
    easing: [0.4, 0, 0.2, 1], // ease-out
  },
  // Standard interactions (cards, modals)
  normal: {
    duration: 200,
    easing: [0.4, 0, 0.2, 1],
  },
  // Smooth, deliberate animations (page transitions)
  smooth: {
    duration: 300,
    easing: [0.4, 0, 0.2, 1],
  },
  // Spring-like bounce (checkboxes, success states)
  spring: {
    duration: 400,
    easing: [0.34, 1.56, 0.64, 1], // ease-out-back
  },
};

export const animationVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: springConfig.normal,
  },
  slideUp: {
    initial: { opacity: 0, transform: "translateY(10px)" },
    animate: { opacity: 1, transform: "translateY(0)" },
    transition: springConfig.normal,
  },
  slideDown: {
    initial: { opacity: 0, transform: "translateY(-10px)" },
    animate: { opacity: 1, transform: "translateY(0)" },
    transition: springConfig.normal,
  },
  scaleIn: {
    initial: { opacity: 0, transform: "scale(0.95)" },
    animate: { opacity: 1, transform: "scale(1)" },
    transition: springConfig.normal,
  },
  scaleUp: {
    initial: { opacity: 0, transform: "scale(0.9)" },
    animate: { opacity: 1, transform: "scale(1)" },
    transition: springConfig.spring,
  },
  stagger: {
    container: {
      initial: {},
      animate: {
        transition: {
          staggerChildren: 0.05,
        },
      },
    },
    item: {
      initial: { opacity: 0, transform: "translateY(10px)" },
      animate: {
        opacity: 1,
        transform: "translateY(0)",
        transition: springConfig.normal,
      },
    },
  },
};

/**
 * CSS classes for common animations
 */
export const animationClasses = {
  fadeIn: "animate-in fade-in duration-200",
  slideUp: "animate-in slide-in-from-bottom-2 duration-200",
  slideDown: "animate-in slide-in-from-top-2 duration-200",
  scaleIn: "animate-in zoom-in-95 duration-200",
  stagger: "animate-in fade-in slide-in-from-bottom-2 duration-200",
};

/**
 * Generate stagger delay classes
 */
export const getStaggerDelay = (index: number, baseDelay = 50) => {
  return {
    transitionDelay: `${index * baseDelay}ms`,
  };
};
