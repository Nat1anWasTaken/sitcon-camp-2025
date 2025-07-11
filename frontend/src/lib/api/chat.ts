import {
  ChatRequest,
  ParsedSSEData,
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
} from "../types/api";

/**
 * SSE 事件解析器
 */
export class SSEParser {
  /**
   * 解析 SSE 資料塊
   * @param chunk 原始文字資料
   * @returns 解析後的事件陣列
   */
  static parseSSEChunk(chunk: string): ParsedSSEData[] {
    const events: ParsedSSEData[] = [];

    // 按空行分割事件
    const eventBlocks = chunk.split("\n\n").filter((block) => block.trim());

    for (const block of eventBlocks) {
      const lines = block.split("\n");
      let eventType: SSEEventType | null = null;
      let data = "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          eventType = line.substring(7).trim() as SSEEventType;
        } else if (line.startsWith("data: ")) {
          data = line.substring(6).trim();
        }
      }

      if (eventType && data) {
        try {
          const parsedData = JSON.parse(data) as SSEEvent;
          events.push({
            eventType: eventType,
            data: parsedData,
          });
        } catch (error) {
          console.error("Failed to parse SSE data:", error, data);
        }
      }
    }

    return events;
  }
}

/**
 * SSE 連接管理器
 */
export class SSEConnection {
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private decoder = new TextDecoder();
  private state: SSEConnectionState = "disconnected";
  private handlers: SSEEventHandlers = {};
  private config: SSEConfig;
  private buffer = ""; // 用於存儲不完整的數據

  constructor(handlers: SSEEventHandlers = {}, config: SSEConfig = {}) {
    this.handlers = handlers;
    this.config = {
      reconnect: false,
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  /**
   * 開始處理 SSE 流
   * @param stream ReadableStream
   */
  async processStream(stream: ReadableStream<Uint8Array>): Promise<void> {
    this.reader = stream.getReader();
    this.state = "connecting";

    try {
      while (true) {
        const { done, value } = await this.reader.read();

        if (done) {
          this.state = "disconnected";
          break;
        }

        const chunk = this.decoder.decode(value, { stream: true });
        console.log("收到的原始數據塊:", chunk);

        // 將新的數據添加到緩衝區
        this.buffer += chunk;

        // 處理緩衝區中的完整事件
        this.processBuffer();
      }
    } catch (error) {
      this.state = "error";
      console.error("SSE connection error:", error);

      // 觸發錯誤事件
      if (this.handlers.onError) {
        this.handlers.onError({
          type: "error" as const,
          status: "error" as const,
          message: error instanceof Error ? error.message : "連接錯誤",
          error_type:
            error instanceof Error ? error.constructor.name : "UnknownError",
        });
      }
    } finally {
      this.cleanup();
    }
  }

  /**
   * 處理緩衝區中的完整事件
   */
  private processBuffer(): void {
    while (true) {
      // 查找完整的事件（以 \n\n 分隔）
      const eventEndIndex = this.buffer.indexOf("\n\n");
      if (eventEndIndex === -1) {
        // 沒有完整的事件，等待更多數據
        break;
      }

      // 提取完整的事件
      const eventData = this.buffer.substring(0, eventEndIndex);
      this.buffer = this.buffer.substring(eventEndIndex + 2);

      // 解析事件
      const event = this.parseEvent(eventData);
      if (event) {
        console.log("解析出的事件:", event);
        this.handleEvent(event.eventType, event.data);
      }
    }
  }

  /**
   * 解析單個事件
   * @param eventData 事件數據
   * @returns 解析後的事件
   */
  private parseEvent(eventData: string): ParsedSSEData | null {
    const lines = eventData.split("\n");
    let eventType: SSEEventType | null = null;
    let data = "";

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        eventType = line.substring(7).trim() as SSEEventType;
      } else if (line.startsWith("data: ")) {
        data = line.substring(6).trim();
      }
    }

    if (eventType && data) {
      try {
        const parsedData = JSON.parse(data) as SSEEvent;
        return {
          eventType: eventType,
          data: parsedData,
        };
      } catch (error) {
        console.error("Failed to parse SSE data:", error, data);
      }
    }

    return null;
  }

  /**
   * 處理 SSE 事件
   * @param eventType 事件類型
   * @param data 事件資料
   */
  private handleEvent(eventType: SSEEventType, data: SSEEvent): void {
    this.state = "connected";

    switch (eventType) {
      case "connected":
        this.handlers.onConnected?.(data as SSEConnectedEvent);
        break;
      case "message":
        this.handlers.onMessage?.(data as SSEMessageEvent);
        break;
      case "tool_call":
        this.handlers.onToolCall?.(data as SSEToolCallEvent);
        break;
      case "done":
        this.handlers.onDone?.(data as SSEDoneEvent);
        this.state = "disconnected";
        break;
      case "error":
        this.handlers.onError?.(data as SSEErrorEvent);
        this.state = "error";
        break;
      default:
        console.warn("Unknown SSE event type:", eventType);
    }
  }

  /**
   * 關閉連接
   */
  async close(): Promise<void> {
    this.cleanup();
  }

  /**
   * 清理資源
   */
  private cleanup(): void {
    if (this.reader) {
      this.reader.releaseLock();
      this.reader = null;
    }
    this.buffer = ""; // 清空緩衝區
    this.state = "disconnected";
  }

  /**
   * 獲取當前連接狀態
   */
  getState(): SSEConnectionState {
    return this.state;
  }
}

/**
 * 聊天相關 API 方法
 */
export class ChatApi {
  /**
   * 發送聊天訊息並使用事件處理器處理回應
   * @param chatRequest 聊天請求
   * @param handlers SSE 事件處理器
   * @param config SSE 配置
   * @returns SSE 連接實例
   */
  static async sendMessage(
    chatRequest: ChatRequest,
    handlers: SSEEventHandlers = {},
    config: SSEConfig = {}
  ): Promise<SSEConnection> {
    const stream = await this.sendMessageStream(chatRequest);

    if (!stream) {
      throw new Error("無法獲取回應流");
    }

    const connection = new SSEConnection(handlers, config);

    // 在背景處理流
    connection.processStream(stream).catch((error) => {
      console.error("處理 SSE 流時發生錯誤:", error);
    });

    return connection;
  }

  /**
   * 發送聊天訊息並返回原始串流響應（內部使用）
   * @param chatRequest 聊天請求包含歷史訊息和當前訊息
   * @returns ReadableStream 用於接收串流回應
   */
  private static async sendMessageStream(
    chatRequest: ChatRequest
  ): Promise<ReadableStream<Uint8Array> | null> {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    // 從 localStorage 獲取 token
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;

    try {
      const response = await fetch(`${baseURL}/chat/siri`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
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
