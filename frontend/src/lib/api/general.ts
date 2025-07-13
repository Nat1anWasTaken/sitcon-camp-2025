import { httpClient } from "./http-client";

/**
 * 一般 API 方法
 */
export class GeneralApi {
  /**
   * 根路徑 - 返回 API 基本資訊
   */
  static async getRoot() {
    return httpClient.get("/");
  }

  /**
   * 健康檢查端點
   */
  static async healthCheck() {
    return httpClient.get("/health");
  }

  /**
   * 測試端點
   */
  static async hello() {
    return httpClient.get("/api/v1/hello");
  }
}

/**
 * API 版本資訊
 */
export const API_VERSION = "0.1.0";
export const API_TITLE = "海王 Backend";
