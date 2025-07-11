"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertTriangle, 
  Trash2, 
  Eye, 
  EyeOff,
  Shield,
  XCircle
} from "lucide-react";
import { httpClient } from "@/lib/api/http-client";
import { useRouter } from "next/navigation";

interface AccountDeletionData {
  password: string;
  confirmation: string;
}

export function AccountDeletion() {
  const [softDeleteData, setSoftDeleteData] = useState({
    password: "",
    confirmation: "",
  });
  const [permanentDeleteData, setPermanentDeleteData] = useState({
    password: "",
    confirmation: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    soft: false,
    permanent: false,
  });
  const [softDeleteOpen, setSoftDeleteOpen] = useState(false);
  const [permanentDeleteOpen, setPermanentDeleteOpen] = useState(false);
  
  const { toast } = useToast();
  const router = useRouter();

  // 軟刪除帳號
  const softDeleteMutation = useMutation({
    mutationFn: async (data: AccountDeletionData) => {
      const response = await httpClient.delete("/auth/account", { body: data });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "帳號已停用",
        description: "您的帳號已成功停用。如需恢復請聯繫客服。",
      });
      setSoftDeleteOpen(false);
      // 登出並重定向到登入頁面
      localStorage.removeItem("access_token");
      router.push("/login");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || "停用帳號失敗";
      toast({
        title: "停用失敗",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // 永久刪除帳號
  const permanentDeleteMutation = useMutation({
    mutationFn: async (data: AccountDeletionData) => {
      const response = await httpClient.delete("/auth/account/permanent", { body: data });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "帳號已永久刪除",
        description: "您的帳號及所有資料已永久刪除。",
      });
      setPermanentDeleteOpen(false);
      // 登出並重定向到登入頁面
      localStorage.removeItem("access_token");
      router.push("/login");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || "刪除帳號失敗";
      toast({
        title: "刪除失敗",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSoftDelete = () => {
    if (!softDeleteData.password) {
      toast({
        title: "請輸入密碼",
        description: "您需要輸入密碼以確認身份",
        variant: "destructive",
      });
      return;
    }

    if (softDeleteData.confirmation !== "DELETE_MY_ACCOUNT") {
      toast({
        title: "確認字串錯誤",
        description: "請正確輸入 'DELETE_MY_ACCOUNT'",
        variant: "destructive",
      });
      return;
    }

    softDeleteMutation.mutate(softDeleteData);
  };

  const handlePermanentDelete = () => {
    if (!permanentDeleteData.password) {
      toast({
        title: "請輸入密碼",
        description: "您需要輸入密碼以確認身份",
        variant: "destructive",
      });
      return;
    }

    if (permanentDeleteData.confirmation !== "DELETE_MY_ACCOUNT") {
      toast({
        title: "確認字串錯誤",
        description: "請正確輸入 'DELETE_MY_ACCOUNT'",
        variant: "destructive",
      });
      return;
    }

    permanentDeleteMutation.mutate(permanentDeleteData);
  };

  const togglePasswordVisibility = (type: "soft" | "permanent") => {
    setShowPasswords(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  return (
    <div className="space-y-6">
      <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          以下操作會影響您的帳號狀態。請仔細閱讀說明並謹慎操作。
        </AlertDescription>
      </Alert>

      {/* 停用帳號 */}
      <div className="border border-orange-200 dark:border-orange-800 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Shield className="h-6 w-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-orange-600 mb-2">
              停用帳號
            </h3>
            <p className="text-muted-foreground mb-4">
              暫時停用您的帳號。您的資料會被保留，可以透過聯繫客服恢復帳號。
            </p>
            <ul className="text-sm text-muted-foreground mb-4 space-y-1">
              <li>• 您將無法登入此帳號</li>
              <li>• 所有資料會被保留</li>
              <li>• 可以透過客服恢復帳號</li>
            </ul>
            
            <Dialog open={softDeleteOpen} onOpenChange={setSoftDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-orange-600 border-orange-600 hover:bg-orange-50">
                  停用帳號
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-orange-600">
                    <Shield className="h-5 w-5" />
                    確認停用帳號
                  </DialogTitle>
                  <DialogDescription>
                    請輸入您的密碼和確認字串以停用帳號。
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="soft-password">密碼</Label>
                    <div className="relative">
                      <Input
                        id="soft-password"
                        type={showPasswords.soft ? "text" : "password"}
                        value={softDeleteData.password}
                        onChange={(e) => setSoftDeleteData(prev => ({ 
                          ...prev, 
                          password: e.target.value 
                        }))}
                        disabled={softDeleteMutation.isPending}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility("soft")}
                        disabled={softDeleteMutation.isPending}
                      >
                        {showPasswords.soft ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="soft-confirmation">
                      請輸入 <code className="bg-muted px-1 rounded">DELETE_MY_ACCOUNT</code>
                    </Label>
                    <Input
                      id="soft-confirmation"
                      type="text"
                      value={softDeleteData.confirmation}
                      onChange={(e) => setSoftDeleteData(prev => ({ 
                        ...prev, 
                        confirmation: e.target.value 
                      }))}
                      placeholder="DELETE_MY_ACCOUNT"
                      disabled={softDeleteMutation.isPending}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setSoftDeleteOpen(false)}
                    disabled={softDeleteMutation.isPending}
                  >
                    取消
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleSoftDelete}
                    disabled={softDeleteMutation.isPending}
                  >
                    {softDeleteMutation.isPending ? "處理中..." : "確認停用"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* 永久刪除帳號 */}
      <div className="border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              永久刪除帳號
            </h3>
            <p className="text-muted-foreground mb-4">
              永久刪除您的帳號及所有相關資料。此操作無法復原！
            </p>
            <ul className="text-sm text-muted-foreground mb-4 space-y-1">
              <li>• 帳號將被永久刪除</li>
              <li>• 所有聊天記錄將被刪除</li>
              <li>• 所有聯絡人資料將被刪除</li>
              <li>• 此操作無法復原</li>
            </ul>
            
            <Dialog open={permanentDeleteOpen} onOpenChange={setPermanentDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  永久刪除帳號
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    確認永久刪除帳號
                  </DialogTitle>
                  <DialogDescription>
                    <strong>警告：此操作無法復原！</strong>
                    <br />
                    請輸入您的密碼和確認字串以永久刪除帳號。
                  </DialogDescription>
                </DialogHeader>
                
                <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    此操作將永久刪除您的帳號及所有資料，包括聊天記錄、聯絡人等。此操作無法復原！
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="permanent-password">密碼</Label>
                    <div className="relative">
                      <Input
                        id="permanent-password"
                        type={showPasswords.permanent ? "text" : "password"}
                        value={permanentDeleteData.password}
                        onChange={(e) => setPermanentDeleteData(prev => ({ 
                          ...prev, 
                          password: e.target.value 
                        }))}
                        disabled={permanentDeleteMutation.isPending}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility("permanent")}
                        disabled={permanentDeleteMutation.isPending}
                      >
                        {showPasswords.permanent ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="permanent-confirmation">
                      請輸入 <code className="bg-muted px-1 rounded">DELETE_MY_ACCOUNT</code>
                    </Label>
                    <Input
                      id="permanent-confirmation"
                      type="text"
                      value={permanentDeleteData.confirmation}
                      onChange={(e) => setPermanentDeleteData(prev => ({ 
                        ...prev, 
                        confirmation: e.target.value 
                      }))}
                      placeholder="DELETE_MY_ACCOUNT"
                      disabled={permanentDeleteMutation.isPending}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setPermanentDeleteOpen(false)}
                    disabled={permanentDeleteMutation.isPending}
                  >
                    取消
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handlePermanentDelete}
                    disabled={permanentDeleteMutation.isPending}
                  >
                    {permanentDeleteMutation.isPending ? "刪除中..." : "永久刪除"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}