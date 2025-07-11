"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  PasswordUpdateRequest,
  PreferencesUpdateRequest,
  ApiResponse,
  MessageResponse,
  UserResponse,
} from "@/lib/types/api";
import { AuthApi } from "../auth";

export const useChangePassword = () => {
  return useMutation<ApiResponse<MessageResponse>, Error, PasswordUpdateRequest>({
    mutationFn: async (data: PasswordUpdateRequest) => {
      const res = await AuthApi.changePassword(data);
      if (res.error) throw new Error(res.error);
      return res;
    },
    onSuccess: () => {
      toast.success("密碼已更新");
    },
    onError: (error: Error) => {
      toast.error(error.message || "更新密碼失敗");
    },
  });
};

export const useUpdatePreferences = () => {
  const queryClient = useQueryClient();
  return useMutation<ApiResponse<UserResponse>, Error, PreferencesUpdateRequest>({
    mutationFn: async (data: PreferencesUpdateRequest) => {
      const res = await AuthApi.updatePreferences(data);
      if (res.error) throw new Error(res.error);
      return res;
    },
    onSuccess: (response: ApiResponse<UserResponse>) => {
      toast.success("偏好設定已更新");
      queryClient.setQueryData(["user", "me"], response.data);
    },
    onError: (error: Error) => {
      toast.error(error.message || "更新偏好失敗");
    },
  });
};

export const useDeleteAccount = () => {
  return useMutation<ApiResponse<MessageResponse>, Error>({
    mutationFn: async () => {
      const res = await AuthApi.deleteAccount();
      if (res.error) throw new Error(res.error);
      return res;
    },
  });
};