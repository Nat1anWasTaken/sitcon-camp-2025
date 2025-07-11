"use client";

import { Toaster } from "@/components/ui/sonner";
import { AuthApi } from "@/lib/api/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // 在 Client Component 中創建 QueryClient
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 設定默認的查詢選項
            staleTime: 60 * 1000, // 1 分鐘
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // 確保認證狀態在應用程式啟動時正確初始化
  useEffect(() => {
    AuthApi.initAuth();
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors position="bottom-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
