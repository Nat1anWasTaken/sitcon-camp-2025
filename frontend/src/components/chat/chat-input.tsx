"use client";

import { Button } from "@/components/ui/button";
import { useRef } from "react";

interface ChatInputProps {
  inputMessage: string;
  isStreaming: boolean;
  hasMessages: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onClearHistory: () => void;
}

export function ChatInput({
  inputMessage,
  isStreaming,
  hasMessages,
  onInputChange,
  onSendMessage,
  onClearHistory,
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 處理鍵盤事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  // 處理輸入框高度自動調整
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
  };

  return (
    <div className="border-t p-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            onInput={handleInput}
            placeholder="輸入訊息..."
            className="w-full p-3 pr-12 border border-input rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring min-h-[50px] max-h-32"
            disabled={isStreaming}
            rows={1}
            style={{
              height: "auto",
              minHeight: "50px",
            }}
          />
          <Button
            size="sm"
            className="absolute right-2 top-2 h-8 w-8 p-0"
            onClick={onSendMessage}
            disabled={!inputMessage.trim() || isStreaming}
          >
            <svg
              className="size-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </Button>
        </div>
      </div>

      {hasMessages && (
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-muted-foreground">
            按 Enter 發送，Shift + Enter 換行
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearHistory}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            清除歷史
          </Button>
        </div>
      )}
    </div>
  );
}
