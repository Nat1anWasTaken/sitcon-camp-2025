"use client";

import { SelectableItem } from "@/components/motion-wrapper";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SiriProps {
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Siri({ isActive = false, onClick, className }: SiriProps) {
  return (
    <SelectableItem
      isSelected={isActive}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
        "border border-dashed border-sidebar-border/50",
        "bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20",
        "hover:from-purple-100/70 hover:to-blue-100/70 dark:hover:from-purple-900/30 dark:hover:to-blue-900/30",
        "hover:border-sidebar-border",
        isActive &&
          "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border",
        className
      )}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", damping: 25, stiffness: 400 }}
      >
        <Avatar className="size-10">
          <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-purple-500 to-blue-500 text-white">
            <motion.svg
              className="size-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              animate={{ rotate: isActive ? [0, 5, -5, 0] : 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              <circle cx="12" cy="8" r="2" />
              <path
                d="M12 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
                opacity="0.3"
              />
            </motion.svg>
          </AvatarFallback>
        </Avatar>
      </motion.div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <motion.h3
            className="font-medium text-sm"
            animate={{ x: isActive ? 2 : 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
          >
            Siri
          </motion.h3>
          <motion.span
            className="px-1.5 py-0.5 text-xs font-medium bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-full"
            animate={{
              x: isActive ? 2 : 0,
            }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 400,
            }}
          >
            AI
          </motion.span>
        </div>
        <motion.p
          className="text-xs text-sidebar-foreground/70 mt-0.5"
          animate={{ x: isActive ? 2 : 0 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 400,
            delay: 0.05,
          }}
        >
          你的智慧助手
        </motion.p>
      </div>

      {/* Sparkle icon */}
      <motion.div
        className="text-sidebar-foreground/40"
        animate={{
          rotate: isActive ? [0, 15, -15, 0] : 0,
          scale: isActive ? [1, 1.2, 1] : 1,
        }}
        transition={{
          duration: 1.5,
          repeat: isActive ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0l1.5 4.5L18 6l-4.5 1.5L12 12l-1.5-4.5L6 6l4.5-1.5L12 0z" />
          <path d="M19 12l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
          <path d="M5 12l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
        </svg>
      </motion.div>
    </SelectableItem>
  );
}
