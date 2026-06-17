import { useLanguageStore } from '@/store/useLanguageStore';
import { translations, TranslationKey } from '@/i18n/translations';

export const useTranslation = () => {
    const { language, setLanguage } = useLanguageStore();

    const t = (key: TranslationKey): string => {
        return translations[language][key] || key;
    };

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'ar' : 'en');
    };

    return {
        t,
        language,
        toggleLanguage,
        dir: language === 'ar' ? 'rtl' : 'ltr'
    };
};
