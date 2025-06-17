'use client';

import React, { useState } from 'react';
import { Languages } from 'lucide-react';
import { useLanguage, languages } from '@/context/languageContext';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';

const LanguageSelector: React.FC = () => {
  const { currentLanguage, setLanguage, t, getCurrentLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (languageCode: string) => {
    setLanguage(languageCode);
    setIsOpen(false);
  };

  const currentLang = getCurrentLanguage();

  return (
    <div className="relative z-50">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white border border-white/30 hover:bg-white/20 transition-colors duration-200"
      >
        <Languages className="w-4 h-4" />
        <span className="text-lg">{currentLang.flag}</span>
        <span className="hidden sm:inline">{currentLang.nativeName}</span>
        <span className="sm:hidden">{currentLang.code.toUpperCase()}</span>
      </Button>

      {isOpen && (
        <Card className="absolute top-full right-0 mt-2 py-2 min-w-48 bg-black border border-white/20 shadow-lg">
          <div className="px-3 py-2 text-sm font-medium text-white border-b border-white/20">
            {t('selectLanguage')}
          </div>
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left text-white hover:bg-white/20 transition-colors duration-150 ${
                currentLanguage === language.code ? 'bg-white/20' : ''
              }`}
            >
              <span className="text-lg">{language.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{language.nativeName}</div>
                <div className="text-sm text-gray-300">{language.name}</div>
              </div>
              {currentLanguage === language.code && (
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              )}
            </button>
          ))}
        </Card>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};

export default LanguageSelector;