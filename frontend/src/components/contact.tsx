"use client";

import { SelectableItem } from "@/components/motion-wrapper";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useContactAvatar } from "@/lib/api/hooks";
import type { Contact } from "@/lib/types/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
  // Use the same avatar hook as ContactAvatar component
  const { data: avatarUrl, isLoading: isAvatarLoading } = useContactAvatar(
    contact.id,
    Boolean(contact.avatar_key)
  );

  const getInitials = (name: string | undefined) => {
    if (!name || name.trim().length === 0) {
      return "?";
    }
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SelectableItem
      isSelected={isActive}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
        className
      )}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", damping: 25, stiffness: 400 }}
      >
        <Avatar className="size-10">
          <AvatarImage
            src={avatarUrl || undefined}
            alt={contact.name || "Contact"}
            className="object-cover"
          />
          <AvatarFallback className="text-sm font-medium">
            {isAvatarLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="text-xs"
              >
                ...
              </motion.div>
            ) : (
              getInitials(contact.name)
            )}
          </AvatarFallback>
        </Avatar>
      </motion.div>

      <div className="flex-1 min-w-0">
        <motion.h3
          className="font-medium text-sm truncate"
          animate={{ x: isActive ? 2 : 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 400 }}
        >
          {contact.name || "未命名聯絡人"}
        </motion.h3>
        {contact.description && (
          <motion.p
            className="text-xs text-sidebar-foreground/60 truncate mt-0.5"
            animate={{ x: isActive ? 2 : 0 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 400,
              delay: 0.05,
            }}
          >
            {contact.description}
          </motion.p>
        )}
      </div>
    </SelectableItem>
  );
}
