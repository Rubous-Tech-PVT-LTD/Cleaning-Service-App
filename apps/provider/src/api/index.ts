import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_URL = 'http://192.168.0.199:3000/v1';
export const SOCKET_URL = 'http://192.168.0.199:3000';

async function request(method: string, endpoint: string, data?: any) {
  const token = await AsyncStorage.getItem('provider_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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
  try {
    responseData = JSON.parse(text);
  } catch {}

  if (!response.ok) {
    const error: any = new Error(responseData?.message || 'Request failed');
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
  delete: (endpoint: string) => request('DELETE', endpoint),
};

export default api;
