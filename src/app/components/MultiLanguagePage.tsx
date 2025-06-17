import React from 'react';
import { useLanguage } from '@/context/languageContext';
import LanguageSelector from './LanguageSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';

const MultiLanguagePage: React.FC = () => {
  const { t, getCurrentLanguage } = useLanguage();
  const currentLang = getCurrentLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              {t('title')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>
          <LanguageSelector />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Welcome Card */}
          <Card className="absolute top-full right-0 mt-2 py-2 min-w-48 z-50 bg-black text-white border border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">{currentLang.flag}</span>
                {t('welcome')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {t('description')}
              </p>
            </CardContent>
          </Card>

          {/* Current Language Info */}
          <Card className="absolute top-full right-0 mt-2 py-2 min-w-48 z-50 bg-black text-white border border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle>{t('currentLanguage')}</CardTitle>
              <CardDescription>
                {currentLang.name} • {currentLang.nativeName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <span className="text-4xl">{currentLang.flag}</span>
                <div>
                  <div className="font-semibold text-lg">{currentLang.nativeName}</div>
                  <div className="text-muted-foreground">{currentLang.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Code: {currentLang.code.toUpperCase()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* About Section */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle>{t('about')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">
              {t('aboutText')}
            </p>
          </CardContent>
        </Card>

        {/* Language Grid */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Available Languages
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[
              { flag: '🇺🇸', name: 'English', native: 'English' },
              { flag: '🇲🇳', name: 'Mongolian', native: 'Монгол хэл' },
              { flag: '🇯🇵', name: 'Japanese', native: '日本語' },
            ].map((lang, index) => (
              <Card key={index} className="absolute top-full right-0 mt-2 py-2 min-w-48 z-50 bg-black text-white border border-gray-700 shadow-lg">
                <div className="text-3xl mb-2">{lang.flag}</div>
                <div className="font-medium text-sm">{lang.native}</div>
                <div className="text-xs text-muted-foreground">{lang.name}</div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiLanguagePage;
