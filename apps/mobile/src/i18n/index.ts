import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en.json';
import hi from './hi.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
};

const LANGUAGE_KEY = 'user-language';

const initI18n = async () => {
  const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLanguage || 'en', // Default to English
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
};

initI18n();

export default i18n;
