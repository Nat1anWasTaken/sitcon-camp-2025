// API 主要入口檔案
import { AuthApi } from "./auth";
import { ChatApi } from "./chat";
import { GeneralApi } from "./general";
import { httpClient } from "./http-client";

// 重新匯出
export { AuthApi } from "./auth";
export { ChatApi } from "./chat";
export { GeneralApi } from "./general";

// 重新匯出型別
export type {
  ApiEndpoints,
  ApiResponse,
  ChatMessage,
  ChatRequest,
  HttpMethod,
  HTTPValidationError,
  LoginCredentials,
  RequestConfig,
  Token,
  UserCreate,
  UserResponse,
  ValidationError,
} from "../types/api";

export { ApiError } from "../types/api";

// 便利的 API 實例
export const api = {
  auth: AuthApi,
  chat: ChatApi,
  general: GeneralApi,
  client: httpClient,
} as const;

// 預設匯出 API 實例
export default api;
