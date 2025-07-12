"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { messageVariants } from "@/lib/animations";
import { ChatMessage, MessageContent } from "@/lib/types/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import Markdown from "react-markdown";
import { ToolCallDisplay } from "./tool-call-display";

interface MessageItemProps {
  message: ChatMessage;
  index?: number;
}

// 渲染複合內容
function renderContent(content: string | MessageContent[]) {
  // 向後兼容：處理純文字內容
  if (typeof content === "string") {
    return <Markdown>{content}</Markdown>;
  }

  // 處理複合內容
  return (
    <div className="space-y-3">
      {content.map((item, index) => {
        if (item.type === "text") {
          return (
            <p key={index} className="text-sm whitespace-pre-wrap">
              <Markdown>{item.text}</Markdown>
            </p>
          );
        } else if (item.type === "image") {
          return (
            <motion.div
              key={index}
              className="max-w-sm"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <Image
                src={`data:${item.mime_type};base64,${item.data}`}
                alt="附件圖片"
                width={320}
                height={240}
                className="rounded-lg max-w-full h-auto border border-border"
                unoptimized
              />
            </motion.div>
          );
        }
        return null;
      })}
    </div>
  );
}

export function MessageItem({ message, index = 0 }: MessageItemProps) {
  const isUser = message.role === "user";
  const isToolCall = message.type === "tool_call";

  return (
    <motion.div
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ delay: index * 0.05 }}
      layout
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", damping: 25, stiffness: 400 }}
      >
        <Avatar className="size-8">
          <AvatarFallback
            className={cn(
              "text-xs font-medium",
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-gradient-to-br from-purple-500 to-blue-500 text-white"
            )}
          >
            {isUser ? "你" : "AI"}
          </AvatarFallback>
        </Avatar>
      </motion.div>

      <div
        className={cn(
          "max-w-[80%]",
          isUser ? "ml-auto" : "mr-auto",
          "flex flex-col items-end"
        )}
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", damping: 25, stiffness: 400 }}
        >
          <Card
            className={cn(
              "p-3 inline-block",
              isUser ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            <div className="space-y-2">
              {/* 如果是工具調用，只顯示工具調用指示器 */}
              {isToolCall && message.toolCall && (
                <ToolCallDisplay toolCall={message.toolCall} />
              )}

              {/* 只在非工具調用時顯示訊息內容 */}
              {!isToolCall && message.content && renderContent(message.content)}
            </div>
          </Card>
        </motion.div>
        {message.timestamp && !isToolCall && (
          <motion.p
            className={cn(
              "text-xs text-muted-foreground mt-1 px-1",
              isUser ? "text-right" : "text-left"
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.2 }}
          >
            {new Date(message.timestamp).toLocaleTimeString("zh-TW", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
