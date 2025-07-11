"use client";

import { animationPresets } from "@/lib/animations";
import { AnimatePresence, motion, MotionProps } from "framer-motion";
import { forwardRef } from "react";

// Generic motion wrapper with preset animations
interface MotionWrapperProps extends MotionProps {
  children: React.ReactNode;
  preset?: keyof typeof animationPresets;
  className?: string;
  isSelected?: boolean;
  show?: boolean;
}

export const MotionWrapper = forwardRef<HTMLDivElement, MotionWrapperProps>(
  (
    { children, preset, className, isSelected, show = true, ...motionProps },
    ref
  ) => {
    // Apply preset if provided
    const presetProps = preset ? animationPresets[preset] : {};

    // Override with any custom motion props
    const finalProps = { ...presetProps, ...motionProps };

    // Handle selection state for interactive elements
    if (isSelected !== undefined && preset === "listItem") {
      finalProps.animate = isSelected ? "selected" : "visible";
    }

    if (!show) {
      return null;
    }

    return (
      <motion.div ref={ref} className={className} {...finalProps}>
        {children}
      </motion.div>
    );
  }
);

MotionWrapper.displayName = "MotionWrapper";

// Specific wrapper for list containers with stagger
interface MotionListProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  stagger?: "fast" | "normal" | "slow";
}

export const MotionList = forwardRef<HTMLDivElement, MotionListProps>(
  ({ children, className, stagger = "normal", ...motionProps }, ref) => {
    const staggerConfig = {
      fast: { staggerChildren: 0.02, delayChildren: 0.05 },
      normal: { staggerChildren: 0.05, delayChildren: 0.1 },
      slow: { staggerChildren: 0.1, delayChildren: 0.2 },
    };

    return (
      <motion.div
        ref={ref}
        className={className}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: staggerConfig[stagger],
          },
          exit: {
            opacity: 0,
            transition: {
              staggerChildren: 0.02,
              staggerDirection: -1,
            },
          },
        }}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);

MotionList.displayName = "MotionList";

// Page transition wrapper
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition = ({
  children,
  className,
}: PageTransitionProps) => {
  return (
    <AnimatePresence mode="wait">
      <MotionWrapper preset="page" className={className}>
        {children}
      </MotionWrapper>
    </AnimatePresence>
  );
};

// Dialog/Modal transition wrapper
interface DialogTransitionProps {
  children: React.ReactNode;
  show: boolean;
  className?: string;
}

export const DialogTransition = ({
  children,
  show,
  className,
}: DialogTransitionProps) => {
  return (
    <AnimatePresence>
      {show && (
        <MotionWrapper preset="dialog" className={className}>
          {children}
        </MotionWrapper>
      )}
    </AnimatePresence>
  );
};

// Selectable item wrapper
interface SelectableItemProps extends MotionProps {
  children: React.ReactNode;
  isSelected: boolean;
  className?: string;
  onClick?: () => void;
}

export const SelectableItem = forwardRef<HTMLDivElement, SelectableItemProps>(
  ({ children, isSelected, className, onClick, ...motionProps }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={className}
        onClick={onClick}
        initial="unselected"
        animate={isSelected ? "selected" : "unselected"}
        whileHover="hover"
        whileTap="tap"
        variants={{
          unselected: {
            scale: 1,
            backgroundColor: "var(--background)",
            transition: { type: "spring", damping: 25, stiffness: 400 },
          },
          selected: {
            scale: 1.02,
            backgroundColor: "var(--accent)",
            transition: { type: "spring", damping: 25, stiffness: 400 },
          },
          hover: {
            scale: 1.01,
            backgroundColor: "var(--accent)",
            transition: { type: "spring", damping: 25, stiffness: 400 },
          },
          tap: {
            scale: 0.98,
            transition: { type: "spring", damping: 25, stiffness: 400 },
          },
        }}
        {...motionProps}
      >
        {children}
      </motion.div>
    );
  }
);

SelectableItem.displayName = "SelectableItem";
