"use client";

import { MotionList } from "@/components/motion-wrapper";
import { ChatMessage } from "@/lib/types/api";
import { AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { MessageItem } from "./message-item";
import { TypingIndicator } from "./typing-indicator";

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamContent: string;
  isTyping: boolean;
}

export function MessageList({
  messages,
  isStreaming,
  streamContent,
  isTyping,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自動滾動到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamContent]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <MotionList className="space-y-4" stagger="normal">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <MessageItem
              key={`${message.timestamp}-${index}`}
              message={message}
              index={index}
            />
          ))}
        </AnimatePresence>

        {/* 顯示打字指示器 */}
        <TypingIndicator
          isStreaming={isStreaming || isTyping}
          streamContent={streamContent}
        />
      </MotionList>

      <div ref={messagesEndRef} />
    </div>
  );
}
