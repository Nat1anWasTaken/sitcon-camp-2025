"use client";

import { useAuth } from "@/lib/api/hooks/use-auth";
import { useRouter } from "next/navigation";
import React, { useEffect, type ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps): React.ReactElement {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 只有在載入完成且未認證時才跳轉
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // 如果正在載入，顯示載入狀態
  if (isLoading) {
    const loadingScreen = (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">正在載入...</p>
        </div>
      </div>
    );
    return (fallback ?? loadingScreen) as React.ReactElement;
  }

  // 如果未認證，顯示跳轉提示
  if (!isAuthenticated) {
    const redirecting = (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-muted-foreground">
            正在跳轉到登入頁面...
          </div>
        </div>
      </div>
    );
    return redirecting as React.ReactElement;
  }

  // 如果已認證，顯示子組件
  return <>{children}</> as React.ReactElement;
}
