"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatFileSize } from "@/lib/image-utils";
import { ImageFile } from "@/lib/types/api";
import { X } from "lucide-react";

interface ImagePreviewProps {
  images: ImageFile[];
  onRemoveImage: (imageId: string) => void;
}

export function ImagePreview({ images, onRemoveImage }: ImagePreviewProps) {
  if (images.length === 0) return null;

  return (
    <div className="border-t p-4 bg-muted/50">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground">
            已選擇的圖片 ({images.length})
          </h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {images.map((image) => (
            <Card key={image.id} className="relative group overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={image.url}
                  alt={image.file.name}
                  className="w-full h-full object-cover"
                />

                {/* 移除按鈕 */}
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onRemoveImage(image.id)}
                >
                  <X className="h-3 w-3" />
                </Button>

                {/* 文件信息覆蓋層 */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="truncate font-medium">{image.file.name}</p>
                  <p className="text-gray-300">{formatFileSize(image.size)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* 圖片總數和大小信息 */}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>總計: {images.length} 個圖片</span>
          <span>
            總大小:{" "}
            {formatFileSize(images.reduce((total, img) => total + img.size, 0))}
          </span>
        </div>
      </div>
    </div>
  );
}
