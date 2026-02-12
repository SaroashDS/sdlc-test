import { z } from 'zod';

/**
 * @interface ISocketServiceConfig
 * @description Configuration options for the SocketService.
 */
export interface ISocketServiceConfig {
  url: string;
  protocols?: string | string[];
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

/**
 * @interface ISocketMessage
 * @description Defines the structure for messages sent and received via the WebSocket.
 * @template T - The type of the payload.
 */
export interface ISocketMessage<T = any> {
  type: string;
  payload: T;
  timestamp: number;
}

/**
 * @type MessageHandler
 * @description Type definition for a function that handles incoming socket messages.
 * @template T - The type of the message payload.
 */
export type MessageHandler<T = any> = (payload: T) => void;

// Using Zod for robust runtime validation of incoming messages
const SocketMessageSchema = z.object({
  type: z.string(),
  payload: z.unknown(),
  timestamp: z.number(),
});

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * @class SocketService
 * @description Manages a single, shared WebSocket client connection for the application.
 * This service is implemented as a singleton.
 */
class SocketService {
  private static instance: SocketService;

  private socket: WebSocket | null = null;
  private config: ISocketServiceConfig | null = null;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;

  // A map to store message handlers, where the key is the message type.
  private readonly messageHandlers: Map<string, Set<MessageHandler>> = new Map();

  private connectionPromise: {
    resolve: (value: void | PromiseLike<void>) => void;
    reject: (reason?: any) => void;
  } | null = null;

  /**
   * The constructor is private to enforce the singleton pattern.
   * @private
   */
  private constructor() {}

