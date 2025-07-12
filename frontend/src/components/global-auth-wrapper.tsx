"use client";

import { useAuth } from "@/lib/api/hooks/use-auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

interface GlobalAuthWrapperProps {
  children: React.ReactNode;
}

export function GlobalAuthWrapper({ children }: GlobalAuthWrapperProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // 定義不需要認證的路由
  const publicRoutes = ['/login', '/register'];
  
  // 檢查當前路由是否為公開路由
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    // 如果正在載入，不做任何處理
    if (isLoading) return;

    // 如果是公開路由，不需要認證檢查
    if (isPublicRoute) return;

    // 如果不是公開路由且未認證，跳轉到登入頁
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, pathname, isPublicRoute, router]);

  // 如果正在載入，顯示載入狀態
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">正在載入...</p>
        </div>
      </div>
    );
  }

  // 如果是需要認證的路由但未認證，顯示跳轉提示
  if (!isPublicRoute && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-pulse text-muted-foreground">
            正在跳轉到登入頁面...
          </div>
        </div>
      </div>
    );
  }

  // 正常渲染子組件
  return <>{children}</>;
}
