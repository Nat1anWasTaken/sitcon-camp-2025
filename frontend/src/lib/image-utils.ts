import React from "react";
import {
  ImageFile,
  SUPPORTED_IMAGE_TYPES,
  SupportedImageType,
} from "./types/api";

// 最大文件大小 (20MB)
const MAX_FILE_SIZE = 20 * 1024 * 1024;

/**
 * 生成唯一 ID
 */
export function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 檢查文件是否為支援的圖片格式
 */
export function isSupportedImageType(
  file: File
): file is File & { type: SupportedImageType } {
  return SUPPORTED_IMAGE_TYPES.includes(file.type as SupportedImageType);
}

/**
 * 檢查文件大小是否在限制範圍內
 */
export function isValidFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * 將文件轉換為 Base64 編碼
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = () => reject(new Error("文件讀取失敗"));
    reader.readAsDataURL(file);
  });
}

/**
 * 從 Base64 數據 URL 中提取純 Base64 字符串
 */
export function extractBase64FromDataUrl(dataUrl: string): string {
  const base64Index = dataUrl.indexOf(",");
  return base64Index !== -1 ? dataUrl.substring(base64Index + 1) : dataUrl;
}

/**
 * 驗證並處理圖片文件
 */
export async function processImageFile(file: File): Promise<ImageFile> {
  // 檢查文件類型
  if (!isSupportedImageType(file)) {
    throw new Error(
      `不支援的圖片格式: ${file.type}。支援的格式: ${SUPPORTED_IMAGE_TYPES.join(
        ", "
      )}`
    );
  }

  // 檢查文件大小
  if (!isValidFileSize(file)) {
    throw new Error(
      `文件大小超過限制。最大允許大小: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    );
  }

  // 轉換為 Base64
  const dataUrl = await fileToBase64(file);
  const base64 = extractBase64FromDataUrl(dataUrl);

  // 創建預覽 URL
  const url = URL.createObjectURL(file);

  return {
    id: generateImageId(),
    file,
    url,
    base64,
    mimeType: file.type as SupportedImageType,
    size: file.size,
  };
}

/**
 * 批量處理多個圖片文件
 */
export async function processImageFiles(files: File[]): Promise<ImageFile[]> {
  const processPromises = files.map((file) => processImageFile(file));
  return Promise.all(processPromises);
}

/**
 * 清理預覽 URL 以釋放記憶體
 */
export function cleanupImageUrl(imageFile: ImageFile): void {
  if (imageFile.url) {
    URL.revokeObjectURL(imageFile.url);
  }
}

/**
 * 清理多個預覽 URL
 */
export function cleanupImageUrls(imageFiles: ImageFile[]): void {
  imageFiles.forEach(cleanupImageUrl);
}

/**
 * 從剪貼板事件中提取圖片文件
 */
export function extractImagesFromClipboard(
  event: React.ClipboardEvent | ClipboardEvent
): File[] {
  const items = event.clipboardData?.items;
  if (!items) return [];

  const imageFiles: File[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) {
        imageFiles.push(file);
      }
    }
  }

  return imageFiles;
}

/**
 * 從拖放事件中提取圖片文件
 */
export function extractImagesFromDrop(
  event: React.DragEvent | DragEvent
): File[] {
  const files = event.dataTransfer?.files;
  if (!files) return [];

  const imageFiles: File[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.type.startsWith("image/")) {
      imageFiles.push(file);
    }
  }

  return imageFiles;
}

/**
 * 格式化文件大小顯示
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
