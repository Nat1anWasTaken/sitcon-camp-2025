"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ChatMessage } from "@/lib/types/api";
import { cn } from "@/lib/utils";

interface MessageItemProps {
  message: ChatMessage;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
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

      <div
        className={cn(
          "max-w-[80%]",
          isUser ? "ml-auto" : "mr-auto",
          "flex flex-col items-end"
        )}
      >
        <Card
          className={cn(
            "p-3 inline-block",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </Card>
        {message.timestamp && (
          <p
            className={cn(
              "text-xs text-muted-foreground mt-1 px-1",
              isUser ? "text-right" : "text-left"
            )}
          >
            {new Date(message.timestamp).toLocaleTimeString("zh-TW", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}
