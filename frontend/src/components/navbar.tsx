"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useLogout } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";
import { LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const logout = useLogout();

  // 判斷是否在認證相關頁面（登入、註冊等）
  const isAuthPage =
    pathname?.startsWith("/login") || pathname?.startsWith("/register");

  const handleLogout = () => {
    logout.mutate();
  };

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="w-full px-3 sm:px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left side - App title and icon */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-sm font-bold">S</span>
              </div>
              <span className="hidden font-bold text-xl sm:block">
                SITCON Camp 2025
              </span>
              <span className="font-bold text-xl sm:hidden">SITCON</span>
            </Link>
          </div>

          {/* Right side - Authentication buttons or User avatar */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              // 載入中狀態
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            ) : isAuthenticated ? (
              // 已登入用戶的頭像下拉選單
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative h-8 w-8 rounded-full ring-2 ring-transparent transition-all hover:ring-2 hover:ring-primary/20">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src="/placeholder-avatar.jpg"
                        alt="用戶頭像"
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center w-full">
                      <User className="mr-2 h-4 w-4" />
                      <span>個人資料</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center w-full">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>設定</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={handleLogout}
                    disabled={logout.isPending}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{logout.isPending ? "登出中..." : "登出"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : !isAuthPage ? (
              // 未登入用戶的登入/註冊按鈕（不在認證頁面時顯示）
              <div className="flex items-center space-x-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">登入</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">註冊</Link>
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
