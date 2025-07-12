"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Contact } from "@/lib/types/api";
import { useState } from "react";
import { ContactAvatar } from "./contact-avatar";
import { ContactInfoDisplay } from "./contact-info-display";
import { ContactInfoEditor } from "./contact-info-editor";
import { useDeleteContact } from "@/lib/api/hooks/use-contact";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ContactHeaderProps {
  contact: Contact;
}

export function ContactHeader({ contact, onContactDeleted }: ContactHeaderProps & { onContactDeleted?: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const deleteContactMutation = useDeleteContact();

  const handleContactUpdate = () => {
    setIsEditing(false);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start space-x-6">
          {/* 頭像區域 */}
          <ContactAvatar contact={contact} />

          {/* 基本資料區域 */}
          <div className="flex-1">
            {isEditing ? (
              <ContactInfoEditor
                contact={contact}
                onContactUpdate={() => handleContactUpdate()}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <>
                <ContactInfoDisplay
                  contact={contact}
                  onEdit={() => setIsEditing(true)}
                />
                {/* 編輯按鈕下方的刪除按鈕 */}
                <div className="mt-2 flex justify-end">
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={deleteContactMutation?.isPending}
                      >
                        {deleteContactMutation?.isPending ? "刪除中..." : "刪除"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>確定要刪除此聯絡人嗎？</DialogTitle>
                      </DialogHeader>
                      <div>此操作無法復原。</div>
                      <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                          取消
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteContactMutation?.isPending}
                          onClick={async () => {
                            try {
                              await deleteContactMutation.mutateAsync(contact.id);
                              toast.success("聯絡人已刪除。");
                              setOpen(false);
                              if (onContactDeleted) onContactDeleted();
                            } catch (error) {
                              toast.error("刪除失敗，請稍後再試。");
                            }
                          }}
                        >
                          {deleteContactMutation?.isPending ? "刪除中..." : "確定刪除"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
