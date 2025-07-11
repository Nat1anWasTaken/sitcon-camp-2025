import { useQueries, useQuery } from "@tanstack/react-query";
import { ContactApi } from "../contact";

/**
 * 使用 React Query 獲取聯絡人頭像
 */
export function useContactAvatar(contactId: number, hasAvatarKey: boolean) {
  const result = useQuery({
    queryKey: ["contact-avatar", contactId],
    queryFn: () => ContactApi.getAvatarImage(contactId),
    enabled: hasAvatarKey, // 只有當聯絡人有 avatar_key 時才執行查詢
    staleTime: 5 * 60 * 1000, // 5 分鐘
    gcTime: 10 * 60 * 1000, // 10 分鐘（之前叫 cacheTime）
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // 當 hasAvatarKey 為 false 時，確保返回 undefined 而不是緩存的數據
  if (!hasAvatarKey) {
    return {
      ...result,
      data: undefined,
    };
  }

  return result;
}

/**
 * 使用 React Query 獲取頭像 Blob 數據
 */
export function useContactAvatarBlob(contactId: number, hasAvatarKey: boolean) {
  return useQuery({
    queryKey: ["contact-avatar-blob", contactId],
    queryFn: () => ContactApi.getAvatarBlob(contactId),
    enabled: hasAvatarKey,
    staleTime: 5 * 60 * 1000, // 5 分鐘
    gcTime: 10 * 60 * 1000, // 10 分鐘
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * 批量預載入多個聯絡人的頭像
 * 適用於聯絡人列表場景
 */
export function useContactAvatars(
  contacts: Array<{ id: number; avatar_key?: string | null }>
) {
  return useQueries({
    queries: contacts
      .filter((contact) => contact.avatar_key) // 只為有頭像的聯絡人創建查詢
      .map((contact) => ({
        queryKey: ["contact-avatar", contact.id],
        queryFn: () => ContactApi.getAvatarImage(contact.id),
        staleTime: 5 * 60 * 1000, // 5 分鐘
        gcTime: 10 * 60 * 1000, // 10 分鐘
        retry: 1, // 列表場景下減少重試次數以提高性能
        retryDelay: 1000,
      })),
  });
}

/**
 * 簡化的頭像 hook，用於列表場景
 * 不會立即載入，需要手動觸發
 */
export function useContactAvatarLazy(contactId: number) {
  return useQuery({
    queryKey: ["contact-avatar", contactId],
    queryFn: () => ContactApi.getAvatarImage(contactId),
    enabled: false, // 默認不自動執行
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
}
