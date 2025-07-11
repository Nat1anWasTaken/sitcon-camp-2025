"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useContact } from "@/lib/api/hooks/use-contact";
import { useRecordsByContact } from "@/lib/api/hooks/use-records";
import { AlertCircle } from "lucide-react";
import { ContactHeader } from "./contact-header";
import { ContactRecords } from "./contact-records";

interface ContactDetailsProps {
  contactId: number;
  className?: string;
}

export function ContactDetails({ contactId, className }: ContactDetailsProps) {
  // 使用 React Query hooks
  const {
    data: contactResponse,
    isLoading: isContactLoading,
    error: contactError,
  } = useContact(contactId);

  const {
    data: recordsResponse,
    isLoading: isRecordsLoading,
    error: recordsError,
    refetch: refetchRecords,
  } = useRecordsByContact(contactId);

  const contact = contactResponse?.data;
  const records = recordsResponse?.data?.records || [];
  const isLoading = isContactLoading || isRecordsLoading;
  const error = contactError || recordsError;

  // 處理記錄更新
  const handleRecordsUpdate = () => {
    refetchRecords();
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-8 w-24 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error?.message || "載入聯絡人資料失敗"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 聯絡人基本資料 */}
      <ContactHeader contact={contact} />

      {/* 聯絡人記錄 */}
      <ContactRecords
        contactId={contactId}
        records={records}
        onRecordsUpdate={handleRecordsUpdate}
      />
    </div>
  );
}
