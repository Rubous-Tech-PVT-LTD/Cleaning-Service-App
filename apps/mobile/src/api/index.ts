import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenStorage } from '../utils/tokenStorage';

const BASE_URL = 'http://192.168.156.209:3000/v1';
export const SOCKET_URL = 'http://192.168.156.209:3000';

let isRefreshing = false;
let refreshSubscribers: Array<() => void> = [];

const EXCLUDED_FROM_REFRESH = ['/auth/otp/request', '/auth/otp/verify', '/auth/refresh', '/auth/logout'];

function subscribeTokenRefresh(callback: () => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed() {
  refreshSubscribers.forEach(callback => callback());
  refreshSubscribers = [];
}

async function refreshAccessToken(): Promise<void> {
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
    throw new Error('Refresh failed');
  }

  const data = await response.json();
  const newAccessToken = data.accessToken;
  const newRefreshToken = data.refreshToken;

  await tokenStorage.setAccessToken(newAccessToken);
  await tokenStorage.setRefreshToken(newRefreshToken);
}

async function request(method: string, endpoint: string, data?: any): Promise<{ data: any; status: number }> {
  const token = await tokenStorage.getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const text = await response.text();
  let responseData: any = text;
  try { responseData = JSON.parse(text); } catch (e) {}

  if (response.status === 401 && !EXCLUDED_FROM_REFRESH.some(path => endpoint.includes(path))) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(async () => {
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
      await refreshAccessToken();
      isRefreshing = false;
      onTokenRefreshed();
      return request(method, endpoint, data);
    } catch (error) {
      isRefreshing = false;
      await tokenStorage.clearTokens();
      await AsyncStorage.multiRemove(['user_id', 'guest_mode', 'push_token', 'user_phone', 'user_name', 'applied_coupon']);
      throw error;
    }
  }

  if (!response.ok) {
    const error: any = new Error('Request failed');
    error.response = { data: responseData, status: response.status };
    throw error;
  }

  return { data: responseData, status: response.status };
}

const api = {
  get: (endpoint: string) => request('GET', endpoint),
  post: (endpoint: string, data?: any) => request('POST', endpoint, data),
  put: (endpoint: string, data?: any) => request('PUT', endpoint, data),
  patch: (endpoint: string, data?: any) => request('PATCH', endpoint, data),
  delete: (endpoint: string, data?: any) => request('DELETE', endpoint, data),
};

export const categoryApi = {
  getSubcategories: (categoryId: string) => 
    api.get(`/categories/${categoryId}/subcategories`),
  getServices: (categoryId: string) => 
    api.get(`/categories/${categoryId}/services`),
};

export const subcategoryApi = {
  getServices: (subcategoryId: string) => 
    api.get(`/subcategories/${subcategoryId}/services`),
};

export default api;
