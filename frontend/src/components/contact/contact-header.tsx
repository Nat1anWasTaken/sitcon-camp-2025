"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Contact } from "@/lib/types/api";
import { useState } from "react";
import { ContactAvatar } from "./contact-avatar";
import { ContactInfoDisplay } from "./contact-info-display";
import { ContactInfoEditor } from "./contact-info-editor";

interface ContactHeaderProps {
  contact: Contact;
  onContactUpdate: (contact: Contact) => void;
}

export function ContactHeader({
  contact,
  onContactUpdate,
}: ContactHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleContactUpdate = (updatedContact: Contact) => {
    onContactUpdate(updatedContact);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start space-x-6">
          {/* 頭像區域 */}
          <ContactAvatar contact={contact} onContactUpdate={onContactUpdate} />

          {/* 基本資料區域 */}
          <div className="flex-1">
            {isEditing ? (
              <ContactInfoEditor
                contact={contact}
                onContactUpdate={handleContactUpdate}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <ContactInfoDisplay
                contact={contact}
                onEdit={() => setIsEditing(true)}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
