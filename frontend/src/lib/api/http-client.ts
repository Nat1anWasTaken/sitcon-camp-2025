import { ApiError, ApiResponse, RequestConfig } from "../types/api";

/**
 * HTTP 客戶端類別
 * 提供型別安全的 fetch wrapper 和錯誤處理
 */
export class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL?: string) {
    // 優先使用傳入的 baseURL，然後是環境變數，最後是預設值
    this.baseURL =
      baseURL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /**
   * 設定授權 token
   */
  setAuthToken(token: string | null) {
    if (token) {
      this.defaultHeaders["Authorization"] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders["Authorization"];
    }
  }

  /**
   * 設定預設 headers
   */
  setHeaders(headers: Record<string, string>) {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * 更新 base URL
   */
  setBaseURL(url: string) {
    this.baseURL = url;
  }

  /**
   * 執行 HTTP 請求
   */
  async request<T>(
    endpoint: string,
    config: RequestConfig = { method: "GET" }
  ): Promise<ApiResponse<T>> {
    const url = `${config.baseURL || this.baseURL}${endpoint}`;

    // 合併 headers
    const headers = {
      ...this.defaultHeaders,
      ...config.headers,
    };

    // 如果有 token，覆蓋 Authorization header
    if (config.token) {
      headers["Authorization"] = `Bearer ${config.token}`;
    }

    // 準備請求選項
    const requestOptions: RequestInit = {
      method: config.method,
      headers,
    };

    // 處理請求體
    if (config.body && config.method !== "GET") {
      if (config.body instanceof FormData) {
        // 直接使用 FormData，移除 Content-Type 讓瀏覽器自動設置
        requestOptions.body = config.body;
        delete headers["Content-Type"];
      } else if (headers["Content-Type"]?.includes("application/json")) {
        requestOptions.body = JSON.stringify(config.body);
      } else if (
        headers["Content-Type"]?.includes("application/x-www-form-urlencoded")
      ) {
        // 處理 form data (用於登入)
        const formData = new URLSearchParams();
        if (config.body && typeof config.body === "object") {
          Object.entries(config.body as Record<string, unknown>).forEach(
            ([key, value]) => {
              if (value !== undefined && value !== null) {
                formData.append(key, String(value));
              }
            }
          );
        }
        requestOptions.body = formData;
      } else {
        requestOptions.body = config.body as BodyInit;
      }
    }

    try {
      const response = await fetch(url, requestOptions);
      const isJson = response.headers
        .get("content-type")
        ?.includes("application/json");
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        throw new ApiError(
          data?.detail || data?.message || `HTTP ${response.status}`,
          response.status,
          data
        );
      }

      return {
        data: data as T,
        status: response.status,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        return {
          error: error.message,
          status: error.status,
        };
      }

      // 網路錯誤或其他錯誤
      return {
        error: error instanceof Error ? error.message : "未知錯誤",
        status: 0,
      };
    }
  }

  /**
   * GET 請求
   */
  async get<T>(endpoint: string, config?: Omit<RequestConfig, "method">) {
    return this.request<T>(endpoint, { ...config, method: "GET" });
  }

  /**
   * POST 請求
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    config?: Omit<RequestConfig, "method" | "body">
  ) {
    return this.request<T>(endpoint, { ...config, method: "POST", body });
  }

  /**
   * PUT 請求
   */
  async put<T>(
    endpoint: string,
    body?: unknown,
    config?: Omit<RequestConfig, "method" | "body">
  ) {
    return this.request<T>(endpoint, { ...config, method: "PUT", body });
  }

  /**
   * PATCH 請求
   */
  async patch<T>(
    endpoint: string,
    body?: unknown,
    config?: Omit<RequestConfig, "method" | "body">
  ) {
    return this.request<T>(endpoint, { ...config, method: "PATCH", body });
  }

  /**
   * DELETE 請求
   */
  async delete<T>(endpoint: string, config?: Omit<RequestConfig, "method">) {
    return this.request<T>(endpoint, { ...config, method: "DELETE" });
  }

  /**
   * 獲取二進制數據 (Blob)
   */
  async getBlob(
    endpoint: string,
    config?: Omit<RequestConfig, "method">
  ): Promise<Blob | null> {
    const url = `${config?.baseURL || this.baseURL}${endpoint}`;

    // 合併 headers (不包含 Content-Type 和 Accept，因為我們要獲取二進制數據)
    const headers: Record<string, string> = {};

    // 添加授權 header
    if (this.defaultHeaders["Authorization"]) {
      headers["Authorization"] = this.defaultHeaders["Authorization"];
    }

    if (config?.token) {
      headers["Authorization"] = `Bearer ${config.token}`;
    }

    // 合併其他自定義 headers
    if (config?.headers) {
      Object.assign(headers, config.headers);
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // 資源不存在
        }
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }

      return await response.blob();
    } catch (error) {
      console.error("獲取二進制數據失敗:", error);
      throw error;
    }
  }
}

// 建立預設客戶端實例
export const httpClient = new HttpClient();
