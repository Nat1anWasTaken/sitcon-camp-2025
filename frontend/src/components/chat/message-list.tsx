"use client";

import { ChatMessage } from "@/lib/types/api";
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
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <MessageItem key={index} message={message} />
      ))}

      {/* 顯示打字指示器 */}
      <TypingIndicator
        isStreaming={isStreaming || isTyping}
        streamContent={streamContent}
      />

      <div ref={messagesEndRef} />
    </div>
  );
}
