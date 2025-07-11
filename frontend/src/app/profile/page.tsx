"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/auth-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Trash2 } from "lucide-react";
import { ProfileOverview } from "@/components/profile/profile-overview";
import { PasswordChange } from "@/components/profile/password-change";
import { PreferencesUpdate } from "@/components/profile/preferences-update";
import { AccountDeletion } from "@/components/profile/account-deletion";

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <AuthGuard>
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">個人資料</h1>
          <p className="text-muted-foreground mt-2">
            管理您的帳號設定、密碼和偏好設定
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              概覽
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              密碼
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              偏好設定
            </TabsTrigger>
            <TabsTrigger value="danger" className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-4 w-4" />
              危險區域
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <ProfileOverview />
          </TabsContent>

          <TabsContent value="password" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  變更密碼
                </CardTitle>
                <CardDescription>
                  為了帳號安全，建議定期更新您的密碼
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PasswordChange />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  偏好設定
                </CardTitle>
                <CardDescription>
                  更新您的個人資訊和帳號設定
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PreferencesUpdate />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="danger" className="space-y-6">
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <Trash2 className="h-5 w-5" />
                  危險區域
                </CardTitle>
                <CardDescription className="text-red-600/80">
                  這些操作無法復原，請謹慎操作
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AccountDeletion />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}