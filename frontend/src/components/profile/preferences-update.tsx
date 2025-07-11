"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, User, Mail, Info } from "lucide-react";
import { httpClient } from "@/lib/api/http-client";

interface UserData {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

interface PreferencesUpdateData {
  full_name?: string;
  email?: string;
}

export function PreferencesUpdate() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 獲取當前用戶資料
  const { data: userData, isLoading } = useQuery<UserData>({
    queryKey: ["user", "@me"],
    queryFn: async () => {
      const response = await httpClient.get("/auth/@me");
      return response.data;
    },
  });

  // 更新偏好設定
  const preferencesMutation = useMutation({
    mutationFn: async (data: PreferencesUpdateData) => {
      const response = await httpClient.put("/auth/preferences", data);
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: "偏好設定已更新",
        description: "您的個人資料已成功更新",
      });
      
      // 更新查詢快取
      queryClient.setQueryData(["user", "@me"], data);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      
      setHasChanges(false);
      setErrors({});
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || "更新失敗";
      toast({
        title: "更新失敗",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // 初始化表單資料
  useEffect(() => {
    if (userData) {
      setFormData({
        fullName: userData.full_name || "",
        email: userData.email,
      });
    }
  }, [userData]);

  // 檢查是否有變更
  useEffect(() => {
    if (userData) {
      const hasFullNameChange = formData.fullName !== (userData.full_name || "");
      const hasEmailChange = formData.email !== userData.email;
      setHasChanges(hasFullNameChange || hasEmailChange);
    }
  }, [formData, userData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // 驗證電子郵件格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "電子郵件為必填項目";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "請輸入有效的電子郵件格式";
    }

    // 全名長度檢查
    if (formData.fullName && formData.fullName.length > 100) {
      newErrors.fullName = "全名不能超過100個字元";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!hasChanges) {
      toast({
        title: "沒有變更",
        description: "您沒有進行任何變更",
      });
      return;
    }

    const updateData: PreferencesUpdateData = {};
    
    if (formData.fullName !== (userData?.full_name || "")) {
      updateData.full_name = formData.fullName || null;
    }
    
    if (formData.email !== userData?.email) {
      updateData.email = formData.email;
    }

    preferencesMutation.mutate(updateData);
  };

  const handleReset = () => {
    if (userData) {
      setFormData({
        fullName: userData.full_name || "",
        email: userData.email,
      });
      setErrors({});
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          更新您的個人資訊。用戶名無法變更，如需修改請聯繫客服。
        </AlertDescription>
      </Alert>

      {/* 用戶名（唯讀） */}
      <div className="space-y-2">
        <Label htmlFor="username">用戶名</Label>
        <Input
          id="username"
          type="text"
          value={userData?.username || ""}
          disabled
          className="bg-muted"
        />
        <p className="text-sm text-muted-foreground">
          用戶名無法變更
        </p>
      </div>

      {/* 電子郵件 */}
      <div className="space-y-2">
        <Label htmlFor="email">電子郵件</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
            disabled={preferencesMutation.isPending}
            placeholder="請輸入電子郵件"
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      {/* 完整姓名 */}
      <div className="space-y-2">
        <Label htmlFor="fullName">完整姓名</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
            className={`pl-10 ${errors.fullName ? "border-red-500" : ""}`}
            disabled={preferencesMutation.isPending}
            placeholder="請輸入完整姓名（可選）"
            maxLength={100}
          />
        </div>
        {errors.fullName && (
          <p className="text-sm text-red-600">{errors.fullName}</p>
        )}
        <p className="text-sm text-muted-foreground">
          {formData.fullName.length}/100 字元
        </p>
      </div>

      {/* 操作按鈕 */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={preferencesMutation.isPending || !hasChanges}
        >
          重置
        </Button>
        <Button
          type="submit"
          disabled={preferencesMutation.isPending || !hasChanges}
          className="flex items-center gap-2"
        >
          {preferencesMutation.isPending ? (
            <>載入中...</>
          ) : (
            <>
              <Save className="h-4 w-4" />
              儲存變更
            </>
          )}
        </Button>
      </div>

      {hasChanges && (
        <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <Info className="h-4 w-4" />
          <AlertDescription>
            您有未儲存的變更。請記得點擊「儲存變更」按鈕。
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}