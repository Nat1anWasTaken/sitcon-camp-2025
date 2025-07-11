"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useChangePassword,
  useDeleteAccount,
  useUpdatePreferences,
} from "@/lib/api/hooks/use-profile";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLogout } from "@/lib/api/hooks/use-auth";

export default function ProfilePage() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [preferences, setPreferences] = useState("{}");

  const changePassword = useChangePassword();
  const updatePreferences = useUpdatePreferences();
  const deleteAccount = useDeleteAccount();
  const logout = useLogout();
  const router = useRouter();

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("新密碼與確認密碼不一致");
      return;
    }
    changePassword.mutate({ old_password: oldPassword, new_password: newPassword });
  };

  const handlePreferencesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(preferences);
    } catch (err) {
      toast.error("偏好設定必須是有效的 JSON 格式");
      return;
    }
    updatePreferences.mutate({ preferences: parsed });
  };

  const handleDeleteAccount = () => {
    if (!confirm("確認要刪除帳號？此動作無法復原")) return;
    deleteAccount.mutate(undefined, {
      onSuccess: () => {
        toast.success("帳號已刪除");
        logout.mutate();
        router.replace("/register");
      },
      onError: (error: any) => {
        toast.error(error.message || "刪除帳號失敗");
      },
    });
  };

  return (
    <AuthGuard>
      <div className="container max-w-2xl py-8 space-y-8">
        {/* Password */}
        <Card>
          <CardHeader>
            <CardTitle>修改密碼</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="oldPassword">目前密碼</Label>
                <Input
                  id="oldPassword"
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">新密碼</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">確認新密碼</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? "更新中..." : "更新密碼"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>偏好設定</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePreferencesSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preferences">偏好 (JSON 格式)</Label>
                <Textarea
                  id="preferences"
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  rows={6}
                />
              </div>
              <Button type="submit" disabled={updatePreferences.isPending}>
                {updatePreferences.isPending ? "更新中..." : "儲存偏好"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Delete account */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">刪除帳號</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              刪除帳號將永久移除所有資料，此操作無法復原。
            </p>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteAccount.isPending}
            >
              {deleteAccount.isPending ? "刪除中..." : "刪除帳號"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}