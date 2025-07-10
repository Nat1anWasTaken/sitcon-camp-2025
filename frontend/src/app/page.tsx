"use client";

import { ContactData } from "@/components/contact";
import { Sidebar } from "@/components/sidebar";
import { useState } from "react";

// 示例聯絡人資料
const mockContacts: ContactData[] = [
  {
    id: "1",
    name: "張小明",
    avatar: "/avatars/zhang.jpg",
    description: "軟體工程師，專精於前端開發",
  },
  {
    id: "2",
    name: "李小華",
    avatar: "/avatars/li.jpg",
    description: "UI/UX 設計師",
  },
  {
    id: "3",
    name: "王大明",
    description: "專案經理，負責產品規劃",
  },
  {
    id: "4",
    name: "陳小美",
    avatar: "/avatars/chen.jpg",
    description: "後端工程師，資料庫專家",
  },
  {
    id: "5",
    name: "林志強",
    description: "DevOps 工程師",
  },
];

export default function Home() {
  const [activeContactId, setActiveContactId] = useState<string>();

  const handleContactClick = (contact: ContactData) => {
    setActiveContactId(contact.id);
    console.log("選擇的聯絡人:", contact.name);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* 側邊欄 */}
      <div className="w-80">
        <Sidebar
          contacts={mockContacts}
          activeContactId={activeContactId}
          onContactClick={handleContactClick}
        />
      </div>

      {/* 主要內容區域 */}
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            聯絡人管理系統
          </h1>
          {activeContactId ? (
            <div className="text-muted-foreground">
              <p className="mb-2">
                目前選擇的聯絡人：
                {mockContacts.find((c) => c.id === activeContactId)?.name}
              </p>
              <p className="text-sm">
                {
                  mockContacts.find((c) => c.id === activeContactId)
                    ?.description
                }
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">
              請從左側選擇一個聯絡人查看詳細資訊
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
