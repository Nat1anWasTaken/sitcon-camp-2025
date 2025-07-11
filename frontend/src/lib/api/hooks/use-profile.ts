"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  PasswordUpdateRequest,
  PreferencesUpdateRequest,
} from "@/lib/types/api";
import { AuthApi } from "../auth";

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (data: PasswordUpdateRequest) => AuthApi.changePassword(data),
    onSuccess: () => {
      toast.success("密碼已更新");
    },
    onError: (error: any) => {
      toast.error(error.message || "更新密碼失敗");
    },
  });
};

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PreferencesUpdateRequest) => AuthApi.updatePreferences(data),
    onSuccess: (response: any) => {
      toast.success("偏好設定已更新");
      // 更新 user cache if needed
      queryClient.setQueryData(["user", "me"], response.data);
    },
    onError: (error: any) => {
      toast.error(error.message || "更新偏好失敗");
    },
  });
};

export const useDeleteAccount = () => {
  return useMutation({
    mutationFn: () => AuthApi.deleteAccount(),
  });
};