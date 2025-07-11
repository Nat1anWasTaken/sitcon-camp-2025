"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { httpClient } from "@/lib/api/http-client";

interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

export function PasswordChange() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordChangeData) => {
      const response = await httpClient.put("/auth/password", data);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "密碼更新成功",
        description: "您的密碼已成功更新",
      });
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setErrors({});
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || "密碼更新失敗";
      toast({
        title: "密碼更新失敗",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "請輸入當前密碼";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "請輸入新密碼";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "新密碼至少需要8個字元";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "請確認新密碼";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "密碼確認不符";
    }

    if (formData.currentPassword && formData.newPassword && 
        formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = "新密碼不能與當前密碼相同";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    passwordMutation.mutate({
      current_password: formData.currentPassword,
      new_password: formData.newPassword,
    });
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
  const strengthLabels = ["很弱", "弱", "一般", "強", "很強"];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription>
          為了保護您的帳號安全，請確保新密碼包含大小寫字母、數字和特殊字元。
        </AlertDescription>
      </Alert>

      {/* 當前密碼 */}
      <div className="space-y-2">
        <Label htmlFor="currentPassword">當前密碼</Label>
        <div className="relative">
          <Input
            id="currentPassword"
            type={showPasswords.current ? "text" : "password"}
            value={formData.currentPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
            className={errors.currentPassword ? "border-red-500" : ""}
            disabled={passwordMutation.isPending}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => togglePasswordVisibility("current")}
            disabled={passwordMutation.isPending}
          >
            {showPasswords.current ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        {errors.currentPassword && (
          <p className="text-sm text-red-600">{errors.currentPassword}</p>
        )}
      </div>

      {/* 新密碼 */}
      <div className="space-y-2">
        <Label htmlFor="newPassword">新密碼</Label>
        <div className="relative">
          <Input
            id="newPassword"
            type={showPasswords.new ? "text" : "password"}
            value={formData.newPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
            className={errors.newPassword ? "border-red-500" : ""}
            disabled={passwordMutation.isPending}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => togglePasswordVisibility("new")}
            disabled={passwordMutation.isPending}
          >
            {showPasswords.new ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* 密碼強度指示器 */}
        {formData.newPassword && (
          <div className="space-y-2">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded ${
                    i < passwordStrength ? strengthColors[passwordStrength - 1] : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              密碼強度: {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : "很弱"}
            </p>
          </div>
        )}
        
        {errors.newPassword && (
          <p className="text-sm text-red-600">{errors.newPassword}</p>
        )}
      </div>

      {/* 確認新密碼 */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">確認新密碼</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showPasswords.confirm ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            className={errors.confirmPassword ? "border-red-500" : ""}
            disabled={passwordMutation.isPending}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => togglePasswordVisibility("confirm")}
            disabled={passwordMutation.isPending}
          >
            {showPasswords.confirm ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        {/* 密碼匹配指示器 */}
        {formData.confirmPassword && (
          <div className="flex items-center gap-2">
            {formData.newPassword === formData.confirmPassword ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">密碼匹配</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">密碼不匹配</span>
              </>
            )}
          </div>
        )}
        
        {errors.confirmPassword && (
          <p className="text-sm text-red-600">{errors.confirmPassword}</p>
        )}
      </div>

      {/* 提交按鈕 */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={passwordMutation.isPending}
          className="w-full sm:w-auto"
        >
          {passwordMutation.isPending ? "更新中..." : "更新密碼"}
        </Button>
      </div>
    </form>
  );
}