"use client";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Contact, ContactData } from "./contact";
import { Siri } from "./siri";

interface SidebarProps {
  contacts: ContactData[];
  activeContactId?: string;
  isSiriActive?: boolean;
  onContactClick?: (contact: ContactData) => void;
  onSiriClick?: () => void;
  className?: string;
}

export function Sidebar({
  contacts,
  activeContactId,
  isSiriActive,
  onContactClick,
  onSiriClick,
  className,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <input
            type="text"
            placeholder="搜尋聯絡人..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full px-3 py-2 text-sm rounded-md",
              "bg-sidebar-accent text-sidebar-accent-foreground",
              "border border-sidebar-border",
              "placeholder:text-sidebar-foreground/50",
              "focus:outline-none focus:ring-2 focus:ring-sidebar-ring"
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
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
          {(filteredContacts.length > 0 || searchQuery) && (
            <div className="mb-3">
              <Separator className="mb-3" />
            </div>
          )}

          {/* Regular Contacts */}
          {filteredContacts.length === 0 && searchQuery ? (
            <div className="text-center py-8">
              <p className="text-sidebar-foreground/60 text-sm">
                找不到符合的聯絡人
              </p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sidebar-foreground/60 text-sm">
                目前沒有聯絡人
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredContacts.map((contact) => (
                <Contact
                  key={contact.id}
                  contact={contact}
                  isActive={contact.id === activeContactId}
                  onClick={() => onContactClick?.(contact)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
