"use client";

import { ToolCall } from "@/lib/types/api";
import { cn } from "@/lib/utils";
import {
  Code,
  FileText,
  MessageSquare,
  Search,
  Settings,
  Terminal,
  Wrench,
} from "lucide-react";
import { useState } from "react";

interface ToolCallDisplayProps {
  toolCall: ToolCall;
  className?: string;
}

// 工具圖標映射
const getToolIcon = (toolName: string) => {
  const name = toolName.toLowerCase();
  if (name.includes("search") || name.includes("find")) return Search;
  if (name.includes("code") || name.includes("edit")) return Code;
  if (name.includes("file") || name.includes("read")) return FileText;
  if (name.includes("terminal") || name.includes("run")) return Terminal;
  if (name.includes("chat") || name.includes("message")) return MessageSquare;
  return Wrench;
};

export function ToolCallDisplay({ toolCall, className }: ToolCallDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const IconComponent = getToolIcon(toolCall.name);

  return (
    <div className={cn("", className)}>
      {/* 簡潔的工具調用指示器 */}
      <div className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
        <IconComponent className="h-3 w-3" />
        <span className="font-medium">{toolCall.name}</span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-1 hover:text-foreground transition-colors"
          title="點擊查看詳細"
        >
          <Settings className="h-3 w-3" />
        </button>
      </div>

      {/* 展開的詳細信息（內聯展開） */}
      {isExpanded && (
        <div className="mt-2 p-2 bg-background/50 border border-border/50 rounded text-xs space-y-1">
          <div className="font-medium">執行結果:</div>
          <div className="text-muted-foreground bg-muted/50 p-2 rounded max-h-20 overflow-y-auto">
            {toolCall.result}
          </div>
          {Object.keys(toolCall.arguments).length > 0 && (
            <>
              <div className="font-medium">參數:</div>
              <div className="text-muted-foreground bg-muted/50 p-2 rounded max-h-16 overflow-y-auto">
                {Object.entries(toolCall.arguments).map(([key, value]) => (
                  <div key={key} className="mb-1">
                    <span className="font-medium">{key}:</span> {String(value)}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
