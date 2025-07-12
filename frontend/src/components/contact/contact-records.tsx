"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDeleteRecord } from "@/lib/api/hooks/use-records";
import { ContactRecord, RecordCategory } from "@/lib/types/api";
import {
  Calendar,
  Edit,
  FileText,
  Hash,
  Heart,
  Link,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { ContactRecordForm } from "./contact-record-form";

interface ContactRecordsProps {
  contactId: number;
  records: ContactRecord[];
  onRecordsUpdate: () => void;
}

const CATEGORY_INFO: Record<
  RecordCategory,
  {
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    color: string;
  }
> = {
  Communications: {
    label: "通訊方式",
    icon: Link,
    color: "bg-blue-100 text-blue-800",
  },
  Nicknames: {
    label: "暱稱",
    icon: Hash,
    color: "bg-green-100 text-green-800",
  },
  Memories: { label: "回憶", icon: Heart, color: "bg-pink-100 text-pink-800" },
  Preferences: {
    label: "偏好",
    icon: Settings,
    color: "bg-purple-100 text-purple-800",
  },
  Plan: {
    label: "計劃",
    icon: Calendar,
    color: "bg-orange-100 text-orange-800",
  },
  Other: { label: "其他", icon: FileText, color: "bg-gray-100 text-gray-800" },
};

export function ContactRecords({
  contactId,
  records,
  onRecordsUpdate,
}: ContactRecordsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ContactRecord | null>(
    null
  );

  // 使用 React Query mutation hook
  const deleteRecordMutation = useDeleteRecord();

  // 按分類組織記錄
  const recordsByCategory = records.reduce((acc, record) => {
    if (!acc[record.category]) {
      acc[record.category] = [];
    }
    acc[record.category].push(record);
    return acc;
  }, {} as Record<RecordCategory, ContactRecord[]>);

  // 處理記錄刪除
  const handleDeleteRecord = async (recordId: number) => {
    try {
      await deleteRecordMutation.mutateAsync(recordId);
      // Success message and cache invalidation are handled by the mutation hook
      onRecordsUpdate();
    } catch (error) {
      // Error handling is already managed by the mutation hook
      console.error("刪除記錄失敗:", error);
    }
  };

  // 處理記錄保存
  const handleRecordSave = () => {
    setIsAddDialogOpen(false);
    setEditingRecord(null);
    onRecordsUpdate();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryCount = (category: RecordCategory) => {
    return recordsByCategory[category]?.length || 0;
  };

  const renderRecordCard = (record: ContactRecord) => {
    const categoryInfo = CATEGORY_INFO[record.category];
    const Icon = categoryInfo.icon;

    return (
      <Card key={record.id} className="mb-3 w-full">
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-3">
            {/* Header with category and date */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2 min-w-0">
                <Icon className="h-4 w-4 shrink-0" />
                <Badge
                  variant="secondary"
                  className={`${categoryInfo.color} text-xs shrink-0`}
                >
                  {categoryInfo.label}
                </Badge>
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground shrink-0">
                {formatDate(record.created_at)}
              </span>
            </div>

            {/* Content */}
            <p className="text-foreground whitespace-pre-wrap break-words text-sm sm:text-base overflow-hidden">
              {record.content}
            </p>

            {/* Footer with last edited and actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex-1 min-w-0">
                {record.updated_at &&
                  record.updated_at !== record.created_at && (
                    <p className="text-xs text-muted-foreground truncate">
                      最後編輯: {formatDate(record.updated_at)}
                    </p>
                  )}
              </div>

              {/* Action buttons */}
              <div className="flex space-x-1 self-end sm:self-auto shrink-0">
                <Dialog
                  open={editingRecord?.id === record.id}
                  onOpenChange={(open) => {
                    if (!open) {
                      setEditingRecord(null);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingRecord(record)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>編輯記錄</DialogTitle>
                    </DialogHeader>
                    <ContactRecordForm
                      contactId={contactId}
                      record={record}
                      onSave={handleRecordSave}
                      onCancel={() => setEditingRecord(null)}
                    />
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deleteRecordMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-auto sm:max-w-lg">
                    <AlertDialogHeader>
                      <AlertDialogTitle>確認刪除</AlertDialogTitle>
                      <AlertDialogDescription className="break-words">
                        您確定要刪除這筆記錄嗎？此操作無法復原。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row space-y-2 sm:space-y-0">
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteRecord(record.id)}
                        disabled={deleteRecordMutation.isPending}
                      >
                        {deleteRecordMutation.isPending ? "刪除中..." : "刪除"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-row justify-between items-between space-y-3 sm:space-y-0">
          <CardTitle className="text-lg sm:text-xl">聯絡人記錄</CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="self-start sm:self-auto">
                <Plus className="h-4 w-4 mr-2" />
                新增記錄
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full sm:max-w-md">
              <DialogHeader>
                <DialogTitle>新增記錄</DialogTitle>
              </DialogHeader>
              <ContactRecordForm
                contactId={contactId}
                onSave={handleRecordSave}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        <Tabs defaultValue="all" className="w-full">
          <div className="overflow-x-auto -mx-2 px-2">
            <TabsList className="grid grid-cols-7 w-max min-w-full">
              <TabsTrigger
                value="all"
                className="text-xs sm:text-sm whitespace-nowrap px-2"
              >
                全部 ({records.length})
              </TabsTrigger>
              {Object.entries(CATEGORY_INFO).map(([category, info]) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="text-xs sm:text-sm whitespace-nowrap px-2"
                >
                  {info.label} ({getCategoryCount(category as RecordCategory)})
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-4">
            {records.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">還沒有任何記錄</p>
                <p className="text-sm text-muted-foreground">
                  點擊「新增記錄」開始記錄關於這個聯絡人的資訊
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {records
                  .sort(
                    (a, b) =>
                      new Date(b.created_at).getTime() -
                      new Date(a.created_at).getTime()
                  )
                  .map(renderRecordCard)}
              </div>
            )}
          </TabsContent>

          {Object.entries(CATEGORY_INFO).map(([category, info]) => {
            const categoryRecords =
              recordsByCategory[category as RecordCategory] || [];

            return (
              <TabsContent key={category} value={category} className="mt-4">
                {categoryRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <info.icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      還沒有{info.label}記錄
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categoryRecords
                      .sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() -
                          new Date(a.created_at).getTime()
                      )
                      .map(renderRecordCard)}
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
