"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { messageVariants } from "@/lib/animations";
import { AnimatePresence, motion } from "framer-motion";

interface TypingIndicatorProps {
  isStreaming?: boolean;
  streamContent?: string;
}

export function TypingIndicator({
  isStreaming,
  streamContent,
}: TypingIndicatorProps) {
  return (
    <AnimatePresence mode="wait">
      {isStreaming && streamContent && (
        // 顯示串流中的內容
        <motion.div
          className="flex gap-3"
          variants={messageVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          layout
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
          >
            <Avatar className="size-8">
              <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                AI
              </AvatarFallback>
            </Avatar>
          </motion.div>
          <div className="max-w-[80%] mr-auto">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
            >
              <Card className="p-3 bg-muted inline-block">
                <motion.p
                  className="text-sm whitespace-pre-wrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {streamContent}
                </motion.p>
                <motion.div
                  className="inline-block w-2 h-4 bg-foreground/30 ml-1"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </Card>
            </motion.div>
          </div>
        </motion.div>
      )}

      {isStreaming && !streamContent && (
        // 顯示打字動畫
        <motion.div
          className="flex gap-3"
          variants={messageVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          layout
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
          >
            <Avatar className="size-8">
              <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                AI
              </AvatarFallback>
            </Avatar>
          </motion.div>
          <div className="max-w-[80%] mr-auto">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
            >
              <Card className="p-3 bg-muted inline-block">
                <div className="flex space-x-1">
                  {[0, 1, 2].map((index) => (
                    <motion.div
                      key={index}
                      className="w-2 h-2 bg-foreground/50 rounded-full"
                      animate={{
                        y: [0, -5, 0],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: index * 0.15,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
