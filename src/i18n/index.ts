import { Storage } from '@/services/storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import vi from './locales/vi';
import zh from './locales/zh';

const LANGUAGE_STORAGE_KEY = 'app_language';

export const SUPPORTED_LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

const resources = {
  vi: { translation: vi },
  en: { translation: en },
  zh: { translation: zh },
};

function getDeviceLanguage(): LanguageCode {
  const locale = Localization.getLocales()[0]?.languageCode ?? 'vi';
  if (locale.startsWith('zh')) return 'zh';
  if (locale.startsWith('en')) return 'en';
  return 'vi';
}

export async function loadSavedLanguage(): Promise<LanguageCode> {
  const saved = await Storage.getItem(LANGUAGE_STORAGE_KEY);
  if (saved && ['vi', 'en', 'zh'].includes(saved)) {
    return saved as LanguageCode;
  }
  return getDeviceLanguage();
}

export async function changeLanguage(lang: LanguageCode): Promise<void> {
  await Storage.setItem(LANGUAGE_STORAGE_KEY, lang);
  await i18n.changeLanguage(lang);
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'vi',
  fallbackLng: 'vi',
  interpolation: {
    escapeValue: false,
  },
});

// Load saved language asynchronously
loadSavedLanguage().then((lang) => {
  i18n.changeLanguage(lang);
});

export default i18n;
