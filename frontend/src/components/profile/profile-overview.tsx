"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { User, Mail, Calendar, Users, FileText } from "lucide-react";
import { httpClient } from "@/lib/api/http-client";

interface ProfileData {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  contacts_count: number;
  records_count: number;
}

export function ProfileOverview() {
  const { data: profile, isLoading, error } = useQuery<ProfileData>({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await httpClient.get("/auth/profile");
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardContent className="p-6">
          <p className="text-red-600">載入個人資料時發生錯誤</p>
        </CardContent>
      </Card>
    );
  }

  if (!profile) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* 基本資訊卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            基本資訊
          </CardTitle>
          <CardDescription>
            您的帳號基本資料和狀態
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                用戶名
              </label>
              <p className="font-medium">{profile.username}</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                電子郵件
              </label>
              <p className="font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {profile.email}
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                完整姓名
              </label>
              <p className="font-medium">
                {profile.full_name || "未設定"}
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                帳號狀態
              </label>
              <Badge variant={profile.is_active ? "default" : "destructive"}>
                {profile.is_active ? "活躍" : "停用"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 統計資料卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            使用統計
          </CardTitle>
          <CardDescription>
            您在平台上的活動統計
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-sm">聯絡人數量</span>
              </div>
              <p className="text-2xl font-bold">{profile.contacts_count}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span className="text-sm">記錄數量</span>
              </div>
              <p className="text-2xl font-bold">{profile.records_count}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 時間資訊卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            時間資訊
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              註冊時間
            </label>
            <p className="font-medium">{formatDate(profile.created_at)}</p>
          </div>
          
          {profile.updated_at && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                最後更新
              </label>
              <p className="font-medium">{formatDate(profile.updated_at)}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}