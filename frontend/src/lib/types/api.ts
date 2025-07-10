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

  // 聊天端點
  chat: "/chat/";

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

// Chat 相關型別

// 文字內容類型
export interface TextContent {
  type: "text";
  text: string;
}

// 圖片內容類型
export interface ImageContent {
  type: "image";
  data: string; // Base64 編碼的圖片資料或 data URL
  mime_type: string; // 圖片 MIME 類型
}

// 複合內容類型
export type MessageContent = TextContent | ImageContent;

// 支援的圖片 MIME 類型
export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];

export interface ChatMessage {
  role: string; // user, assistant, system
  content: string | MessageContent[]; // 支援純文字或複合內容
  timestamp?: string | null;
}

export interface ChatRequest {
  history_messages?: ChatMessage[];
  messages: ChatMessage[];
}

export interface ChatResponse {
  // 根據實際 API 回應調整
  [key: string]: unknown;
}

// 圖片處理相關類型
export interface ImageFile {
  id: string;
  file: File;
  url: string; // 用於預覽的 URL
  base64: string; // Base64 編碼
  mimeType: SupportedImageType;
  size: number;
}
