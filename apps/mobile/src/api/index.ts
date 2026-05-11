import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://10.0.2.2:3000/v1';
console.log('📡 [API] Using Fetch API Wrapper to bypass Axios Event.NONE bug');

async function request(method: string, endpoint: string, data?: any) {
  const token = await AsyncStorage.getItem('user_token');
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
  delete: (endpoint: string) => request('DELETE', endpoint),
  // For backwards compatibility where `api.interceptors` is accessed, return a dummy object
  interceptors: { request: { use: () => {} } }
};

export default api;
