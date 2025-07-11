"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type {
  ContactCreate,
  ContactQueryParams,
  ContactUpdate,
} from "../../types/api";
import { ContactApi } from "../contact";

// 查詢鍵工廠
export const contactQueryKeys = {
  all: ["contacts"] as const,
  lists: () => [...contactQueryKeys.all, "list"] as const,
  list: (params?: ContactQueryParams) =>
    [...contactQueryKeys.lists(), params] as const,
  details: () => [...contactQueryKeys.all, "detail"] as const,
  detail: (id: number) => [...contactQueryKeys.details(), id] as const,
  avatars: () => [...contactQueryKeys.all, "avatar"] as const,
  avatar: (id: number) => [...contactQueryKeys.avatars(), id] as const,
};

/**
 * 獲取聯絡人列表的 hook
 */
export function useContacts(params?: ContactQueryParams) {
  return useQuery({
    queryKey: contactQueryKeys.list(params),
    queryFn: () => ContactApi.getContacts(params),
    staleTime: 1000 * 60 * 5, // 5 分鐘內不重新請求
  });
}

/**
 * 獲取單個聯絡人詳情的 hook
 */
export function useContact(contactId: number) {
  return useQuery({
    queryKey: contactQueryKeys.detail(contactId),
    queryFn: () => ContactApi.getContact(contactId),
    enabled: !!contactId,
    staleTime: 1000 * 60 * 5, // 5 分鐘內不重新請求
  });
}

/**
 * 創建聯絡人的 mutation hook
 */
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ContactApi.createContact,
    onSuccess: () => {
      // 使聯絡人列表查詢失效，觸發重新請求
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.lists() });
    },
  });
}

/**
 * 創建聯絡人並上傳頭像的 mutation hook
 */
export function useCreateContactWithAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contactData,
      avatarFile,
    }: {
      contactData: ContactCreate;
      avatarFile?: File;
    }) => ContactApi.createContactWithAvatar(contactData, avatarFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.lists() });
    },
  });
}

/**
 * 更新聯絡人的 mutation hook
 */
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contactId,
      contactData,
    }: {
      contactId: number;
      contactData: ContactUpdate;
    }) => ContactApi.updateContact(contactId, contactData),
    onSuccess: (data, variables) => {
      // 更新快取中的聯絡人資料
      queryClient.setQueryData(contactQueryKeys.detail(variables.contactId), {
        data,
      });
      // 使列表查詢失效
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.lists() });
    },
  });
}

/**
 * 刪除聯絡人的 mutation hook
 */
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ContactApi.deleteContact,
    onSuccess: (_, contactId) => {
      // 從快取中移除該聯絡人
      queryClient.removeQueries({
        queryKey: contactQueryKeys.detail(contactId),
      });
      // 使列表查詢失效
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.lists() });
    },
  });
}

/**
 * 上傳頭像的 mutation hook
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contactId,
      avatarFile,
    }: {
      contactId: number;
      avatarFile: File;
    }) => ContactApi.uploadAvatar(contactId, avatarFile),
    onSuccess: (_, { contactId }) => {
      // 使該聯絡人的查詢失效
      queryClient.invalidateQueries({
        queryKey: contactQueryKeys.detail(contactId),
      });
      // 使列表查詢失效
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.lists() });
    },
  });
}

/**
 * 刪除頭像的 mutation hook
 */
export function useDeleteAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ContactApi.deleteAvatar,
    onSuccess: (_, contactId) => {
      // 使該聯絡人的查詢失效
      queryClient.invalidateQueries({
        queryKey: contactQueryKeys.detail(contactId),
      });
      // 使列表查詢失效
      queryClient.invalidateQueries({ queryKey: contactQueryKeys.lists() });
    },
  });
}

/**
 * 獲取頭像圖片的 hook
 */
export function useAvatarImage(contactId: number) {
  return useQuery({
    queryKey: contactQueryKeys.avatar(contactId),
    queryFn: () => ContactApi.getAvatarImage(contactId),
    enabled: !!contactId,
    staleTime: 1000 * 60 * 10, // 10 分鐘內不重新請求
    retry: (failureCount, error: any) => {
      // 如果是 404 (沒有頭像)，不重試
      if (error?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * 驗證頭像文件的 hook
 */
export function useValidateAvatarFile() {
  return {
    validateFile: ContactApi.validateAvatarFile,
    formatFileSize: ContactApi.formatFileSize,
    supportedTypes: ContactApi.validateAvatarFile,
  };
}

/**
 * 聯絡人搜索的 hook（帶防抖）
 */
export function useContactSearch(searchTerm: string, debounceMs = 300) {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  return useContacts({
    search: debouncedSearchTerm || undefined,
    limit: 20,
  });
}
