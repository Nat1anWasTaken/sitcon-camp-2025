"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useContactAvatar } from "@/lib/api/hooks";
import { Contact } from "@/lib/types/api";
import { useEffect } from "react";
import { AvatarUploadDialog } from "./avatar-upload-dialog";

interface ContactAvatarProps {
  contact: Contact;
  size?: "sm" | "md" | "lg";
}

export function ContactAvatar({ contact, size = "lg" }: ContactAvatarProps) {
  const { data: avatarUrl, isLoading } = useContactAvatar(
    contact.id,
    Boolean(contact.avatar_key)
  );

  // 清理 blob URL 當組件銷毀或 avatarUrl 改變時
  useEffect(() => {
    // 當 avatarUrl 改變時，清理舊的 blob URL
    return () => {
      if (avatarUrl && avatarUrl.startsWith("blob:")) {
        URL.revokeObjectURL(avatarUrl);
      }
    };
  }, [avatarUrl]);

  // 當 contact.avatar_key 變為空時，確保清理之前的 avatarUrl
  useEffect(() => {
    if (!contact.avatar_key && avatarUrl && avatarUrl.startsWith("blob:")) {
      URL.revokeObjectURL(avatarUrl);
    }
  }, [contact.avatar_key, avatarUrl]);

  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-24 w-24",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <div className="relative">
      <Avatar className={sizeClasses[size]}>
        <AvatarImage
          src={avatarUrl || undefined}
          alt={contact.name}
          className="object-cover"
        />
        <AvatarFallback className={textSizeClasses[size]}>
          {isLoading
            ? "..."
            : contact.name && contact.name.length > 0
            ? contact.name.charAt(0).toUpperCase()
            : "?"}
        </AvatarFallback>
      </Avatar>

      <AvatarUploadDialog contact={contact} />
    </div>
  );
}
