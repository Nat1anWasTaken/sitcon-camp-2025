import {
  AvatarUploadResponse,
  Contact,
  CONTACT_ENDPOINTS,
  ContactCreate,
  ContactListResponse,
  ContactQueryParams,
  ContactUpdate,
  SUPPORTED_AVATAR_TYPES,
  SupportedAvatarType,
} from "../types/api";
import { httpClient } from "./http-client";

/**
 * 聯絡人相關 API 方法
 */
export class ContactApi {
  /**
   * 創建新聯絡人
   */
  static async createContact(contactData: ContactCreate) {
    return httpClient.post<Contact>(CONTACT_ENDPOINTS.contacts, contactData);
  }

  /**
   * 創建聯絡人並同時上傳頭像
   */
  static async createContactWithAvatar(
    contactData: ContactCreate,
    avatarFile?: File
  ) {
    const formData = new FormData();

    // 添加聯絡人資料
    formData.append("name", contactData.name);
    if (contactData.description) {
      formData.append("description", contactData.description);
    }

    // 添加頭像文件
    if (avatarFile) {
      // 驗證文件類型
      if (
        !SUPPORTED_AVATAR_TYPES.includes(avatarFile.type as SupportedAvatarType)
      ) {
        throw new Error(
          `不支援的文件類型: ${
            avatarFile.type
          }。僅支援: ${SUPPORTED_AVATAR_TYPES.join(", ")}`
        );
      }

      // 驗證文件大小 (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (avatarFile.size > maxSize) {
        throw new Error("文件大小不能超過 5MB");
      }

      formData.append("avatar", avatarFile);
    }

    return httpClient.post<Contact>(
      CONTACT_ENDPOINTS.contactsWithAvatar,
      formData
    );
  }

  /**
   * 獲取聯絡人列表
   */
  static async getContacts(params?: ContactQueryParams) {
    const searchParams = new URLSearchParams();

    if (params?.skip !== undefined) {
      searchParams.append("skip", params.skip.toString());
    }
    if (params?.limit !== undefined) {
      searchParams.append("limit", params.limit.toString());
    }
    if (params?.search) {
      searchParams.append("search", params.search);
    }

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `${CONTACT_ENDPOINTS.contacts}?${queryString}`
      : CONTACT_ENDPOINTS.contacts;

    return httpClient.get<ContactListResponse>(endpoint);
  }

  /**
   * 獲取特定聯絡人詳情
   */
  static async getContact(contactId: number) {
    const endpoint = CONTACT_ENDPOINTS.contactById(contactId);
    return httpClient.get<Contact>(endpoint);
  }

  /**
   * 更新聯絡人資訊
   */
  static async updateContact(contactId: number, contactData: ContactUpdate) {
    const endpoint = CONTACT_ENDPOINTS.contactById(contactId);
    return httpClient.put<Contact>(endpoint, contactData);
  }

  /**
   * 刪除聯絡人
   */
  static async deleteContact(contactId: number) {
    const endpoint = CONTACT_ENDPOINTS.contactById(contactId);
    return httpClient.delete<void>(endpoint);
  }

  /**
   * 上傳或更新聯絡人頭像
   */
  static async uploadAvatar(contactId: number, avatarFile: File) {
    // 驗證文件類型
    if (
      !SUPPORTED_AVATAR_TYPES.includes(avatarFile.type as SupportedAvatarType)
    ) {
      throw new Error(
        `不支援的文件類型: ${
          avatarFile.type
        }。僅支援: ${SUPPORTED_AVATAR_TYPES.join(", ")}`
      );
    }

    // 驗證文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (avatarFile.size > maxSize) {
      throw new Error("文件大小不能超過 5MB");
    }

    const formData = new FormData();
    formData.append("file", avatarFile);

    const endpoint = CONTACT_ENDPOINTS.contactAvatar(contactId);
    return httpClient.post<AvatarUploadResponse>(endpoint, formData);
  }

  /**
   * 刪除聯絡人頭像
   */
  static async deleteAvatar(contactId: number) {
    const endpoint = CONTACT_ENDPOINTS.contactAvatar(contactId);
    return httpClient.delete<void>(endpoint);
  }

  /**
   * 獲取頭像圖片 (返回 blob URL)
   */
  static async getAvatarImage(contactId: number): Promise<string | null> {
    try {
      const endpoint = CONTACT_ENDPOINTS.contactAvatarImage(contactId);
      const blob = await httpClient.getBlob(endpoint);

      if (!blob) {
        return null;
      }

      // 創建 blob URL 用於顯示圖片
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("獲取頭像失敗:", error);
      return null;
    }
  }

  /**
   * 獲取頭像圖片 Blob 數據
   */
  static async getAvatarBlob(contactId: number): Promise<Blob | null> {
    try {
      const endpoint = CONTACT_ENDPOINTS.contactAvatarImage(contactId);
      return await httpClient.getBlob(endpoint);
    } catch (error) {
      console.error("獲取頭像 Blob 失敗:", error);
      return null;
    }
  }

  /**
   * 驗證頭像文件格式和大小
   */
  static validateAvatarFile(file: File): { valid: boolean; error?: string } {
    // 檢查文件類型
    if (!SUPPORTED_AVATAR_TYPES.includes(file.type as SupportedAvatarType)) {
      return {
        valid: false,
        error: `不支援的文件類型: ${
          file.type
        }。僅支援: ${SUPPORTED_AVATAR_TYPES.join(", ")}`,
      };
    }

    // 檢查文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: "文件大小不能超過 5MB",
      };
    }

    return { valid: true };
  }

  /**
   * 格式化文件大小顯示
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}
