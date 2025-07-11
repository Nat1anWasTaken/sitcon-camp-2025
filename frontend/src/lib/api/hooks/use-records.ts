"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  RecordCreate,
  RecordQueryParams,
  RecordUpdate,
} from "../../types/api";
import { RecordsApi } from "../records";

// 查詢鍵工廠
export const recordQueryKeys = {
  all: ["records"] as const,
  lists: () => [...recordQueryKeys.all, "list"] as const,
  list: (params?: RecordQueryParams) =>
    [...recordQueryKeys.lists(), params] as const,
  byContact: (
    contactId: number,
    params?: Omit<RecordQueryParams, "contact_id">
  ) => [...recordQueryKeys.all, "by-contact", contactId, params] as const,
  details: () => [...recordQueryKeys.all, "detail"] as const,
  detail: (id: number) => [...recordQueryKeys.details(), id] as const,
  categories: () => [...recordQueryKeys.all, "categories"] as const,
};

/**
 * 獲取記錄列表的 hook
 */
export function useRecords(params?: RecordQueryParams) {
  return useQuery({
    queryKey: recordQueryKeys.list(params),
    queryFn: () => RecordsApi.getRecords(params),
    staleTime: 1000 * 30, // 降低到 30 秒，確保更新後能快速反映
  });
}

/**
 * 根據聯絡人獲取記錄列表的 hook
 */
export function useRecordsByContact(
  contactId: number,
  params?: Omit<RecordQueryParams, "contact_id">
) {
  return useQuery({
    queryKey: recordQueryKeys.byContact(contactId, params),
    queryFn: () => RecordsApi.getRecordsByContact(contactId, params),
    enabled: !!contactId,
    staleTime: 1000 * 30, // 降低到 30 秒，確保更新後能快速反映
  });
}

/**
 * 獲取單個記錄詳情的 hook
 */
export function useRecord(recordId: number) {
  return useQuery({
    queryKey: recordQueryKeys.detail(recordId),
    queryFn: () => RecordsApi.getRecord(recordId),
    enabled: !!recordId,
    staleTime: 1000 * 30, // 降低到 30 秒，確保更新後能快速反映
  });
}

/**
 * 獲取記錄分類列表的 hook
 */
export function useRecordCategories() {
  return useQuery({
    queryKey: recordQueryKeys.categories(),
    queryFn: () => RecordsApi.getRecordCategories(),
    staleTime: 1000 * 60 * 30, // 30 分鐘內不重新請求（分類變化較少）
  });
}

/**
 * 創建記錄的 mutation hook
 */
export function useCreateRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recordData: RecordCreate) =>
      RecordsApi.createRecord(recordData),
    onSuccess: (response, variables) => {
      if (response.error) {
        toast.error(`創建記錄失敗: ${response.error}`);
        return;
      }

      // 使相關查詢失效
      queryClient.invalidateQueries({ queryKey: recordQueryKeys.all });
      queryClient.invalidateQueries({
        queryKey: recordQueryKeys.byContact(variables.contact_id),
      });

      toast.success("記錄創建成功！");
    },
    onError: (error) => {
      console.error("創建記錄失敗:", error);
      toast.error(error instanceof Error ? error.message : "創建記錄失敗");
    },
  });
}

/**
 * 更新記錄的 mutation hook
 */
export function useUpdateRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      recordId,
      data,
    }: {
      recordId: number;
      data: RecordUpdate;
    }) => RecordsApi.updateRecord(recordId, data),
    onSuccess: (response, variables) => {
      if (response.error) {
        toast.error(`更新記錄失敗: ${response.error}`);
        return;
      }

      // 1. 更新特定記錄的快取
      queryClient.setQueryData(
        recordQueryKeys.detail(variables.recordId),
        response
      );

      // 2. 立即觸發該記錄的查詢失效
      queryClient.invalidateQueries({
        queryKey: recordQueryKeys.detail(variables.recordId),
      });

      // 3. 使相關查詢失效
      queryClient.invalidateQueries({ queryKey: recordQueryKeys.lists() });
      if (response.data?.contact_id) {
        queryClient.invalidateQueries({
          queryKey: recordQueryKeys.byContact(response.data.contact_id),
        });
      }

      toast.success("記錄更新成功！");
    },
    onError: (error) => {
      console.error("更新記錄失敗:", error);
      toast.error(error instanceof Error ? error.message : "更新記錄失敗");
    },
  });
}

/**
 * 刪除記錄的 mutation hook
 */
export function useDeleteRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recordId: number) => RecordsApi.deleteRecord(recordId),
    onSuccess: (response, recordId) => {
      if (response.error) {
        toast.error(`刪除記錄失敗: ${response.error}`);
        return;
      }

      // 從快取中移除特定記錄
      queryClient.removeQueries({
        queryKey: recordQueryKeys.detail(recordId),
      });

      // 使相關查詢失效
      queryClient.invalidateQueries({ queryKey: recordQueryKeys.all });

      toast.success("記錄刪除成功！");
    },
    onError: (error) => {
      console.error("刪除記錄失敗:", error);
      toast.error(error instanceof Error ? error.message : "刪除記錄失敗");
    },
  });
}

/**
 * 批量操作記錄的 hooks
 */
export function useBatchDeleteRecords() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recordIds: number[]) => {
      const results = await Promise.allSettled(
        recordIds.map((id) => RecordsApi.deleteRecord(id))
      );

      const failed = results
        .map((result, index) => ({ result, id: recordIds[index] }))
        .filter(({ result }) => result.status === "rejected")
        .map(({ id }) => id);

      if (failed.length > 0) {
        throw new Error(`刪除記錄失敗，ID: ${failed.join(", ")}`);
      }

      return results;
    },
    onSuccess: () => {
      // 使所有記錄相關查詢失效
      queryClient.invalidateQueries({ queryKey: recordQueryKeys.all });
      toast.success("批量刪除記錄成功！");
    },
    onError: (error) => {
      console.error("批量刪除記錄失敗:", error);
      toast.error(error instanceof Error ? error.message : "批量刪除記錄失敗");
    },
  });
}
