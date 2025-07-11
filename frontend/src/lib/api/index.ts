// API 主要入口檔案
import { AuthApi } from "./auth";
import { ChatApi } from "./chat";
import { ContactApi } from "./contact";
import { GeneralApi } from "./general";
import { httpClient } from "./http-client";
import { RecordsApi } from "./records";

// 重新匯出 API 類
export { AuthApi } from "./auth";
export { ChatApi, SSEConnection, SSEParser } from "./chat";
export { ContactApi } from "./contact";
export { GeneralApi } from "./general";
export { RecordsApi } from "./records";

// 重新匯出 hooks
export { useAuth } from "./hooks/use-auth";
export { useChat } from "./hooks/use-chat";
export { useContact } from "./hooks/use-contact";
export {
  useBatchDeleteRecords,
  useCreateRecord,
  useDeleteRecord,
  useRecord,
  useRecordCategories,
  useRecords,
  useRecordsByContact,
  useUpdateRecord,
} from "./hooks/use-records";

// 重新匯出型別
export type {
  ApiEndpoints,
  ApiResponse,
  AvatarUploadConfig,
  AvatarUploadResponse,
  ChatMessage,
  ChatRequest,
  Contact,
  ContactCreate,
  ContactListResponse,
  ContactQueryParams,
  ContactRecord,
  ContactUpdate,
  HttpMethod,
  HTTPValidationError,
  LoginCredentials,
  ParsedSSEData,
  RecordCategory,
  RecordCreate,
  RecordListResponse,
  RecordQueryParams,
  RecordUpdate,
  RequestConfig,
  SSEConfig,
  SSEConnectedEvent,
  SSEConnectionState,
  SSEDoneEvent,
  SSEErrorEvent,
  SSEEvent,
  SSEEventHandlers,
  SSEEventType,
  SSEMessageEvent,
  SSEToolCallEvent,
  SupportedAvatarType,
  Token,
  ToolCall,
  UserCreate,
  UserResponse,
  ValidationError,
} from "../types/api";

export {
  ApiError,
  CONTACT_ENDPOINTS,
  RECORD_ENDPOINTS,
  SUPPORTED_AVATAR_TYPES,
} from "../types/api";

// 重新匯出所有 hooks (for convenience)
export * from "./hooks";

// 便利的 API 實例
export const api = {
  auth: AuthApi,
  chat: ChatApi,
  contact: ContactApi,
  records: RecordsApi,
  general: GeneralApi,
  client: httpClient,
} as const;

// 預設匯出 API 實例
export default api;
