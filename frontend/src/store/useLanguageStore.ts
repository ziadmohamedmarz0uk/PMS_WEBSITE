import { create } from 'zustand';
import Cookies from 'js-cookie';

export type Language = 'en' | 'ar';

interface LanguageState {
    language: Language;
    setLanguage: (lang: Language) => void;
}

const getInitialLanguage = (): Language => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('app_language') as Language;
        if (stored === 'en' || stored === 'ar') return stored;
    }
    return 'en'; // Default
};

export const useLanguageStore = create<LanguageState>((set) => ({
    language: getInitialLanguage(),
    setLanguage: (lang: Language) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('app_language', lang);
            Cookies.set('app_language', lang, { expires: 365 });
            document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.lang = lang;
        }
        set({ language: lang });
    }
}));
