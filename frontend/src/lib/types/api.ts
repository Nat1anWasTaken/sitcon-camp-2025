export interface UserCreate {
  email: string;
  username: string;
  full_name?: string | null;
  password: string;
}

export interface UserResponse {
  email: string;
  username: string;
  full_name?: string | null;
  id: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface Token {
  access_token: string;
  token_type?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  grant_type?: "password" | null;
  scope?: string;
  client_id?: string | null;
  client_secret?: string | null;
}

// 錯誤處理型別
export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

// API 回應型別
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// HTTP 方法型別
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// 請求配置型別
export interface RequestConfig {
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  token?: string;
  baseURL?: string;
}

// API 端點型別
export interface ApiEndpoints {
  // 認證端點
  register: "/auth/register";
  login: "/auth/login";
  me: "/auth/@me";

  // 基本端點
  root: "/";
  health: "/health";
  hello: "/api/v1/hello";
}

// API 錯誤型別
export class ApiError extends Error {
  status: number;
  response?: unknown;

  constructor(message: string, status: number, response?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.response = response;
  }
}
