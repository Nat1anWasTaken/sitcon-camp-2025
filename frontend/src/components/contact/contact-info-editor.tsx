"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateContact } from "@/lib/api/hooks/use-contact";
import { Contact } from "@/lib/types/api";
import { Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ContactInfoEditorProps {
  contact: Contact;
  onContactUpdate: () => void;
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

  // 使用 React Query mutation hook
  const updateContactMutation = useUpdateContact();

  const handleSave = async () => {
    if (!editForm.name.trim()) {
      toast.error("聯絡人姓名不能為空");
      return;
    }

    try {
      const result = await updateContactMutation.mutateAsync({
        contactId: contact.id,
        contactData: editForm,
      });

      // 通知父組件聯絡人已更新
      if (result.data) {
        onContactUpdate();
        toast.success("聯絡人資料已更新");
      } else {
        console.warn("更新成功但未返回數據:", result);
        toast.success("聯絡人資料已更新");
      }
    } catch (error) {
      // 錯誤處理由 mutation hook 處理，這裡添加額外的用戶提示
      console.error("更新失敗:", error);
      toast.error("更新失敗，請稍後再試");
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
        <Label htmlFor="name" className="text-sm font-medium">
          姓名
        </Label>
        <Input
          id="name"
          value={editForm.name}
          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          className="mt-1"
          disabled={updateContactMutation.isPending}
          placeholder="輸入聯絡人姓名"
        />
      </div>
      <div>
        <Label htmlFor="description" className="text-sm font-medium">
          描述
        </Label>
        <Textarea
          id="description"
          value={editForm.description}
          onChange={(e) =>
            setEditForm({ ...editForm, description: e.target.value })
          }
          placeholder="添加一些關於這個聯絡人的描述..."
          className="mt-1 min-h-[80px]"
          disabled={updateContactMutation.isPending}
        />
      </div>
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
        <Button
          onClick={handleSave}
          size="sm"
          disabled={updateContactMutation.isPending}
          className="w-full sm:w-auto"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateContactMutation.isPending ? "儲存中..." : "儲存"}
        </Button>
        <Button
          variant="outline"
          onClick={handleCancel}
          size="sm"
          disabled={updateContactMutation.isPending}
          className="w-full sm:w-auto"
        >
          <X className="h-4 w-4 mr-2" />
          取消
        </Button>
      </div>
    </div>
  );
}
