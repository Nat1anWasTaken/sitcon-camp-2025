"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContactApi } from "@/lib/api/contact";
import { Contact } from "@/lib/types/api";
import { AvatarUploadDialog } from "./avatar-upload-dialog";

interface ContactAvatarProps {
  contact: Contact;
  onContactUpdate: (contact: Contact) => void;
  size?: "sm" | "md" | "lg";
}

export function ContactAvatar({
  contact,
  onContactUpdate,
  size = "lg",
}: ContactAvatarProps) {
  const getAvatarUrl = () => {
    if (contact.avatar_url) {
      return contact.avatar_url;
    }
    if (contact.avatar_key) {
      return ContactApi.getAvatarImageUrl(contact.id);
    }
    return undefined;
  };

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
          src={getAvatarUrl()}
          alt={contact.name}
          className="object-cover"
        />
        <AvatarFallback className={textSizeClasses[size]}>
          {contact.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <AvatarUploadDialog contact={contact} onContactUpdate={onContactUpdate} />
    </div>
  );
}
