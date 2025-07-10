"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

interface TypingIndicatorProps {
  isStreaming?: boolean;
  streamContent?: string;
}

export function TypingIndicator({
  isStreaming,
  streamContent,
}: TypingIndicatorProps) {
  if (isStreaming && streamContent) {
    // 顯示串流中的內容
    return (
      <div className="flex gap-3">
        <Avatar className="size-8">
          <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-purple-500 to-blue-500 text-white">
            AI
          </AvatarFallback>
        </Avatar>
        <div className="max-w-[80%] mr-auto">
          <Card className="p-3 bg-muted inline-block">
            <p className="text-sm whitespace-pre-wrap">{streamContent}</p>
            <div className="animate-pulse inline-block w-2 h-4 bg-foreground/30 ml-1" />
          </Card>
        </div>
      </div>
    );
  }

  if (isStreaming && !streamContent) {
    // 顯示打字動畫
    return (
      <div className="flex gap-3">
        <Avatar className="size-8">
          <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-purple-500 to-blue-500 text-white">
            AI
          </AvatarFallback>
        </Avatar>
        <div className="max-w-[80%] mr-auto">
          <Card className="p-3 bg-muted inline-block">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.1s]" />
              <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
