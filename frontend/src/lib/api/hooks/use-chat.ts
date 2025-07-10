"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ChatRequest } from "../../types/api";
import { ChatApi } from "../chat";

/**
 * 串流聊天的自定義 hook
 */
export const useStreamChat = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");

  const sendStreamMessage = useCallback(
    async (
      chatRequest: ChatRequest,
      onChunk?: (chunk: string) => void,
      onComplete?: (fullContent: string) => void,
      onError?: (error: Error) => void
    ) => {
      try {
        setIsStreaming(true);
        setStreamContent("");

        const stream = await ChatApi.sendMessageStream(chatRequest);

        if (!stream) {
          throw new Error("無法獲取串流響應");
        }

        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          setStreamContent(fullContent);

          if (onChunk) {
            onChunk(chunk);
          }
        }

        if (onComplete) {
          onComplete(fullContent);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "串流聊天失敗";
        console.error("串流聊天錯誤:", error);
        toast.error(errorMessage);

        if (onError) {
          onError(error instanceof Error ? error : new Error(errorMessage));
        }
      } finally {
        setIsStreaming(false);
      }
    },
    []
  );

  const resetStream = useCallback(() => {
    setStreamContent("");
    setIsStreaming(false);
  }, []);

  return {
    isStreaming,
    streamContent,
    sendStreamMessage,
    resetStream,
  };
};
