"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ChatMessage, MessageContent } from "@/lib/types/api";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface MessageItemProps {
  message: ChatMessage;
}

// 渲染複合內容
function renderContent(content: string | MessageContent[]) {
  // 向後兼容：處理純文字內容
  if (typeof content === "string") {
    return <p className="text-sm whitespace-pre-wrap">{content}</p>;
  }

  // 處理複合內容
  return (
    <div className="space-y-3">
      {content.map((item, index) => {
        if (item.type === "text") {
          return (
            <p key={index} className="text-sm whitespace-pre-wrap">
              {item.text}
            </p>
          );
        } else if (item.type === "image") {
          return (
            <div key={index} className="max-w-sm">
              <Image
                src={`data:${item.mime_type};base64,${item.data}`}
                alt="附件圖片"
                width={320}
                height={240}
                className="rounded-lg max-w-full h-auto border border-border"
                unoptimized
              />
            </div>
          );
        }
        return null;
      })}
    </div>
  );
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
          {renderContent(message.content)}
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
