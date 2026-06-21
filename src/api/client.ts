const BASE_URL = '/api';

const request = async <T>(
  method: string,
  url: string,
  body?: unknown,
  params?: Record<string, unknown>
): Promise<T> => {
  const queryString = params
    ? '?' + new URLSearchParams(params as Record<string, string>).toString()
    : '';

  const response = await fetch(`${BASE_URL}${url}${queryString}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && typeof errorData === 'object' && 'message' in errorData) {
        errorMessage = String(errorData.message);
      }
    } catch {
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as T;
};

export const apiGet = <T>(url: string, params?: Record<string, unknown>): Promise<T> =>
  request<T>('GET', url, undefined, params);

export const apiPost = <T>(url: string, body?: unknown): Promise<T> =>
  request<T>('POST', url, body);

export const apiPatch = <T>(url: string, body?: unknown): Promise<T> =>
  request<T>('PATCH', url, body);

export const apiDelete = <T>(url: string): Promise<T> =>
  request<T>('DELETE', url);
