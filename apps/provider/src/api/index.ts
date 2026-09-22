import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenStorage } from '../utils/tokenStorage';

export const BASE_URL = 'http://192.168.198.209:3000/v1';
export const SOCKET_URL = 'http://192.168.198.209:3000';

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const EXCLUDED_FROM_REFRESH = ['/auth/otp/request', '/auth/otp/verify', '/auth/refresh', '/auth/logout'];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) {
    
    throw new Error('No refresh token available');
  }

 

  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  

  if (!response.ok) {
    const errorText = await response.text();
    
    throw new Error(`Refresh failed: ${response.status}`);
  }

  const data = await response.json();


  const newAccessToken = data.accessToken;
  const newRefreshToken = data.refreshToken;

  await tokenStorage.setAccessToken(newAccessToken);
  await tokenStorage.setRefreshToken(newRefreshToken);

  return newAccessToken;
}

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

async function request(method: string, endpoint: string, data?: any): Promise<{ data: any; status: number }> {
  const token = await tokenStorage.getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
    'ngrok-skip-browser-warning': 'true',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const fullUrl = `${BASE_URL}${endpoint}`;
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
    } catch {}

    if (response.status === 401 && !EXCLUDED_FROM_REFRESH.some(path => endpoint.includes(path))) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(async (newToken: string) => {
            try {
              const retryResponse = await request(method, endpoint, data);
              resolve(retryResponse);
            } catch (error) {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        onTokenRefreshed(newToken);
        return request(method, endpoint, data);
      } catch (error) {
        isRefreshing = false;
        await tokenStorage.clearTokens();
        await AsyncStorage.removeItem('provider_id');
        throw error;
      }
    }

    if (!response.ok) {
      const error: any = new Error('Request failed');
      error.response = { data: responseData, status: response.status };
      throw error;
    }
    return { data: responseData, status: response.status };
  } catch (err: any) {
    if (err?.message?.includes('NONE') || err?.message?.includes('read-only')) {
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
};
export default api;
