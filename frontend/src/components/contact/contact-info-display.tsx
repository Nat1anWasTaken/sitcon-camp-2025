"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{contact.name}</h2>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          編輯
        </Button>
      </div>

      {contact.description && (
        <p className="text-muted-foreground">{contact.description}</p>
      )}

      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
        <div className="flex items-center space-x-1">
          <CalendarDays className="h-4 w-4" />
          <span>建立於 {formatDate(contact.created_at)}</span>
        </div>
        <Badge variant="outline">ID: {contact.id}</Badge>
      </div>
    </div>
  );
}
