import { useState, useCallback } from 'react';

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  retries?: number;
  retryDelayMs?: number;
}

export function useApiRequest<T = any>(url: string, options?: ApiRequestOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    let attempts = 0;
    const maxRetries = options?.retries ?? 2;
    const retryDelay = options?.retryDelayMs ?? 1000;
    while (attempts <= maxRetries) {
      try {
        const res = await fetch(url, {
          method: options?.method || 'GET',
          headers: options?.headers,
          body: options?.body ? JSON.stringify(options.body) : undefined,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
        setLoading(false);
        return;
      } catch (err) {
        attempts++;
        if (attempts > maxRetries) {
          setError(err as Error);
          setLoading(false);
          return;
        }
        await new Promise((r) => setTimeout(r, retryDelay));
      }
    }
  }, [url, JSON.stringify(options)]);

  return { data, loading, error, fetchData };
} 