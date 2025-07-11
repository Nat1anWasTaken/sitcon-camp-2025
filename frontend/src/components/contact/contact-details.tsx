"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactApi } from "@/lib/api/contact";
import { RecordsApi } from "@/lib/api/records";
import { Contact, ContactRecord } from "@/lib/types/api";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { ContactHeader } from "./contact-header";
import { ContactRecords } from "./contact-records";

interface ContactDetailsProps {
  contactId: number;
  className?: string;
}

export function ContactDetails({ contactId, className }: ContactDetailsProps) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [records, setRecords] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 載入聯絡人資料
  const loadContact = async () => {
    try {
      setError(null);
      const contactData = await ContactApi.getContact(contactId);
      if (contactData.data) {
        setContact(contactData.data);
      }
    } catch (err) {
      console.error("載入聯絡人失敗:", err);
      setError("載入聯絡人資料失敗");
    }
  };

  // 載入聯絡人記錄
  const loadRecords = async () => {
    try {
      const recordsData = await RecordsApi.getRecordsByContact(contactId);
      setRecords(recordsData.data?.records || []);
    } catch (err) {
      console.error("載入記錄失敗:", err);
    }
  };

  // 初始載入資料
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadContact(), loadRecords()]);
      setLoading(false);
    };

    loadData();
  }, [contactId]);

  // 處理聯絡人更新
  const handleContactUpdate = (updatedContact: Contact) => {
    setContact(updatedContact);
  };

  // 處理記錄更新
  const handleRecordsUpdate = () => {
    loadRecords();
  };

  if (loading) {
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
          <AlertDescription>{error || "聯絡人不存在"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 聯絡人基本資料 */}
      <ContactHeader contact={contact} onContactUpdate={handleContactUpdate} />

      {/* 聯絡人記錄 */}
      <ContactRecords
        contactId={contactId}
        records={records}
        onRecordsUpdate={handleRecordsUpdate}
      />
    </div>
  );
}
