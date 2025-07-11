"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ContactApi } from "@/lib/api/contact";
import { useDeleteAvatar, useUploadAvatar } from "@/lib/api/hooks/use-contact";
import { Contact } from "@/lib/types/api";
import { Camera, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AvatarUploadDialogProps {
  contact: Contact;
  onContactUpdate: (contact: Contact) => void;
  trigger?: React.ReactNode;
}

export function AvatarUploadDialog({
  contact,
  onContactUpdate,
  trigger,
}: AvatarUploadDialogProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // 使用 React Query mutation hooks
  const uploadAvatarMutation = useUploadAvatar();
  const deleteAvatarMutation = useDeleteAvatar();

  const isUploading = uploadAvatarMutation.isPending;
  const isDeleting = deleteAvatarMutation.isPending;

  // 處理頭像上傳
  const handleAvatarUpload = async (file: File) => {
    // 驗證文件
    const validation = ContactApi.validateAvatarFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setUploadProgress(0);

    // 模擬上傳進度
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await uploadAvatarMutation.mutateAsync({
        contactId: contact.id,
        avatarFile: file,
      });

      setUploadProgress(100);
      toast.success("頭像上傳成功");
      setIsOpen(false);

      // Cache invalidation and contact update are handled by the mutation hook
    } catch (error) {
      // Error handling is already managed by the mutation hook
      console.error("頭像上傳失敗:", error);
    } finally {
      clearInterval(progressInterval);
      setUploadProgress(0);
    }
  };

  // 處理頭像刪除
  const handleAvatarDelete = async () => {
    try {
      await deleteAvatarMutation.mutateAsync(contact.id);

      toast.success("頭像已刪除");
      setIsOpen(false);

      // Cache invalidation and contact update are handled by the mutation hook
    } catch (error) {
      // Error handling is already managed by the mutation hook
      console.error("刪除頭像失敗:", error);
    }
  };

  const defaultTrigger = (
    <Button
      size="sm"
      variant="outline"
      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
    >
      <Camera className="h-4 w-4" />
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>更新頭像</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="avatar-upload">選擇頭像圖片</Label>
            <Input
              id="avatar-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleAvatarUpload(file);
                }
              }}
              disabled={isUploading || isDeleting}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              支援 JPEG、PNG、GIF、WebP 格式，最大 5MB
            </p>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span className="text-sm">上傳中...</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {contact.avatar_key ? (
            <Button
              variant="outline"
              onClick={handleAvatarDelete}
              disabled={isUploading || isDeleting}
              className="w-full"
            >
              {isDeleting ? "刪除中..." : "刪除目前頭像"}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
