"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Contact } from "@/lib/types/api";
import { CalendarDays, Edit } from "lucide-react";

interface ContactInfoDisplayProps {
  contact: Contact;
  onEdit: () => void;
}

export function ContactInfoDisplay({
  contact,
  onEdit,
}: ContactInfoDisplayProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isMobile = useIsMobile();

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <h2 className="text-xl sm:text-2xl font-bold break-words pr-2">
          {contact.name || "未命名聯絡人"}
        </h2>
        {!isMobile && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="self-start sm:self-auto"
          >
            <Edit className="h-4 w-4 mr-2" />
            編輯
          </Button>
        )}
      </div>

      {contact.description && (
        <p className="text-muted-foreground break-words">
          {contact.description}
        </p>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-sm text-muted-foreground">
        <div className="flex items-center space-x-1">
          <CalendarDays className="h-4 w-4 shrink-0" />
          <span className="break-words">
            建立於 {formatDate(contact.created_at)}
          </span>
        </div>
        <Badge variant="outline" className="self-start">
          ID: {contact.id}
        </Badge>
      </div>
      {isMobile && (
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          className="self-start sm:self-auto w-full"
        >
          <Edit className="h-4 w-4 mr-2" />
          編輯
        </Button>
      )}
    </div>
  );
}
