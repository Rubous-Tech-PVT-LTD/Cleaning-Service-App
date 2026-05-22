import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ Direct local IP — no tunnel needed (same WiFi)
export const BASE_URL = 'http://192.168.0.200:3000/v1';
export const SOCKET_URL = 'http://192.168.0.200:3000';

/**
 * XHR-based request - avoids the Hermes Event.NONE crash that fetch() triggers
 * on physical Android devices.
 */
function xhrRequest(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: string,
): Promise<{ ok: boolean; status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.timeout = 20000;
    Object.keys(headers).forEach((k) => xhr.setRequestHeader(k, headers[k]));
    xhr.onload = () =>
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        text: xhr.responseText,
      });
    xhr.onerror = () => reject(new Error(`Network error reaching ${url}`));
    xhr.ontimeout = () => reject(new Error(`Request timed out (20s)`));
    xhr.send(body || null);
  });
}

async function request(method: string, endpoint: string, data?: any) {
  const token = await AsyncStorage.getItem('provider_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
    'ngrok-skip-browser-warning': 'true',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fullUrl = `${BASE_URL}${endpoint}`;
  console.log(`📡 [API Request] ${method} ${fullUrl}`);

  try {
    const response = await xhrRequest(
      method,
      fullUrl,
      headers,
      data ? JSON.stringify(data) : undefined,
    );

    let responseData: any = response.text;
    try {
      responseData = JSON.parse(response.text);
    } catch (e) {}

    if (!response.ok) {
      const error: any = new Error('Request failed');
      error.response = { data: responseData, status: response.status };
      throw error;
    }

    return { data: responseData, status: response.status };
  } catch (err: any) {
    // Hermes Event.NONE bug: the request may have succeeded on the server
    // but threw during internal event cleanup. Re-throw a user-friendly message.
    if (err?.message?.includes('NONE') || err?.message?.includes('read-only')) {
      console.warn('[API] Caught Hermes NONE bug during XHR — request may have succeeded.');
      throw new Error('Connection interrupted (Hermes bug). Please try again.');
    }
    throw err;
  }
}

const api = {
  get: (endpoint: string) => request('GET', endpoint),
  post: (endpoint: string, data?: any) => request('POST', endpoint, data),
  put: (endpoint: string, data?: any) => request('PUT', endpoint, data),
  patch: (endpoint: string, data?: any) => request('PATCH', endpoint, data),
  delete: (endpoint: string) => request('DELETE', endpoint),
  interceptors: { request: { use: () => {} } },
};

export default api;
