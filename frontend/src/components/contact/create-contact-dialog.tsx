"use client";

import { SelectableItem } from "@/components/motion-wrapper";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateContact } from "@/lib/api/hooks/use-contact";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CreateContactDialogProps {
  children?: React.ReactNode;
  className?: string;
}

export function CreateContactDialog({
  children,
  className,
}: CreateContactDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createContactMutation = useCreateContact();

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // 關閉對話框時重置表單
      setName("");
      setDescription("");
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("請輸入聯絡人姓名");
      return;
    }

    try {
      await createContactMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      // 重置表單並關閉對話框
      setName("");
      setDescription("");
      setIsOpen(false);
      toast.success("聯絡人創建成功");
    } catch (error) {
      console.error("創建聯絡人失敗:", error);
      toast.error("創建聯絡人失敗，請稍後再試");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <SelectableItem
            isSelected={false}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              "text-sidebar-foreground",
              className
            )}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
            >
              <Avatar className="size-10">
                <AvatarFallback className="text-sm font-medium bg-sidebar-accent/50">
                  <motion.div
                    whileHover={{ rotate: 90 }}
                    transition={{ type: "spring", damping: 25, stiffness: 400 }}
                  >
                    <Plus className="size-4" />
                  </motion.div>
                </AvatarFallback>
              </Avatar>
            </motion.div>

            <div className="flex-1 min-w-0">
              <motion.h3
                className="font-medium text-sm"
                transition={{ type: "spring", damping: 25, stiffness: 400 }}
              >
                新增聯絡人
              </motion.h3>
              <motion.p
                className="text-xs text-sidebar-foreground/60 mt-0.5"
                transition={{
                  type: "spring",
                  damping: 25,
                  stiffness: 400,
                  delay: 0.05,
                }}
              >
                創建新的聊天聯絡人
              </motion.p>
            </div>
          </SelectableItem>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新增聯絡人</DialogTitle>
          <DialogDescription>
            建立新的聊天聯絡人。您稍後可以編輯其他詳細資訊。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="contact-name">姓名 *</Label>
            <Input
              id="contact-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="輸入聯絡人姓名"
              disabled={createContactMutation.isPending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact-description">描述</Label>
            <Textarea
              id="contact-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="輸入聯絡人描述（可選）"
              rows={3}
              disabled={createContactMutation.isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={createContactMutation.isPending}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createContactMutation.isPending || !name.trim()}
          >
            {createContactMutation.isPending ? "創建中..." : "創建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
