import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: '@edulink_token',
  USER: '@edulink_user',
};

export const storage = {
  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.TOKEN);
  },

  async setToken(token: string): Promise<void> {
    return AsyncStorage.setItem(KEYS.TOKEN, token);
  },

  async removeToken(): Promise<void> {
    return AsyncStorage.removeItem(KEYS.TOKEN);
  },

  async getUser(): Promise<any | null> {
    const raw = await AsyncStorage.getItem(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  },

  async setUser(user: any): Promise<void> {
    return AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  async removeUser(): Promise<void> {
    return AsyncStorage.removeItem(KEYS.USER);
  },

  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([KEYS.TOKEN, KEYS.USER]);
  },
};