  /**
   * Gets the singleton instance of the SocketService.
   * @returns {SocketService} The singleton instance.
   */
  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  /**
   * Establishes a connection to the WebSocket server.
   * Returns a promise that resolves upon successful connection or rejects on failure.
   * @param {ISocketServiceConfig} config - The configuration for the WebSocket connection.
   * @returns {Promise<void>} A promise that resolves when the connection is open.
   */
  public async connect(config: ISocketServiceConfig): Promise<void> {
    if (this.socket && this.socket.readyState < 2) {
      console.warn('[SocketService] A connection is already open or connecting.');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.config = {
          reconnect: true,
          reconnectInterval: 5000,
          maxReconnectAttempts: 10,
          ...config,
        };
        this.status = 'connecting';
        this.connectionPromise = { resolve, reject };

        console.log(`[SocketService] Connecting to ${this.config.url}...`);
        this.socket = new WebSocket(this.config.url, this.config.protocols);
        this.setupEventListeners();
      } catch (error) {
        console.error('[SocketService] Failed to initiate connection:', error);
        this.status = 'error';
        this.connectionPromise = null;
        reject(error);
      }
    });
  }

  /**
   * Disconnects from the WebSocket server.
   * @returns {void}
   */
  public disconnect(): void {
    if (!this.socket) {
      console.warn('[SocketService] No active connection to disconnect.');
      return;
    }
    // Prevent automatic reconnection when explicitly disconnecting
    if (this.config) {
      this.config.reconnect = false;
    }
    this.socket.close(1000, 'Client initiated disconnect.');
    console.log('[SocketService] Disconnecting...');
  }

  /**
   * Sends a message to the WebSocket server.
   * @template T - The type of the payload.
   * @param {string} type - The type of the message, used for routing on the server and client.
   * @param {T} payload - The data to be sent.
   * @throws {Error} If the socket is not connected.
   */
  public send<T>(type: string, payload: T): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('[SocketService] Cannot send message. WebSocket is not connected.');
    }

    const message: ISocketMessage<T> = {
      type,
      payload,
      timestamp: Date.now(),
    };

    try {
      this.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error('[SocketService] Error sending message:', error);
    }
  }

  /**
   * Subscribes a handler function to a specific message type.
   * @template T - The expected type of the payload for this message type.
   * @param {string} type - The message type to listen for.
   * @param {MessageHandler<T>} handler - The function to execute when a message of the given type is received.
   * @returns {() => void} A function to unsubscribe the handler.
   */
  public on<T>(type: string, handler: MessageHandler<T>): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);

    // Return an unsubscribe function
    return () => this.off(type, handler);
  }

  /**
   * Unsubscribes a handler function from a specific message type.
   * @template T - The type of the payload.
   * @param {string} type - The message type to unsubscribe from.
   * @param {MessageHandler<T>} handler - The specific handler function to remove.
   */
  public off<T>(type: string, handler: MessageHandler<T>): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.messageHandlers.delete(type);
      }
    }
  }

  /**
   * Gets the current connection status.
   * @returns {ConnectionStatus} The current status of the WebSocket connection.
   */
  public getConnectionStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Sets up the event listeners for the WebSocket instance.
   * @private
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.onopen = this.handleOpen.bind(this);
    this.socket.onmessage = this.handleMessage.bind(this);
    this.socket.onclose = this.handleClose.bind(this);
    this.socket.onerror = this.handleError.bind(this);
  }

  /**
   * Handles the 'open' event of the WebSocket.
   * @private
   */
  private handleOpen(): void {
    console.log('[SocketService] Connection established.');
    this.status = 'connected';
    this.reconnectAttempts = 0;
    if (this.connectionPromise) {
      this.connectionPromise.resolve();
      this.connectionPromise = null;
    }
  }

  /**
   * Handles the 'message' event of the WebSocket.
   * Parses the message and dispatches it to the appropriate handlers.
   * @param {MessageEvent} event - The message event from the WebSocket.
   * @private
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const parsedData = JSON.parse(event.data);
      const validationResult = SocketMessageSchema.safeParse(parsedData);

      if (!validationResult.success) {
        console.warn('[SocketService] Received malformed message:', validationResult.error.issues);
        return;
      }

      const message: ISocketMessage = validationResult.data;
      const handlers = this.messageHandlers.get(message.type);

      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message.payload);
          } catch (error) {
            console.error(`[SocketService] Error in message handler for type "${message.type}":`, error);
          }
        });
      }
    } catch (error) {
      console.error('[SocketService] Error parsing incoming message:', error);
    }
  }

  /**
   * Handles the 'close' event of the WebSocket.
   * Attempts to reconnect if configured to do so.
   * @param {CloseEvent} event - The close event from the WebSocket.
   * @private
   */
  private handleClose(event: CloseEvent): void {
    console.log(`[SocketService] Connection closed. Code: ${event.code}, Reason: ${event.reason}`);
    this.status = 'disconnected';
    this.socket = null;

    if (this.config?.reconnect) {
      this.attemptReconnect();
    }
  }

  /**
   * Handles the 'error' event of the WebSocket.
   * @param {Event} event - The error event from the WebSocket.
   * @private
   */
  private handleError(event: Event): void {
    console.error('[SocketService] WebSocket error:', event);
    this.status = 'error';
    if (this.connectionPromise) {
      this.connectionPromise.reject(new Error('WebSocket connection failed.'));
      this.connectionPromise = null;
    }
  }

  /**
   * Manages the reconnection logic with exponential backoff.
   * @private
   */
  private attemptReconnect(): void {
    if (!this.config || !this.config.reconnect) return;

    const { maxReconnectAttempts = 10, reconnectInterval = 5000 } = this.config;

    if (this.reconnectAttempts < maxReconnectAttempts) {
      this.reconnectAttempts++;
      const timeout = reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`[SocketService] Attempting to reconnect in ${timeout / 1000}s... (Attempt ${this.reconnectAttempts}/${maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect(this.config!);
      }, timeout);
    } else {
      console.error(`[SocketService] Max reconnect attempts (${maxReconnectAttempts}) reached. Giving up.`);
    }
  }
}

// Export the singleton instance
export const socketService = SocketService.getInstance();