import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'provider_access_token';
const REFRESH_TOKEN_KEY = 'provider_refresh_token';

export const tokenStorage = {
  async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },

  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};