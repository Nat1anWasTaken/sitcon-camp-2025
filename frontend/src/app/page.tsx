"use client";

import { ChatInterface } from "@/components/chat";
import { ContactDetails } from "@/components/contact/contact-details";
import { Sidebar } from "@/components/sidebar";
import { useMobileNav } from "@/lib/contexts/mobile-nav-context";
import type { Contact } from "@/lib/types/api";
import { useState } from "react";

// 定義 Siri 的特殊 ID
const SIRI_ID = -1;

export default function Home() {
  const [activeContactId, setActiveContactId] = useState<number>();
  const { showContent, setShowContent, setActiveContactName, setIsSiriActive } =
    useMobileNav();

  const handleContactClick = (contact: Contact) => {
    setActiveContactId(contact.id);
    setActiveContactName(contact.name);
    setIsSiriActive(false);
    setShowContent(true);
    console.log("選擇的聯絡人:", contact.name);
  };

  const handleSiriClick = () => {
    setActiveContactId(SIRI_ID);
    setActiveContactName(undefined);
    setIsSiriActive(true);
    setShowContent(true);
    console.log("選擇了 Siri AI 助手");
  };

  // 檢查是否選擇了 Siri
  const isSiriActive = activeContactId === SIRI_ID;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* 側邊欄 - 在桌面版始終顯示，在移動版當 showContent=false 時顯示 */}
      <div
        className={`
        w-full md:w-80 
        ${showContent ? "hidden md:block" : "block"}
      `}
      >
        <Sidebar
          activeContactId={activeContactId}
          isSiriActive={isSiriActive}
          onContactClick={handleContactClick}
          onSiriClick={handleSiriClick}
        />
      </div>

      {/* 主要內容區域 - 在桌面版始終顯示，在移動版當 showContent=true 時顯示 */}
      <div
        className={`
        flex-1 flex bg-background w-full
        ${showContent ? "block" : "hidden md:flex"}
      `}
      >
        {isSiriActive ? (
          // Siri 聊天介面
          <ChatInterface className="w-full" />
        ) : activeContactId ? (
          // 聯絡人詳情介面
          <div className="flex-1 p-2 sm:p-4 md:p-6 overflow-auto">
            <ContactDetails contactId={activeContactId} />
          </div>
        ) : (
          // 歡迎頁面
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground mb-4">
                聯絡人管理系統
              </h1>
              <p className="text-muted-foreground">
                請從左側選擇一個聯絡人查看詳細資訊，或與 Siri 開始對話
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
