"use client";

import { ChatInterface } from "@/components/chat";
import { Sidebar } from "@/components/sidebar";
import type { Contact } from "@/lib/types/api";
import { useState } from "react";

// 定義 Siri 的特殊 ID
const SIRI_ID = -1;

export default function Home() {
  const [activeContactId, setActiveContactId] = useState<number>();

  const handleContactClick = (contact: Contact) => {
    setActiveContactId(contact.id);
    console.log("選擇的聯絡人:", contact.name);
  };

  const handleSiriClick = () => {
    setActiveContactId(SIRI_ID);
    console.log("選擇了 Siri AI 助手");
  };

  // 檢查是否選擇了 Siri
  const isSiriActive = activeContactId === SIRI_ID;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* 側邊欄 */}
      <div className="w-80">
        <Sidebar
          activeContactId={activeContactId}
          isSiriActive={isSiriActive}
          onContactClick={handleContactClick}
          onSiriClick={handleSiriClick}
        />
      </div>

      {/* 主要內容區域 */}
      <div className="flex-1 flex bg-background">
        {isSiriActive ? (
          // Siri 聊天介面
          <ChatInterface className="w-full" />
        ) : (
          // 原有的聯絡人內容或歡迎頁面
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground mb-4">
                聯絡人管理系統
              </h1>
              {activeContactId && activeContactId !== SIRI_ID ? (
                <div className="text-muted-foreground">
                  <p className="mb-2">目前選擇的聯絡人 ID：{activeContactId}</p>
                  <p className="text-sm">聯絡人詳細資訊將在此顯示</p>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  請從左側選擇一個聯絡人查看詳細資訊，或與 Siri 開始對話
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
