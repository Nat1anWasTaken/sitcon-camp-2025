"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDeleteContact } from "@/lib/api/hooks/use-contact";
import { Contact } from "@/lib/types/api";
import { useState } from "react";
import { toast } from "sonner";
import { ContactAvatar } from "./contact-avatar";
import { ContactInfoDisplay } from "./contact-info-display";
import { ContactInfoEditor } from "./contact-info-editor";

interface ContactHeaderProps {
  contact: Contact;
}

export function ContactHeader({
  contact,
  onContactDeleted,
}: ContactHeaderProps & { onContactDeleted?: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const deleteContactMutation = useDeleteContact();

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
                        {deleteContactMutation?.isPending
                          ? "刪除中..."
                          : "刪除"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>確定要刪除此聯絡人嗎？</DialogTitle>
                      </DialogHeader>
                      <div>此操作無法復原。</div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setOpen(false)}
                        >
                          取消
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteContactMutation?.isPending}
                          onClick={async () => {
                            try {
                              await deleteContactMutation.mutateAsync(
                                contact.id
                              );
                              toast.success("聯絡人已刪除。");
                              setOpen(false);
                              if (onContactDeleted) onContactDeleted();
                            } catch (error) {
                              toast.error("刪除失敗，請稍後再試。");
                              console.error(error);
                            }
                          }}
                        >
                          {deleteContactMutation?.isPending
                            ? "刪除中..."
                            : "確定刪除"}
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
