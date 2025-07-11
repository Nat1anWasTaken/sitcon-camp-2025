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
  preferences?: Record<string, unknown>;
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
  chat: "/chat/siri";

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

// 工具調用資訊（移到這裡以便重用）
export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result: string;
}

// 統一的聊天訊息類型
export interface ChatMessage {
  id?: string; // 內部使用的唯一識別符（可選，用於 SSE 訊息）
  role: string; // user, assistant, system
  content: string | MessageContent[]; // 支援純文字或複合內容
  timestamp?: string | null;
  type?: "message" | "tool_call";
  toolCall?: ToolCall; // 引用統一的 ToolCall 類型
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

// ============== 聯絡人相關型別 ==============

// 聯絡人資料型別
export interface Contact {
  id: number;
  name: string;
  description?: string | null;
  avatar_key?: string | null;
  user_id: number;
  created_at: string;
  updated_at: string;
}

// 創建聊絡人請求
export interface ContactCreate {
  name: string;
  description?: string | null;
}

// 更新聯絡人請求
export interface ContactUpdate {
  name?: string;
  description?: string | null;
}

// 聯絡人列表響應
export interface ContactListResponse {
  contacts: Contact[];
  total: number;
  page: number;
  size: number;
}

// 聯絡人查詢參數
export interface ContactQueryParams {
  skip?: number;
  limit?: number;
  search?: string;
}

// 頭像上傳響應
export interface AvatarUploadResponse {
  filename: string;
  url: string;
  size: number;
  content_type: string;
}

// 支援的頭像文件格式
export const SUPPORTED_AVATAR_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export type SupportedAvatarType = (typeof SUPPORTED_AVATAR_TYPES)[number];

// 頭像上傳配置
export interface AvatarUploadConfig {
  maxFileSize: number; // 5MB
  supportedTypes: readonly string[];
  targetSize: { width: number; height: number }; // 512x512
}

// 聯絡人 API 端點常數
export const CONTACT_ENDPOINTS = {
  contacts: "/contacts/",
  contactsWithAvatar: "/contacts/with-avatar",
  contactById: (id: number) => `/contacts/${id}`,
  contactAvatar: (id: number) => `/contacts/${id}/avatar`,
  contactAvatarImage: (id: number) => `/contacts/${id}/avatar/image`,
} as const;

// ============== SSE 聊天事件相關型別 ==============

// SSE 事件類型
export type SSEEventType =
  | "connected"
  | "message"
  | "tool_call"
  | "done"
  | "error";

// 工具調用資訊已移至 Chat 相關型別區域

// SSE 事件資料基礎介面
export interface SSEEventBase {
  type: SSEEventType;
  timestamp?: string;
}

// 連接事件
export interface SSEConnectedEvent extends SSEEventBase {
  type: "connected";
  status: "connected";
  message: string;
}

// 文字訊息事件
export interface SSEMessageEvent extends SSEEventBase {
  type: "message";
  content: string;
  tool_call: null;
  timestamp: string;
}

// 工具調用事件
export interface SSEToolCallEvent extends SSEEventBase {
  type: "tool_call";
  content: string;
  tool_call: ToolCall;
  timestamp: string;
}

// 完成事件
export interface SSEDoneEvent extends SSEEventBase {
  type: "done";
  status: "completed";
  message: string;
}

// 錯誤事件
export interface SSEErrorEvent extends SSEEventBase {
  type: "error";
  status: "error";
  message: string;
  error_type?: string;
}

// 統一的 SSE 事件類型
export type SSEEvent =
  | SSEConnectedEvent
  | SSEMessageEvent
  | SSEToolCallEvent
  | SSEDoneEvent
  | SSEErrorEvent;

// SSE 事件處理器介面
export interface SSEEventHandlers {
  onConnected?: (event: SSEConnectedEvent) => void;
  onMessage?: (event: SSEMessageEvent) => void;
  onToolCall?: (event: SSEToolCallEvent) => void;
  onDone?: (event: SSEDoneEvent) => void;
  onError?: (event: SSEErrorEvent) => void;
}

// SSE 連接配置
export interface SSEConfig {
  reconnect?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

// SSE 連接狀態
export type SSEConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

// 解析後的 SSE 資料
export interface ParsedSSEData {
  eventType: SSEEventType;
  data: SSEEvent;
}

// ============== 記錄相關型別 ==============

// 記錄分類枚舉
export type RecordCategory =
  | "Communications"
  | "Nicknames"
  | "Memories"
  | "Preferences"
  | "Plan"
  | "Other";

// 記錄資料型別
export interface ContactRecord {
  id: number;
  category: RecordCategory;
  content: string;
  contact_id: number;
  created_at: string;
  updated_at: string | null;
}

// 創建記錄請求
export interface RecordCreate {
  category: RecordCategory;
  content: string;
  contact_id: number;
}

// 更新記錄請求
export interface RecordUpdate {
  category?: RecordCategory;
  content?: string;
}

// 記錄列表響應
export interface RecordListResponse {
  records: ContactRecord[];
  total: number;
  page: number;
  size: number;
}

// 記錄查詢參數
export interface RecordQueryParams {
  skip?: number;
  limit?: number;
  contact_id?: number;
  category?: RecordCategory;
  search?: string;
}

// 記錄 API 端點常數
export const RECORD_ENDPOINTS = {
  records: "/records/",
  recordById: (id: number) => `/records/${id}`,
  recordsByContact: (contactId: number) => `/records/by-contact/${contactId}`,
  categories: "/records/categories/",
} as const;

export interface PasswordUpdateRequest {
  old_password: string;
  new_password: string;
}

export interface PreferencesUpdateRequest {
  preferences: Record<string, unknown>;
}

export interface MessageResponse {
  message: string;
}
