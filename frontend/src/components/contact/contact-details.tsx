"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useContact } from "@/lib/api/hooks/use-contact";
import { useRecordsByContact } from "@/lib/api/hooks/use-records";
import { AlertCircle } from "lucide-react";
import { ContactHeader } from "./contact-header";
import { ContactRecords } from "./contact-records";
import { toast } from "sonner";
import { useState } from "react";
import { ContactInfoEditor } from "./contact-info-editor";

interface ContactDetailsProps {
  contactId: number;
  className?: string;
  onContactDeleted?: () => void;
}

export function ContactDetails({ contactId, className, onContactDeleted }: ContactDetailsProps) {
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

  const [isEditing, setIsEditing] = useState(false);

  // 處理記錄更新
  const handleRecordsUpdate = () => {
    refetchRecords();
  };

  if (isLoading) {
    return (
      <div className={`space-y-4 md:space-y-6 max-w-full ${className}`}>
        <Card className="w-full">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 md:space-x-6">
              <div className="flex justify-center sm:justify-start">
                <Skeleton className="h-16 w-16 sm:h-20 sm:w-20 rounded-full" />
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <Skeleton className="h-5 sm:h-6 w-32 mx-auto sm:mx-0" />
                <Skeleton className="h-4 w-48 mx-auto sm:mx-0" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardContent className="p-4 md:p-6">
            <Skeleton className="h-6 sm:h-8 w-24 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-12 sm:h-16 w-full" />
              <Skeleton className="h-12 sm:h-16 w-full" />
              <Skeleton className="h-12 sm:h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className={`space-y-4 md:space-y-6 max-w-full ${className}`}>
        <Alert variant="destructive" className="w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error?.message || "載入聯絡人資料失敗"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`space-y-4 md:space-y-6 max-w-full ${className}`}>
      {/* 聯絡人基本資料 */}
      <ContactHeader contact={contact} onContactDeleted={onContactDeleted} />
      {/* 聯絡人記錄 */}
      <ContactRecords
        contactId={contactId}
        records={records}
        onRecordsUpdate={handleRecordsUpdate}
      />
    </div>
  );
}
