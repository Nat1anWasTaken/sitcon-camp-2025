"use client";

import { useChat } from "@/lib/api/hooks/use-chat";
import { cleanupImageUrls } from "@/lib/image-utils";
import {
  ChatMessage,
  ImageContent,
  ImageFile,
  MessageContent,
  TextContent,
} from "@/lib/types/api";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";
import { WelcomeScreen } from "./welcome-screen";

const CHAT_HISTORY_KEY = "siri-chat-history";

interface ChatInterfaceProps {
  className?: string;
}

export function ChatInterface({ className }: ChatInterfaceProps) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [attachedImages, setAttachedImages] = useState<ImageFile[]>([]);

  const {
    messages: sseMessages,
    isProcessing,
    sendMessage,
    clearMessages,
    connectionState,
    streamingContent,
  } = useChat();

  // 載入聊天歷史
  useEffect(() => {
    const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setChatHistory(parsedHistory);
      } catch (error) {
        console.error("解析聊天歷史失敗:", error);
      }
    }
  }, []);

  // 清理圖片預覽 URL 當組件卸載時
  useEffect(() => {
    return () => {
      if (attachedImages.length > 0) {
        cleanupImageUrls(attachedImages);
      }
    };
  }, [attachedImages]);

  // 監聽 SSE 訊息變化，當聊天完成時自動添加到歷史記錄
  useEffect(() => {
    if (!isProcessing && sseMessages.length > 0) {
      // 聊天完成，將所有 SSE 訊息添加到歷史記錄
      const newAssistantMessages: ChatMessage[] = sseMessages.map((sseMsg) => ({
        role: sseMsg.role || "assistant",
        content: sseMsg.content,
        timestamp: sseMsg.timestamp,
        type: sseMsg.type,
        toolCall: sseMsg.toolCall,
        id: sseMsg.id,
      }));

      setChatHistory((prev) => {
        const newHistory = [...prev, ...newAssistantMessages];
        saveChatHistory(newHistory);
        return newHistory;
      });

      // 清空 SSE 訊息（因為已經保存到歷史中）
      clearMessages();
    }
  }, [isProcessing, sseMessages, clearMessages]);

  // 保存聊天歷史
  const saveChatHistory = (newMessages: ChatMessage[]) => {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(newMessages));
  };

  // 創建複合內容格式的訊息
  const createMessageContent = (
    text: string,
    images: ImageFile[]
  ): string | MessageContent[] => {
    // 如果沒有圖片，返回純文字格式（向後兼容）
    if (images.length === 0) {
      return text;
    }

    // 創建複合內容格式
    const content: MessageContent[] = [];

    // 添加文字內容（如果有）
    if (text.trim()) {
      const textContent: TextContent = {
        type: "text",
        text: text.trim(),
      };
      content.push(textContent);
    }

    // 添加圖片內容
    images.forEach((image) => {
      const imageContent: ImageContent = {
        type: "image",
        data: image.base64,
        mime_type: image.mimeType,
      };
      content.push(imageContent);
    });

    return content;
  };

  // 發送訊息
  const handleSendMessage = async () => {
    // 檢查是否有內容可發送
    const hasText = inputMessage.trim();
    const hasImages = attachedImages.length > 0;

    if ((!hasText && !hasImages) || isProcessing) return;

    // 創建用戶訊息
    const messageContent = createMessageContent(inputMessage, attachedImages);
    const userMessage: ChatMessage = {
      role: "user",
      content: messageContent,
      timestamp: new Date().toISOString(),
    };

    const newChatHistory = [...chatHistory, userMessage];
    setChatHistory(newChatHistory);
    saveChatHistory(newChatHistory);

    // 清理當前輸入和圖片
    setInputMessage("");
    cleanupImageUrls(attachedImages);
    setAttachedImages([]);

    try {
      // 準備聊天請求
      const chatRequest = {
        history_messages: chatHistory,
        messages: [userMessage],
      };

      // 發送 SSE 請求
      await sendMessage(chatRequest);
    } catch (error) {
      console.error("發送訊息失敗:", error);
    }
  };

  // 清除聊天歷史
  const clearHistory = () => {
    setChatHistory([]);
    clearMessages();
    localStorage.removeItem(CHAT_HISTORY_KEY);
    // 清理附加的圖片
    if (attachedImages.length > 0) {
      cleanupImageUrls(attachedImages);
      setAttachedImages([]);
    }
  };

  // 處理圖片變更
  const handleImagesChange = (images: ImageFile[]) => {
    setAttachedImages(images);
  };

  // 處理歡迎頁面的建議點擊
  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  // 合併聊天歷史和當前 SSE 訊息用於顯示
  const allMessages = [
    ...chatHistory,
    ...sseMessages.map((sseMsg) => ({
      role: sseMsg.role || "assistant",
      content: sseMsg.content,
      timestamp: sseMsg.timestamp,
      type: sseMsg.type,
      toolCall: sseMsg.toolCall,
      id: sseMsg.id,
    })),
  ];

  // 使用來自 hook 的串流內容
  const currentStreamContent = isProcessing ? streamingContent : "";

  const hasMessages = allMessages.length > 0 || isProcessing;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {!hasMessages ? (
        <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
      ) : (
        <MessageList
          messages={allMessages}
          isStreaming={isProcessing}
          streamContent={currentStreamContent}
          isTyping={connectionState === "connecting"}
        />
      )}

      <ChatInput
        inputMessage={inputMessage}
        isStreaming={isProcessing}
        hasMessages={hasMessages}
        attachedImages={attachedImages}
        onInputChange={setInputMessage}
        onSendMessage={handleSendMessage}
        onClearHistory={clearHistory}
        onImagesChange={handleImagesChange}
      />
    </div>
  );
}
