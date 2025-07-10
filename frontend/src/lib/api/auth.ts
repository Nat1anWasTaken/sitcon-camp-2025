import {
  LoginCredentials,
  Token,
  UserCreate,
  UserResponse,
} from "../types/api";
import { httpClient } from "./http-client";

/**
 * 認證相關 API 方法
 */
export class AuthApi {
  /**
   * 用戶註冊
   */
  static async register(userData: UserCreate) {
    return httpClient.post<UserResponse>("/auth/register", userData);
  }

  /**
   * 用戶登入
   */
  static async login(credentials: LoginCredentials) {
    return httpClient.post<Token>("/auth/login", credentials, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
  }

  /**
   * 獲取當前用戶資訊
   */
  static async getCurrentUser() {
    return httpClient.get<UserResponse>("/auth/@me");
  }

  /**
   * 登出 (清除本地 token)
   */
  static logout() {
    httpClient.setAuthToken(null);
    // 清除 localStorage 中的 token
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
    }
  }

  /**
   * 設定認證 token
   */
  static setToken(token: string) {
    httpClient.setAuthToken(token);
    // 儲存到 localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
    }
  }

  /**
   * 從 localStorage 獲取 token
   */
  static getStoredToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("access_token");
    }
    return null;
  }

  /**
   * 初始化認證狀態
   */
  static initAuth() {
    const token = this.getStoredToken();
    if (token) {
      httpClient.setAuthToken(token);
    }
  }

  /**
   * 檢查是否已認證
   */
  static isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }
}

// 自動初始化認證狀態
if (typeof window !== "undefined") {
  AuthApi.initAuth();
}
