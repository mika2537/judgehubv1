'use client';
import { useLanguage } from '@/context/languageContext';

export default function LanguageSwitcher() {
  const { currentLanguage, setLanguage, t, getCurrentLanguage } = useLanguage();

  return (
    <div className="flex gap-2 items-center">
      {['en', 'mn', 'ja'].map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={`px-2 py-1 border rounded ${
            currentLanguage === lang ? 'bg-blue-200' : 'bg-white'
          }`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
      <p>{t('selectLanguage')}</p>
    </div>
  );
}