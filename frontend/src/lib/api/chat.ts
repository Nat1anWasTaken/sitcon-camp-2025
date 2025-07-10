import { ChatRequest } from "../types/api";

/**
 * 聊天相關 API 方法
 */
export class ChatApi {
  /**
   * 發送聊天訊息並返回串流響應
   * @param chatRequest 聊天請求包含歷史訊息和當前訊息
   * @returns ReadableStream 用於接收串流回應
   */
  static async sendMessageStream(
    chatRequest: ChatRequest
  ): Promise<ReadableStream<Uint8Array> | null> {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // 從 AuthApi 獲取 token，確保 key 一致
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;

    try {
      const response = await fetch(`${baseURL}/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/plain",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(chatRequest),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.body;
    } catch (error) {
      console.error("串流聊天請求失敗:", error);
      throw error;
    }
  }
}
