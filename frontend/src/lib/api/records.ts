import {
  ContactRecord,
  RECORD_ENDPOINTS,
  RecordCategory,
  RecordCreate,
  RecordListResponse,
  RecordQueryParams,
  RecordUpdate,
} from "../types/api";
import { httpClient } from "./http-client";

/**
 * 記錄相關 API 方法
 */
export class RecordsApi {
  /**
   * 創建新記錄
   */
  static async createRecord(recordData: RecordCreate) {
    return httpClient.post<ContactRecord>(RECORD_ENDPOINTS.records, recordData);
  }

  /**
   * 獲取記錄列表
   */
  static async getRecords(params?: RecordQueryParams) {
    const searchParams = new URLSearchParams();

    if (params?.skip !== undefined) {
      searchParams.append("skip", params.skip.toString());
    }
    if (params?.limit !== undefined) {
      searchParams.append("limit", params.limit.toString());
    }
    if (params?.contact_id !== undefined) {
      searchParams.append("contact_id", params.contact_id.toString());
    }
    if (params?.category) {
      searchParams.append("category", params.category);
    }
    if (params?.search) {
      searchParams.append("search", params.search);
    }

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `${RECORD_ENDPOINTS.records}?${queryString}`
      : RECORD_ENDPOINTS.records;

    return httpClient.get<RecordListResponse>(endpoint);
  }

  /**
   * 根據聯絡人 ID 獲取記錄列表
   */
  static async getRecordsByContact(
    contactId: number,
    params?: Omit<RecordQueryParams, "contact_id">
  ) {
    const searchParams = new URLSearchParams();

    if (params?.skip !== undefined) {
      searchParams.append("skip", params.skip.toString());
    }
    if (params?.limit !== undefined) {
      searchParams.append("limit", params.limit.toString());
    }
    if (params?.category) {
      searchParams.append("category", params.category);
    }
    if (params?.search) {
      searchParams.append("search", params.search);
    }

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `${RECORD_ENDPOINTS.recordsByContact(contactId)}?${queryString}`
      : RECORD_ENDPOINTS.recordsByContact(contactId);

    return httpClient.get<RecordListResponse>(endpoint);
  }

  /**
   * 獲取單個記錄詳情
   */
  static async getRecord(recordId: number) {
    return httpClient.get<ContactRecord>(RECORD_ENDPOINTS.recordById(recordId));
  }

  /**
   * 更新記錄
   */
  static async updateRecord(recordId: number, recordData: RecordUpdate) {
    return httpClient.put<ContactRecord>(
      RECORD_ENDPOINTS.recordById(recordId),
      recordData
    );
  }

  /**
   * 刪除記錄
   */
  static async deleteRecord(recordId: number) {
    return httpClient.delete(RECORD_ENDPOINTS.recordById(recordId));
  }

  /**
   * 獲取所有可用的記錄分類
   */
  static async getRecordCategories() {
    return httpClient.get<RecordCategory[]>(RECORD_ENDPOINTS.categories);
  }
}
