'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, Suspense } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Trophy, Users, Star, BarChart3, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/context/languageContext';
import { useTheme } from '@/app/components/ThemeProvider';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      role?: string | null;
    };
  }
}

interface CompetitionApiItem {
  _id?: string;
  name?: string;
  teamA?: string;
  teamB?: string;
  scoreA?: number | null;
  scoreB?: number | null;
  status?: string;
  participants?: unknown[];
  judges?: unknown[];
  endDate?: string;
}

type Competition = {
  id: string;
  name: string;
  teamA?: string;
  teamB?: string;
  scoreA?: number | null;
  scoreB?: number | null;
  status: string;
  participants: number;
  judges: number;
  endDate: string;
};

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { theme } = useTheme();

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalJudges, setTotalJudges] = useState<number>(0);
  const [submissionsToday] = useState<number>(0);

  const fetchCompetitions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/competitions');
      if (!response.ok) {
        throw new Error(`Failed to fetch competitions: ${response.status}`);
      }
      const data = await response.json();
      const formattedData: Competition[] = data.map((item: CompetitionApiItem) => ({
        id: item._id?.toString() || Math.random().toString(36).substring(2, 9),
        name: item.name || (item.teamA && item.teamB ? `${item.teamA} vs ${item.teamB}` : t('unnamedCompetition')),
        teamA: item.teamA,
        teamB: item.teamB,
        scoreA: item.scoreA ?? null,
        scoreB: item.scoreB ?? null,
        status: item.status || t('upcoming'),
        participants: Array.isArray(item.participants) ? item.participants.length : 0,
        judges: Array.isArray(item.judges) ? item.judges.length : 0,
        endDate: item.endDate
          ? new Date(item.endDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              timeZone: 'Asia/Shanghai',
            })
          : t('notAvailable'),
      }));
      setCompetitions(formattedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('unknownError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchJudgeCount = useCallback(async () => {
    try {
      const response = await fetch('/api/stats/judges');
      if (!response.ok) throw new Error(t('failedJudgeCount'));
      const data = await response.json();
      setTotalJudges(data.totalJudges || 0);
    } catch (err) {
      console.error('Failed to fetch judge count:', err);
    }
  }, [t]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      const redirectTo = searchParams?.get('redirect') || '/pages/dashboard';
      sessionStorage.setItem('loginRedirect', redirectTo);
      router.push('pages/login');
    } else if (status === 'authenticated') {
      fetchCompetitions();
      fetchJudgeCount();
    }
  }, [status, router, searchParams, fetchCompetitions, fetchJudgeCount]);

  const stats = [
    {
      title: t('activeCompetitions'),
      value: competitions.length.toString(),
      icon: Trophy,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: t('totalJudges'),
      value: totalJudges.toString(),
      icon: Users,
      color: 'text-green-600 dark:text-green-400',
    },
    {
      title: t('submissionsToday'),
      value: submissionsToday.toString(),
      icon: Star,
      color: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: t('averageScore'),
      value: competitions.length
        ? (
            competitions
              .filter((c) => c.scoreA != null && c.scoreB != null)
              .reduce((sum, c) => sum + (c.scoreA! + c.scoreB!), 0) /
            (competitions.filter((c) => c.scoreA != null && c.scoreB != null).length * 2 || 1)
          ).toFixed(1)
        : '0.0',
      icon: BarChart3,
      color: 'text-orange-600 dark:text-orange-400',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case t('live'):
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case t('scoring'):
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case t('upcoming'):
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case t('completed'):
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-red-500 text-2xl font-semibold mb-4">{error}</p>
        <Button
          onClick={fetchCompetitions}
          className="px-4 py-2 bg-blue-600 text-white text-xl rounded-lg hover:bg-blue-700 transition"
        >
          {t('retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-gray-50 to-blue-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className={`text-5xl font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {t('welcome', { name: session?.user?.name || t('user') })}
          </h1>
          <p className={theme === 'dark' ? 'text-gray-300 text-xl' : 'text-gray-600 text-xl'}>
            {t('dashboardSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className={`hover:shadow-lg transition-all duration-300 hover:scale-105 backdrop-blur-sm border-0 shadow-xl ${
                  theme === 'dark' 
                    ? 'bg-gray-800/90 border-gray-700' 
                    : 'bg-white/95 border-gray-200'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-lg font-medium ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        {stat.title}
                      </p>
                      <p className={`text-4xl font-bold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={`p-3 rounded-lg ${
                        theme === 'dark' 
                          ? 'bg-gray-700/80' 
                          : 'bg-gray-100'
                      } ${stat.color}`}
                    >
                      <Icon className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className={`backdrop-blur-sm border-0 shadow-xl ${
              theme === 'dark' 
                ? 'bg-gray-800/90 border-gray-700' 
                : 'bg-white/95 border-gray-200'
            }`}>
              <CardHeader>
                <CardTitle className={`flex items-center space-x-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                } text-3xl`}>
                  <Calendar className="w-6 h-6 text-blue-500" />
                  <span>{t('activeCompetitions')}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {competitions.length === 0 ? (
                  <p className={theme === 'dark' ? 'text-gray-300 text-xl' : 'text-gray-600 text-xl'}>
                    {t('noCompetitions')}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {competitions.map((competition) => (
                      <Link
                        href={`/pages/Scoreboard?id=${competition.id}`}
                        key={competition.id}
                        className={`block p-4 rounded-lg shadow-md transition ${
                          theme === 'dark' 
                            ? 'bg-gray-700/80 border-gray-600 hover:bg-gray-700' 
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <h3 className={`font-semibold text-2xl ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {competition.name}
                          </h3>
                          <span
                            className={`inline-block px-2 py-1 text-base font-semibold rounded ${getStatusColor(
                              competition.status
                            )}`}
                          >
                            {competition.status}
                          </span>
                        </div>
                        <p className={`text-lg ${
                          theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                          {t('participants')}: {competition.participants} | {t('judges')}: {competition.judges} | {t('ends')}: {competition.endDate}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className={`backdrop-blur-sm border-0 shadow-xl p-6 flex flex-col items-center justify-center ${
              theme === 'dark' 
                ? 'bg-gray-800/90 border-gray-700' 
                : 'bg-white/95 border-gray-200'
            }`}>
              <Clock className={`w-14 h-14 mb-4 animate-pulse ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <p className={theme === 'dark' ? 'text-gray-300 text-xl' : 'text-gray-600 text-xl'}>
                {t('comingSoon')}
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="text-xl">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}