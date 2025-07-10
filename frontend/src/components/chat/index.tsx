"use client";

import { useStreamChat } from "@/lib/api/hooks/use-chat";
import { ChatMessage } from "@/lib/types/api";
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const { isStreaming, streamContent, sendStreamMessage, resetStream } =
    useStreamChat();

  // 載入聊天歷史
  useEffect(() => {
    const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setMessages(parsedHistory);
      } catch (error) {
        console.error("解析聊天歷史失敗:", error);
      }
    }
  }, []);

  // 保存聊天歷史
  const saveChatHistory = (newMessages: ChatMessage[]) => {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(newMessages));
  };

  // 發送訊息
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    saveChatHistory(newMessages);
    setInputMessage("");
    setIsTyping(true);
    resetStream();

    try {
      // 準備聊天請求
      const chatRequest = {
        history_messages: messages,
        messages: [userMessage],
      };

      // 發送串流請求
      await sendStreamMessage(
        chatRequest,
        () => {
          // 處理每個串流塊
        },
        (fullContent) => {
          // 串流完成
          const assistantMessage: ChatMessage = {
            role: "assistant",
            content: fullContent,
            timestamp: new Date().toISOString(),
          };

          const finalMessages = [...newMessages, assistantMessage];
          setMessages(finalMessages);
          saveChatHistory(finalMessages);
          setIsTyping(false);
        },
        (error) => {
          console.error("聊天錯誤:", error);
          setIsTyping(false);
        }
      );
    } catch (error) {
      console.error("發送訊息失敗:", error);
      setIsTyping(false);
    }
  };

  // 清除聊天歷史
  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
  };

  // 處理歡迎頁面的建議點擊
  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const hasMessages = messages.length > 0 || isStreaming;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {!hasMessages ? (
        <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
      ) : (
        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          streamContent={streamContent}
          isTyping={isTyping}
        />
      )}

      <ChatInput
        inputMessage={inputMessage}
        isStreaming={isStreaming}
        hasMessages={hasMessages}
        onInputChange={setInputMessage}
        onSendMessage={handleSendMessage}
        onClearHistory={clearHistory}
      />
    </div>
  );
}
