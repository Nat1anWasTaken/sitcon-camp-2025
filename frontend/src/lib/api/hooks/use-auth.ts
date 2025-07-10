import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoginCredentials, UserCreate } from "../../types/api";
import { AuthApi } from "../auth";

/**
 * 登入 mutation hook
 */
export const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await AuthApi.login(credentials);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: (data) => {
      // 設定 token
      AuthApi.setToken(data.access_token);

      // 清除查詢緩存
      queryClient.invalidateQueries({ queryKey: ["user"] });

      // 顯示成功訊息
      toast.success("登入成功！歡迎回來");

      // 重定向到首頁
      router.push("/");
    },
    onError: (error) => {
      console.error("登入失敗:", error);
      toast.error(error.message || "登入失敗，請檢查您的帳號密碼");
    },
  });
};

/**
 * 註冊 mutation hook
 */
export const useRegister = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (userData: UserCreate) => {
      const response = await AuthApi.register(userData);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data!;
    },
    onSuccess: () => {
      // 顯示成功訊息
      toast.success("註冊成功！請登入您的帳戶");

      // 註冊成功後重定向到登入頁面
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    },
    onError: (error) => {
      console.error("註冊失敗:", error);
      toast.error(error.message || "註冊失敗，請稍後再試");
    },
  });
};

/**
 * 登出 mutation hook
 */
export const useLogout = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      AuthApi.logout();
    },
    onSuccess: () => {
      // 清除查詢緩存
      queryClient.clear();

      // 顯示成功訊息
      toast.success("已成功登出");

      // 重定向到登入頁面
      router.push("/login");
    },
  });
};
