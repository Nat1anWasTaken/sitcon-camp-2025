"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Contact } from "@/lib/types/api";
import { cn } from "@/lib/utils";

interface ContactProps {
  contact: Contact;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Contact({
  contact,
  isActive = false,
  onClick,
  className,
}: ContactProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
        className
      )}
      onClick={onClick}
    >
      <Avatar className="size-10">
        <AvatarImage src={contact.avatar_url || undefined} alt={contact.name} />
        <AvatarFallback className="text-sm font-medium">
          {getInitials(contact.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{contact.name}</h3>
        {contact.description && (
          <p className="text-xs text-sidebar-foreground/60 truncate mt-0.5">
            {contact.description}
          </p>
        )}
      </div>
    </div>
  );
}
