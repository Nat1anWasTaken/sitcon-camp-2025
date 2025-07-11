"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateRecord, useUpdateRecord } from "@/lib/api/hooks/use-records";
import { ContactRecord, RecordCategory } from "@/lib/types/api";
import { Calendar, FileText, Hash, Heart, Link, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ContactRecordFormProps {
  contactId: number;
  record?: ContactRecord; // 如果是編輯模式則提供現有記錄
  onSave: () => void;
  onCancel: () => void;
}

const CATEGORY_OPTIONS: {
  value: RecordCategory;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}[] = [
  { value: "Communications", label: "通訊方式", icon: Link },
  { value: "Nicknames", label: "暱稱", icon: Hash },
  { value: "Memories", label: "回憶", icon: Heart },
  { value: "Preferences", label: "偏好", icon: Settings },
  { value: "Plan", label: "計劃", icon: Calendar },
  { value: "Other", label: "其他", icon: FileText },
];

export function ContactRecordForm({
  contactId,
  record,
  onSave,
  onCancel,
}: ContactRecordFormProps) {
  const [formData, setFormData] = useState({
    category: record?.category || ("Communications" as RecordCategory),
    content: record?.content || "",
  });

  // 使用 React Query mutation hooks
  const createRecordMutation = useCreateRecord();
  const updateRecordMutation = useUpdateRecord();

  const isSubmitting =
    createRecordMutation.isPending || updateRecordMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.content.trim()) {
      toast.error("請輸入記錄內容");
      return;
    }

    try {
      if (record) {
        // 編輯模式 - 使用 update mutation
        await updateRecordMutation.mutateAsync({
          recordId: record.id,
          data: formData,
        });
      } else {
        // 新增模式 - 使用 create mutation
        await createRecordMutation.mutateAsync({
          ...formData,
          contact_id: contactId,
        });
      }
      onSave();
    } catch (error) {
      // Error handling is already managed by the mutation hooks
      console.error("保存記錄失敗:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="category">分類</Label>
        <Select
          value={formData.category}
          onValueChange={(value: RecordCategory) =>
            setFormData({ ...formData, category: value })
          }
        >
          <SelectTrigger className="mt-1 w-full">
            <SelectValue placeholder="選擇記錄分類" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4" />
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="content">內容</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          placeholder="輸入記錄內容..."
          rows={4}
          className="mt-1"
          required
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          取消
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !formData.content.trim()}
        >
          {isSubmitting ? "保存中..." : record ? "更新" : "新增"}
        </Button>
      </div>
    </form>
  );
}
