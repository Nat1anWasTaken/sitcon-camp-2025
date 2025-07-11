"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Contact } from "@/lib/types/api";
import { useState } from "react";
import { ContactAvatar } from "./contact-avatar";
import { ContactInfoDisplay } from "./contact-info-display";
import { ContactInfoEditor } from "./contact-info-editor";

interface ContactHeaderProps {
  contact: Contact;
}

export function ContactHeader({ contact }: ContactHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleContactUpdate = () => {
    setIsEditing(false);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 md:space-x-6">
          {/* 頭像區域 */}
          <div className="flex justify-center sm:justify-start">
            <ContactAvatar contact={contact} size="md" />
          </div>

          {/* 基本資料區域 */}
          <div className="flex-1 min-w-0 max-w-full">
            {isEditing ? (
              <ContactInfoEditor
                contact={contact}
                onContactUpdate={() => handleContactUpdate()}
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
