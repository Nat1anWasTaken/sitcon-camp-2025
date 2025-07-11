"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ContactApi } from "@/lib/api/contact";
import { Contact } from "@/lib/types/api";
import { Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ContactInfoEditorProps {
  contact: Contact;
  onContactUpdate: (contact: Contact) => void;
  onCancel: () => void;
}

export function ContactInfoEditor({
  contact,
  onContactUpdate,
  onCancel,
}: ContactInfoEditorProps) {
  const [editForm, setEditForm] = useState({
    name: contact.name,
    description: contact.description || "",
  });

  const handleSave = async () => {
    try {
      const updatedContact = await ContactApi.updateContact(
        contact.id,
        editForm
      );
      if (updatedContact.data) {
        onContactUpdate(updatedContact.data);
        toast.success("聯絡人資料已更新");
      }
    } catch (error) {
      console.error("更新失敗:", error);
      toast.error("更新聯絡人資料失敗");
    }
  };

  const handleCancel = () => {
    setEditForm({
      name: contact.name,
      description: contact.description || "",
    });
    onCancel();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">姓名</Label>
        <Input
          id="name"
          value={editForm.name}
          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="description">描述</Label>
        <Textarea
          id="description"
          value={editForm.description}
          onChange={(e) =>
            setEditForm({ ...editForm, description: e.target.value })
          }
          placeholder="添加一些關於這個聯絡人的描述..."
          className="mt-1"
        />
      </div>
      <div className="flex space-x-2">
        <Button onClick={handleSave} size="sm">
          <Save className="h-4 w-4 mr-2" />
          儲存
        </Button>
        <Button variant="outline" onClick={handleCancel} size="sm">
          <X className="h-4 w-4 mr-2" />
          取消
        </Button>
      </div>
    </div>
  );
}
