"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ChatRequest,
  SSEConnectedEvent,
  SSEConnectionState,
  SSEDoneEvent,
  SSEErrorEvent,
  SSEEventHandlers,
  SSEMessageEvent,
  SSEToolCallEvent,
} from "../../types/api";
import { ChatApi, SSEConnection } from "../chat";

/**
 * 聊天訊息項目
 */
export interface ChatMessageItem {
  id: string;
  type: "message" | "tool_call";
  content: string;
  timestamp: string;
  toolCall?: {
    name: string;
    arguments: Record<string, unknown>;
    result: string;
  };
}

/**
 * 新的 SSE 聊天 hook
 */
export const useChat = () => {
  const [connectionState, setConnectionState] =
    useState<SSEConnectionState>("disconnected");
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const connectionRef = useRef<SSEConnection | null>(null);
  const streamingContentRef = useRef<string>("");

  const addMessage = useCallback((message: ChatMessageItem) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const generateMessageId = useCallback(() => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const sendMessage = useCallback(
    async (
      chatRequest: ChatRequest,
      customHandlers?: Partial<SSEEventHandlers>
    ) => {
      if (isProcessing) {
        console.warn("Already processing a message, ignoring new request");
        return;
      }

      try {
        setIsProcessing(true);
        setConnectionState("connecting");
        setStreamingContent(""); // 重置串流內容
        streamingContentRef.current = ""; // 重置 ref

        const handlers: SSEEventHandlers = {
          onConnected: (event: SSEConnectedEvent) => {
            setConnectionState("connected");
            console.log("聊天連接已建立:", event.message);
            customHandlers?.onConnected?.(event);
          },

          onMessage: (event: SSEMessageEvent) => {
            // 累積串流內容而不是創建單獨的訊息
            console.log("收到 SSE 訊息:", event.content);
            streamingContentRef.current += event.content;
            setStreamingContent(streamingContentRef.current);
            console.log("累積內容:", streamingContentRef.current);
            customHandlers?.onMessage?.(event);
          },

          onToolCall: (event: SSEToolCallEvent) => {
            const messageItem: ChatMessageItem = {
              id: generateMessageId(),
              type: "tool_call",
              content: event.content,
              timestamp: event.timestamp,
              toolCall: event.tool_call,
            };
            addMessage(messageItem);
            customHandlers?.onToolCall?.(event);
          },

          onDone: (event: SSEDoneEvent) => {
            setConnectionState("disconnected");
            setIsProcessing(false);

            console.log("聊天完成，最終累積內容:", streamingContentRef.current);

            // 將累積的串流內容創建為最終訊息
            if (streamingContentRef.current.trim()) {
              const finalMessage: ChatMessageItem = {
                id: generateMessageId(),
                type: "message",
                content: streamingContentRef.current,
                timestamp: new Date().toISOString(),
              };
              console.log("創建最終訊息:", finalMessage);
              addMessage(finalMessage);
            }

            // 清空串流內容
            setStreamingContent("");
            streamingContentRef.current = "";

            console.log("聊天完成:", event.message);
            customHandlers?.onDone?.(event);
          },

          onError: (event: SSEErrorEvent) => {
            setConnectionState("error");
            setIsProcessing(false);
            setStreamingContent(""); // 清空串流內容
            streamingContentRef.current = ""; // 清空 ref
            console.error("聊天錯誤:", event.message);
            toast.error(`聊天錯誤: ${event.message}`);

            // 添加錯誤訊息到聊天記錄
            const errorMessage: ChatMessageItem = {
              id: generateMessageId(),
              type: "message",
              content: `❌ 錯誤: ${event.message}`,
              timestamp: new Date().toISOString(),
            };
            addMessage(errorMessage);

            customHandlers?.onError?.(event);
          },
        };

        const connection = await ChatApi.sendMessage(chatRequest, handlers);
        connectionRef.current = connection;
      } catch (error) {
        setConnectionState("error");
        setIsProcessing(false);
        setStreamingContent(""); // 清空串流內容
        streamingContentRef.current = ""; // 清空 ref
        const errorMessage =
          error instanceof Error ? error.message : "發送訊息失敗";
        console.error("發送訊息錯誤:", error);
        toast.error(errorMessage);

        // 添加錯誤訊息到聊天記錄
        const errorMessageItem: ChatMessageItem = {
          id: generateMessageId(),
          type: "message",
          content: `❌ 連接錯誤: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        };
        addMessage(errorMessageItem);
      }
    },
    [isProcessing, addMessage, generateMessageId]
  );

  const disconnectChat = useCallback(async () => {
    if (connectionRef.current) {
      await connectionRef.current.close();
      connectionRef.current = null;
    }
    setConnectionState("disconnected");
    setIsProcessing(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingContent("");
    streamingContentRef.current = "";
  }, []);

  const resetChat = useCallback(async () => {
    await disconnectChat();
    clearMessages();
  }, [disconnectChat, clearMessages]);

  return {
    // 狀態
    connectionState,
    messages,
    isProcessing,
    streamingContent,

    // 操作
    sendMessage,
    disconnectChat,
    clearMessages,
    resetChat,

    // 便利屬性
    isConnected: connectionState === "connected",
    hasError: connectionState === "error",
  };
};
