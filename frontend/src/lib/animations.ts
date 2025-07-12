import { Variants } from "framer-motion";

// Easing configurations for consistent motion
export const easings = {
  smooth: [0.25, 0.46, 0.45, 0.94],
  spring: { type: "spring", damping: 20, stiffness: 300 },
  snappy: { type: "spring", damping: 25, stiffness: 400 },
  gentle: { type: "spring", damping: 30, stiffness: 200 },
} as const;

// Duration constants
export const durations = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
} as const;

// Fade animations
export const fadeVariants: Variants = {
  hidden: {
    opacity: 0,
    transition: { duration: durations.fast, ease: easings.smooth },
  },
  visible: {
    opacity: 1,
    transition: { duration: durations.normal, ease: easings.smooth },
  },
  exit: {
    opacity: 0,
    transition: { duration: durations.fast, ease: easings.smooth },
  },
};

// Scale animations for buttons and interactive elements
export const scaleVariants: Variants = {
  idle: {
    scale: 1,
    transition: easings.snappy,
  },
  hover: {
    scale: 1.02,
    transition: easings.snappy,
  },
  tap: {
    scale: 0.98,
    transition: easings.snappy,
  },
  selected: {
    scale: 1.05,
    transition: easings.snappy,
  },
};

// Slide animations for panels and dialogs
export const slideVariants: Variants = {
  hiddenLeft: {
    x: -300,
    opacity: 0,
    transition: { duration: durations.normal, ease: easings.smooth },
  },
  hiddenRight: {
    x: 300,
    opacity: 0,
    transition: { duration: durations.normal, ease: easings.smooth },
  },
  hiddenUp: {
    y: -50,
    opacity: 0,
    transition: { duration: durations.normal, ease: easings.smooth },
  },
  hiddenDown: {
    y: 50,
    opacity: 0,
    transition: { duration: durations.normal, ease: easings.smooth },
  },
  visible: {
    x: 0,
    y: 0,
    opacity: 1,
    transition: { duration: durations.normal, ease: easings.smooth },
  },
  exit: {
    y: -20,
    opacity: 0,
    transition: { duration: durations.fast, ease: easings.smooth },
  },
};

// Message animations with stagger
export const messageVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: { duration: durations.fast },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: durations.normal,
      ease: easings.smooth,
      delay: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: durations.fast },
  },
};

// List container animations with stagger
export const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
      duration: durations.fast,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.02,
      staggerDirection: -1,
      duration: durations.fast,
    },
  },
};

// List item animations
export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
    transition: { duration: durations.fast },
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: durations.normal, ease: easings.smooth },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: durations.fast },
  },
};

// Dialog/Modal animations
export const dialogVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: durations.fast },
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: durations.normal, ease: easings.smooth },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: durations.fast },
  },
};

// Overlay animations
export const overlayVariants: Variants = {
  hidden: {
    opacity: 0,
    transition: { duration: durations.fast },
  },
  visible: {
    opacity: 1,
    transition: { duration: durations.normal },
  },
  exit: {
    opacity: 0,
    transition: { duration: durations.fast },
  },
};

// Page transition animations
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    transition: { duration: durations.fast },
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: { duration: durations.normal, ease: easings.smooth },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: durations.fast, ease: easings.smooth },
  },
};

// Select/deselect animations for interactive elements
export const selectVariants: Variants = {
  unselected: {
    backgroundColor: "var(--background)",
    borderColor: "var(--border)",
    scale: 1,
    transition: easings.snappy,
  },
  selected: {
    backgroundColor: "var(--primary)",
    borderColor: "var(--primary)",
    scale: 1.02,
    transition: easings.snappy,
  },
  hover: {
    backgroundColor: "var(--accent)",
    borderColor: "var(--accent-foreground)",
    scale: 1.01,
    transition: easings.snappy,
  },
};

// Loading spinner animation
export const spinnerVariants: Variants = {
  spinning: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// Typing indicator animation
export const typingVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: durations.normal,
      repeat: Infinity,
      repeatType: "reverse" as const,
      ease: easings.smooth,
    },
  },
};

// Bounce animation for notifications
export const bounceVariants: Variants = {
  hidden: { scale: 0, y: 50 },
  visible: {
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 15,
      stiffness: 500,
      mass: 0.8,
    },
  },
  exit: {
    scale: 0,
    y: -50,
    transition: { duration: durations.fast },
  },
};

// Animation presets for common patterns
export const animationPresets = {
  // For buttons and clickable elements
  button: {
    variants: scaleVariants,
    initial: "idle",
    whileHover: "hover",
    whileTap: "tap",
  },

  // For list items
  listItem: {
    variants: listItemVariants,
    initial: "hidden",
    animate: "visible",
    exit: "exit",
    layout: true,
  },

  // For messages in chat
  message: {
    variants: messageVariants,
    initial: "hidden",
    animate: "visible",
    exit: "exit",
    layout: true,
  },

  // For dialog content
  dialog: {
    variants: dialogVariants,
    initial: "hidden",
    animate: "visible",
    exit: "exit",
  },

  // For page transitions
  page: {
    variants: pageVariants,
    initial: "initial",
    animate: "enter",
    exit: "exit",
  },
} as const;

// Selection state management utilities
export const createSelectionAnimation = (isSelected: boolean) => ({
  animate: isSelected ? "selected" : "unselected",
  whileHover: "hover",
  variants: selectVariants,
});

// Stagger configuration for different scenarios
export const staggerConfigs = {
  fast: { staggerChildren: 0.02, delayChildren: 0.05 },
  normal: { staggerChildren: 0.05, delayChildren: 0.1 },
  slow: { staggerChildren: 0.1, delayChildren: 0.2 },
} as const;
