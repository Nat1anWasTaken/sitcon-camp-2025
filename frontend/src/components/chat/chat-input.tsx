"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  cleanupImageUrls,
  extractImagesFromClipboard,
  extractImagesFromDrop,
  processImageFiles,
} from "@/lib/image-utils";
import { ImageFile } from "@/lib/types/api";
import { Paperclip, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePreview } from "./image-preview";

interface ChatInputProps {
  inputMessage: string;
  isStreaming: boolean;
  hasMessages: boolean;
  attachedImages: ImageFile[];
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onClearHistory: () => void;
  onImagesChange: (images: ImageFile[]) => void;
}

export function ChatInput({
  inputMessage,
  isStreaming,
  hasMessages,
  attachedImages,
  onInputChange,
  onSendMessage,
  onClearHistory,
  onImagesChange,
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const dragCounterRef = useRef(0);

  // 處理圖片文件
  const handleFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      // 檢查文件數量限制
      const totalImages = attachedImages.length + files.length;
      const maxImages = 10; // 設置最大圖片數量限制

      if (totalImages > maxImages) {
        toast.error(
          `最多只能上傳 ${maxImages} 張圖片。目前已有 ${attachedImages.length} 張，嘗試添加 ${files.length} 張。`
        );
        return;
      }

      setIsProcessingImages(true);
      try {
        const imageFiles = await processImageFiles(files);
        onImagesChange([...attachedImages, ...imageFiles]);

        const successMessage =
          imageFiles.length === 1
            ? `成功添加 1 張圖片`
            : `成功添加 ${imageFiles.length} 張圖片`;
        toast.success(successMessage);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "圖片處理失敗";
        toast.error(errorMessage);
      } finally {
        setIsProcessingImages(false);
      }
    },
    [attachedImages, onImagesChange]
  );

  // 處理文件選擇
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      handleFiles(files);
      // 清空 input 以允許重複選擇同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFiles]
  );

  // 處理拖放進入
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current++;

    // 檢查是否包含文件
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true);
    }
  }, []);

  // 處理拖放離開
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current--;

    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  // 處理拖放懸停
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // 處理拖放
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      dragCounterRef.current = 0;

      const imageFiles = extractImagesFromDrop(e);
      if (imageFiles.length === 0) {
        toast.error("沒有找到有效的圖片文件");
        return;
      }

      handleFiles(imageFiles);
    },
    [handleFiles]
  );

  // 處理貼上
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const imageFiles = extractImagesFromClipboard(e);
      if (imageFiles.length > 0) {
        e.preventDefault();
        handleFiles(imageFiles);
      }
    },
    [handleFiles]
  );

  // 移除圖片
  const handleRemoveImage = useCallback(
    (imageId: string) => {
      const imageToRemove = attachedImages.find((img) => img.id === imageId);
      if (imageToRemove) {
        cleanupImageUrls([imageToRemove]);
        onImagesChange(attachedImages.filter((img) => img.id !== imageId));
        toast.success("已移除圖片");
      }
    },
    [attachedImages, onImagesChange]
  );

  // 處理鍵盤事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  // 處理輸入框高度自動調整
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
  };

  // 檢查是否可以發送訊息
  const canSendMessage = inputMessage.trim() || attachedImages.length > 0;

  // 自動聚焦輸入框
  useEffect(() => {
    if (!isStreaming && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isStreaming]);

  return (
    <div className="border-t">
      {/* 圖片預覽區域 */}
      <ImagePreview images={attachedImages} onRemoveImage={handleRemoveImage} />

      {/* 輸入區域 */}
      <div
        className={`relative p-4 ${
          isDragOver ? "bg-primary/10" : ""
        } transition-colors`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
      >
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg z-10 pointer-events-none">
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-primary mb-2" />
              <p className="text-sm font-medium text-primary">拖放圖片到這裡</p>
              <p className="text-xs text-primary/70">
                支援 JPG、PNG、WebP、HEIC、HEIF 格式
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              onPaste={handlePaste}
              placeholder={
                attachedImages.length > 0
                  ? "添加描述文字（可選）..."
                  : "輸入訊息或貼上圖片..."
              }
              className="w-full p-3 pr-24 resize-none min-h-[50px] max-h-32"
              disabled={isStreaming || isProcessingImages}
              rows={1}
              style={{
                height: "auto",
                minHeight: "50px",
              }}
            />

            {/* 圖片上傳按鈕 */}
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-10 top-2 h-8 w-8 p-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming || isProcessingImages}
              title="選擇圖片"
            >
              <Paperclip className="size-4" />
            </Button>

            {/* 發送按鈕 */}
            <Button
              size="sm"
              className="absolute right-2 top-2 h-8 w-8 p-0"
              onClick={onSendMessage}
              disabled={!canSendMessage || isStreaming || isProcessingImages}
              title={canSendMessage ? "發送訊息" : "請輸入訊息或選擇圖片"}
            >
              <svg
                className="size-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </Button>
          </div>
        </div>

        {/* 隱藏的文件輸入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {hasMessages && (
          <div className="flex justify-between items-center mt-2">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>按 Enter 發送，Shift + Enter 換行</p>
              {attachedImages.length === 0 && (
                <p>支援拖放、貼上或點擊按鈕添加圖片</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearHistory}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              清除歷史
            </Button>
          </div>
        )}

        {isProcessingImages && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            正在處理圖片...
          </div>
        )}
      </div>
    </div>
  );
}
