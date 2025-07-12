"use client";

import { ChatInterface } from "@/components/chat";
import { ContactDetails } from "@/components/contact/contact-details";
import { PageTransition } from "@/components/motion-wrapper";
import { Sidebar } from "@/components/sidebar";
import { useMobileNav } from "@/lib/contexts/mobile-nav-context";
import type { Contact } from "@/lib/types/api";
import { AnimatePresence, motion } from "framer-motion";
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
    <PageTransition className="flex h-[calc(100vh-4rem)]">
      {/* 側邊欄 - 在桌面版始終顯示，在移動版當 showContent=false 時顯示 */}
      <motion.div
        className={`
        w-full md:w-80 
        ${showContent ? "hidden md:block" : "block"}
      `}
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Sidebar
          activeContactId={activeContactId}
          isSiriActive={isSiriActive}
          onContactClick={handleContactClick}
          onSiriClick={handleSiriClick}
          onContactDeleted={() => setActiveContactId(undefined)} // 刪除後清空選取
        />
      </motion.div>
      
      {/* 主要內容區域 - 在桌面版始終顯示，在移動版當 showContent=true 時顯示 */}
      <motion.div
        className={`
        flex-1 flex bg-background w-full
        ${showContent ? "block" : "hidden md:flex"}
      `}
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94],
          delay: 0.1,
        }}
      >
        <AnimatePresence mode="wait">
          {isSiriActive ? (
            // Siri 聊天介面
            <motion.div
              key="siri-chat"
              className="w-full"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <ChatInterface className="w-full" />
            </motion.div>
          ) : activeContactId ? (
            // 聯絡人詳情介面
            <motion.div
              key={`contact-${activeContactId}`}
              className="flex-1 p-2 sm:p-4 md:p-6 overflow-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ContactDetails contactId={activeContactId!} />
            </motion.div>
          ) : (
            // 歡迎頁面
            <motion.div
              key="welcome"
              className="flex-1 flex items-center justify-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                className="text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <motion.h1
                  className="text-2xl font-bold text-foreground mb-4"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  聯絡人管理系統
                </motion.h1>
                <motion.p
                  className="text-muted-foreground"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  請從左側選擇一個聯絡人查看詳細資訊，或與 Siri 開始對話
                </motion.p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </PageTransition>
  );
}
