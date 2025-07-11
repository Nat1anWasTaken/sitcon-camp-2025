"use client";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useContactSearch } from "@/lib/api/hooks/use-contact";
import type { Contact } from "@/lib/types/api";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Contact as ContactComponent } from "./contact";
import { CreateContactDialog } from "./contact/create-contact-dialog";
import { Siri } from "./siri";

interface SidebarProps {
  activeContactId?: number;
  isSiriActive?: boolean;
  onContactClick?: (contact: Contact) => void;
  onSiriClick?: () => void;
  className?: string;
}

export function Sidebar({
  activeContactId,
  isSiriActive,
  onContactClick,
  onSiriClick,
  className,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // 使用API級別的搜尋功能
  const {
    data: contactsResponse,
    isLoading,
    error,
  } = useContactSearch(searchQuery);

  // 直接使用API返回的Contact資料
  const contacts: Contact[] = contactsResponse?.data?.contacts || [];

  const renderContactsList = () => {
    if (isLoading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sidebar-foreground mx-auto mb-4"></div>
          <p className="text-sidebar-foreground/60 text-sm">載入聯絡人中...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8 px-4">
          <div className="text-red-500 mb-2">
            <svg
              className="w-8 h-8 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-red-500 text-sm font-medium mb-1">載入失敗</p>
          <p className="text-sidebar-foreground/60 text-xs">{error.message}</p>
        </div>
      );
    }

    if (contacts.length === 0 && searchQuery) {
      return (
        <div className="text-center py-8">
          <p className="text-sidebar-foreground/60 text-sm">
            找不到符合的聯絡人
          </p>
        </div>
      );
    }

    if (contacts.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-sidebar-foreground/60 text-sm">目前沒有聯絡人</p>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {contacts.map((contact) => (
          <ContactComponent
            key={contact.id}
            contact={contact}
            isActive={contact.id === activeContactId}
            onClick={() => onContactClick?.(contact)}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="text-lg font-semibold text-sidebar-foreground mb-3">
          聊天
        </h2>

        {/* Search Input */}
        <div className="relative">
          <Input
            type="text"
            placeholder="搜尋聯絡人..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading || !!error}
            className={cn(
              "w-full px-3 py-2 text-sm",
              "bg-sidebar-accent text-sidebar-accent-foreground",
              "border-sidebar-border",
              "placeholder:text-sidebar-foreground/50",
              "focus:ring-2 focus:ring-sidebar-ring",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sidebar-foreground/50"></div>
            ) : (
              <svg
                className="size-4 text-sidebar-foreground/50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {/* Siri AI Bot */}
          <div className="mb-3">
            <Siri isActive={isSiriActive} onClick={onSiriClick} />
          </div>

          {/* Divider */}
          {(contacts.length > 0 || searchQuery || isLoading || error) && (
            <div className="mb-3">
              <Separator className="mb-3" />
            </div>
          )}

          {/* Create New Contact Button */}
          <div className="mb-3">
            <CreateContactDialog />
          </div>

          {/* Regular Contacts */}
          {renderContactsList()}
        </div>
      </div>
    </div>
  );
}
