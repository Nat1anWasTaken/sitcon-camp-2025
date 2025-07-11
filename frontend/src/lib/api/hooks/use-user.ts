"use client";

import { useQuery } from "@tanstack/react-query";
import { AuthApi } from "../auth";
import { ApiResponse, UserResponse } from "@/lib/types/api";

export const useCurrentUser = () => {
  return useQuery<ApiResponse<UserResponse>>({
    queryKey: ["user", "me"],
    queryFn: () => AuthApi.getCurrentUser(),
    staleTime: 1000 * 60, // 1 minute
    enabled: AuthApi.hasToken(),
  });
};