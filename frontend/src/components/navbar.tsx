"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useLogout } from "@/lib/api/hooks";
import { useMobileNav } from "@/lib/contexts/mobile-nav-context";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, LogOut, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const logout = useLogout();
  const { showContent, setShowContent, activeContactName, isSiriActive } =
    useMobileNav();

  // 判斷是否在認證相關頁面（登入、註冊等）
  const isAuthPage =
    pathname?.startsWith("/login") || pathname?.startsWith("/register");

  // 判斷是否在首頁
  const isHomePage = pathname === "/";

  const handleLogout = () => {
    logout.mutate();
  };

  const handleBackClick = () => {
    setShowContent(false);
  };

  // 決定顯示的標題
  const getTitle = () => {
    if (showContent && isHomePage) {
      if (isSiriActive) {
        return "Siri AI 助手";
      }
      if (activeContactName) {
        return activeContactName;
      }
    }
    return "SITCON Camp 2025";
  };

  // 決定顯示的簡短標題（手機版）
  const getShortTitle = () => {
    if (showContent && isHomePage) {
      if (isSiriActive) {
        return "Siri";
      }
      if (activeContactName) {
        return activeContactName.length > 8
          ? activeContactName.substring(0, 8) + "..."
          : activeContactName;
      }
    }
    return "SITCON";
  };

  return (
    <motion.nav
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="w-full px-3 sm:px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left side - App title and icon with back button */}
          <div className="flex items-center space-x-3">
            {/* Mobile back button */}
            <AnimatePresence>
              {showContent && isHomePage && (
                <motion.div
                  initial={{ opacity: 0, x: -20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackClick}
                    className="md:hidden flex items-center justify-center p-2"
                  >
                    <motion.div
                      whileHover={{ x: -2 }}
                      transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 400,
                      }}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </motion.div>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
            >
              <Link href="/" className="flex items-center space-x-2">
                <motion.div
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
                  whileHover={{ rotate: 5 }}
                  transition={{ type: "spring", damping: 25, stiffness: 400 }}
                >
                  <span className="text-sm font-bold">S</span>
                </motion.div>
                <motion.span
                  className="hidden font-bold text-xl sm:block"
                  key={`title-${getTitle()}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {getTitle()}
                </motion.span>
                <motion.span
                  className="font-bold text-xl sm:hidden"
                  key={`short-title-${getShortTitle()}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {getShortTitle()}
                </motion.span>
              </Link>
            </motion.div>
          </div>

          {/* Right side - Authentication buttons or User avatar */}
          <div className="flex items-center space-x-4">
            <AnimatePresence mode="wait">
              {isLoading ? (
                // 載入中狀態
                <motion.div
                  className="h-8 w-8 rounded-full bg-muted"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className="h-full w-full rounded-full bg-muted"
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>
              ) : isAuthenticated ? (
                // 已登入用戶的頭像下拉選單
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <motion.button
                        className="relative h-8 w-8 rounded-full ring-2 ring-transparent transition-all hover:ring-2 hover:ring-primary/20"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{
                          type: "spring",
                          damping: 25,
                          stiffness: 400,
                        }}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src="/placeholder-avatar.jpg"
                            alt="用戶頭像"
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      </motion.button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={handleLogout}
                        disabled={logout.isPending}
                      >
                        <motion.div
                          className="flex items-center"
                          whileHover={{ x: 2 }}
                          transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 400,
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>{logout.isPending ? "登出中..." : "登出"}</span>
                        </motion.div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ) : !isAuthPage ? (
                // 未登入用戶的登入/註冊按鈕（不在認證頁面時顯示）
                <motion.div
                  className="flex items-center space-x-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", damping: 25, stiffness: 400 }}
                  >
                    <Button variant="ghost" asChild>
                      <Link href="/login">登入</Link>
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", damping: 25, stiffness: 400 }}
                  >
                    <Button asChild>
                      <Link href="/register">註冊</Link>
                    </Button>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
