import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Options for WebSocket connection type.
 * @template T The expected data type from the message.
 */
interface WebSocketOptions<T> {
  type: 'websocket';
  url: string;
  onMessage: (data: T) => void;
  onError?: (error: Event) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  enabled?: boolean;
}

/**
 * Options for polling connection type.
 * @template T The expected data type from the fetch response.
 */
interface PollingOptions<T> {
  type: 'polling';
  url: string;
  interval?: number;
  onMessage: (data: T) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

/**
 * Discriminated union for the hook's options.
 * @template T The expected data type.
 */
type UseRealTimeUpdatesOptions<T> = WebSocketOptions<T> | PollingOptions<T>;

/**
 * The return type of the useRealTimeUpdates hook.
 * @template T The data type being managed.
 */
interface UseRealTimeUpdatesReturn<T> {
  /** The most recent data received. Null if no data has been received yet. */
  data: T | null;
  /** A boolean indicating if the connection is currently active. */
  isConnected: boolean;
  /** The last error that occurred, if any. */
  error: Error | Event | null;
  /** A function to send data through the WebSocket. Throws an error if used with 'polling' type. */
  sendMessage: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
}

/**
 * A custom React hook to manage a WebSocket connection or a polling interval for live data updates.
 * It abstracts the connection logic, state management, and cleanup.
 *
 * @template T The expected type of the data to be received.
 * @param {UseRealTimeUpdatesOptions<T>} options Configuration object for the hook.
 * @returns {UseRealTimeUpdatesReturn<T>} An object containing the latest data, connection status, errors, and a function to send messages.
 */
export const useRealTimeUpdates = <T>(
  options: UseRealTimeUpdatesOptions<T>
): UseRealTimeUpdatesReturn<T> => {
  const { type, url, enabled = true } = options;

  const [data, setData] = useState<T | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<Error | Event | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const optionsRef = useRef(options);

  // Keep the options ref up-to-date with the latest callbacks without re-triggering the effect
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (!enabled || !url) {
      return;
    }

    // Reset state on parameter change
    setIsConnected(false);
    setError(null);

    if (type === 'websocket') {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = (event) => {
        console.log('WebSocket connection established');
        setIsConnected(true);
        optionsRef.current.type === 'websocket' && optionsRef.current.onOpen?.(event);
      };

      ws.onmessage = (event) => {
        try {
          const parsedData: T = JSON.parse(event.data);
          setData(parsedData);
          optionsRef.current.onMessage(parsedData);
        } catch (e) {
          const parseError = new Error('Failed to parse incoming WebSocket message.');
          setError(parseError);
          optionsRef.current.type === 'websocket' && optionsRef.current.onError?.(parseError as any);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError(event);
        setIsConnected(false);
        optionsRef.current.type === 'websocket' && optionsRef.current.onError?.(event);
      };

      ws.onclose = (event) => {
        console.log('WebSocket connection closed');
        setIsConnected(false);
        // Avoid firing onClose for clean dismounts if not intended
        if (!event.wasClean) {
            optionsRef.current.type === 'websocket' && optionsRef.current.onClose?.(event);
        }
        wsRef.current = null;
      };

      return () => {
        ws.close();
      };
    } else if (type === 'polling') {
      const { interval = 5000 } = options;
      let isCancelled = false;

      const poll = async () => {
        if (isCancelled) return;
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const responseData: T = await response.json();
          if (!isCancelled) {
            setData(responseData);
            optionsRef.current.onMessage(responseData);
            if (!isConnected) setIsConnected(true); // Set connected on first successful poll
            if (error) setError(null); // Clear previous errors on success
          }
        } catch (e) {
          if (!isCancelled) {
            const fetchError = e instanceof Error ? e : new Error('An unknown polling error occurred.');
            setError(fetchError);
            setIsConnected(false);
            optionsRef.current.type === 'polling' && optionsRef.current.onError?.(fetchError);
          }
        }
      };

      poll(); // Initial fetch
      const intervalId = setInterval(poll, interval);

      return () => {
        isCancelled = true;
        clearInterval(intervalId);
        setIsConnected(false);
      };
    }
  }, [enabled, url, type, (options as PollingOptions<T>).interval]);

  const sendMessage = useCallback(
    (message: string | ArrayBufferLike | Blob | ArrayBufferView) => {
      if (options.type !== 'websocket') {
        throw new Error("sendMessage is only available for 'websocket' type.");
      }
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(message);
      } else {
        console.error('WebSocket is not connected or ready.');
      }
    },
    [options.type]
  );

  return { data, isConnected, error, sendMessage };
};