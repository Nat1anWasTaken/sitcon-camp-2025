"use client";

import { MotionWrapper, PageTransition } from "@/components/motion-wrapper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, useLogin } from "@/lib/api/hooks/use-auth";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { isAuthenticated, isLoading } = useAuth();
  const loginMutation = useLogin();
  const router = useRouter();

  // 如果已經登入，重定向到首頁
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 使用 React Query mutation 執行登入
    loginMutation.mutate({
      username: email, // API 使用 username 欄位
      password: password,
      grant_type: "password",
    });
  };

  // 如果正在載入或已經登入，顯示載入狀態
  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen min-w-md flex items-center justify-center">
        <MotionWrapper
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            className="rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.p
            className="text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {isAuthenticated ? "正在跳轉..." : "正在載入..."}
          </motion.p>
        </MotionWrapper>
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen flex min-w-md items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-md"
      >
        <Card className="w-full max-w-lg">
          <CardHeader className="space-y-1">
            <motion.div
              className="flex items-center justify-center mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <motion.div
                className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", damping: 25, stiffness: 400 }}
              >
                <span className="text-lg font-bold">S</span>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <CardTitle className="text-2xl text-center">歡迎回來</CardTitle>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <CardDescription className="text-center">
                登入您的 SITCON Camp 2025 帳戶
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-4">
            <motion.form
              onSubmit={handleSubmit}
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
              >
                <Label htmlFor="email">電子郵件</Label>
                <motion.div
                  whileFocus={{ scale: 1.02 }}
                  transition={{ type: "spring", damping: 25, stiffness: 400 }}
                >
                  <Input
                    id="email"
                    type="email"
                    placeholder="請輸入您的電子郵件"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </motion.div>
              </motion.div>

              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7, duration: 0.3 }}
              >
                <Label htmlFor="password">密碼</Label>
                <motion.div
                  className="relative"
                  whileFocus={{ scale: 1.02 }}
                  transition={{ type: "spring", damping: 25, stiffness: 400 }}
                >
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="請輸入您的密碼"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent rounded-md transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <AnimatePresence mode="wait">
                      {showPassword ? (
                        <motion.div
                          key="eyeoff"
                          initial={{ opacity: 0, rotate: -90 }}
                          animate={{ opacity: 1, rotate: 0 }}
                          exit={{ opacity: 0, rotate: 90 }}
                          transition={{ duration: 0.2 }}
                        >
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="eye"
                          initial={{ opacity: 0, rotate: -90 }}
                          animate={{ opacity: 1, rotate: 0 }}
                          exit={{ opacity: 0, rotate: 90 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              </motion.div>

              <motion.div
                className="flex items-center justify-between"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.3 }}
              >
                <motion.div
                  className="flex items-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", damping: 25, stiffness: 400 }}
                >
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked === true)
                    }
                  />
                  <Label htmlFor="remember" className="text-sm cursor-pointer">
                    記住我
                  </Label>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", damping: 25, stiffness: 400 }}
                >
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    忘記密碼？
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.3 }}
              >
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "登入中..." : "登入"}
                </Button>
              </motion.div>
            </motion.form>

            <motion.div
              className="text-center text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.3 }}
            >
              還沒有帳戶？{" "}
              <motion.span
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", damping: 25, stiffness: 400 }}
                className="inline-block"
              >
                <Link href="/register" className="text-primary hover:underline">
                  立即註冊
                </Link>
              </motion.span>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </PageTransition>
  );
}
