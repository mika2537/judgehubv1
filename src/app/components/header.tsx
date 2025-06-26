"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from './ThemeProvider';
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Home,
  Gavel,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import LanguageSelector from "@/app/components/LanguageSelector";
import { useLanguage } from "@/context/languageContext";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

export function AppHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    signOut({ callbackUrl: "/pages/login" });
  };

  const navItems: NavItem[] = useMemo(
    () => [
      {
        path: "/pages/Dashboard",
        label: t("dashboard"),
        icon: Home,
        roles: ["admin", "judge", "viewer"],
      },
      {
        path: "/pages/Judge",
        label: t("judge"),
        icon: Gavel,
        roles: ["admin", "judge"],
      },
      {
        path: "/pages/Scoreboard",
        label: t("scoreboard"),
        icon: BarChart3,
        roles: ["admin", "judge", "viewer"],
      },
      {
        path: "/pages/Competition",
        label: t("competitions"),
        icon: Settings,
        roles: ["admin"],
      },
      {
        path: "/pages/users",
        label: t("manageUsers"),
        icon: Settings,
        roles: ["admin"],
      },
    ],
    [t]
  );

  const filteredNavItems = useMemo(() => {
    if (!session?.user?.role) return [];
    return navItems.filter((item) => item.roles.includes(session?.user?.role ?? ""));
  }, [navItems, session?.user?.role]);

  if (!mounted) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b backdrop-blur-md transition-all duration-300 text-gray-900 dark:text-white bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <Link
          href="/pages/Dashboard"
          className="flex items-center hover:opacity-80 transition-opacity"
          aria-label={t("judgeHub")}
        >
          <Image
            src="/favicon.ico"
            alt={"JudgeHub"}
            width={40}
            height={40}
            className="mr-2 rounded"
          />
          <span className="font-bold text-xl text-primary truncate">
            {"JudgeHub"}
          </span>
        </Link>

        <nav
          className="hidden md:flex gap-2 items-center"
          aria-label="Main navigation"
        >
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`
                    flex items-center space-x-2 transition-all duration-300
                    rounded-md px-3 py-2 text-sm
                    ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/50"
                        : "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 hover:bg-primary/10 hover:text-primary focus:bg-primary/20 focus:text-primary"
                    }
                    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1
                  `}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-5 w-5" />
                  <span className="truncate">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center space-x-2">
          {session?.user ? (
            <>
              <div className="border border-input rounded-md px-2 py-1 hover:bg-accent cursor-pointer transition text-foreground">
                <LanguageSelector />
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="hover:bg-accent"
                aria-label={theme === 'light' ? t('switchToDark') : t('switchToLight')}
              >
                {theme === 'light' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>

              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => router.push("/pages/profile")}
                  className="flex items-center hover:opacity-80 transition-opacity"
                  aria-label={`${t("profile")} ${session.user.name || ""}`}
                >
                  <Image
                    src="/eventImage/userprofile.png"
                    alt={`${session.user.name || t("unknownUser")} profile`}
                    width={32}
                    height={32}
                    className="rounded-full mr-1 border border-gray-200 dark:border-gray-600"
                  />
                  <span className="text-sm font-medium truncate max-w-[100px]">
                    {session.user.name || t("unknownUser")}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="hover:scale-110 transition-transform duration-200 hover:text-destructive"
                  aria-label={t("logout")}
                  title={t("logout")}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? t("closeMenu") : t("openMenu")}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => router.push("/pages/login")}
              variant="ghost"
              className="hover:bg-accent text-sm"
            >
              {t("login")}
            </Button>
          )}
        </div>
      </div>

      {isMobileMenuOpen && session?.user && (
        <div
          className="md:hidden py-4 space-y-2 bg-white/80 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 animate-fade-in"
          role="navigation"
          aria-label="Mobile navigation"
        >
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start space-x-2 text-sm ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 hover:bg-primary/10 hover:text-primary"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-5 w-5" />
                  <span className="truncate">{item.label}</span>
                </Button>
              </Link>
            );
          })}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-600 px-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-base font-medium">{session.user.name || t("unknownUser")}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {t(
                    `role${
                      session.user.role
                        ? session.user.role.charAt(0).toUpperCase() + session.user.role.slice(1)
                        : ""
                    }`,
                    {
                      defaultValue: session.user.role || t("unknownRole"),
                    }
                  )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="hover:bg-accent"
                aria-label={theme === 'light' ? t('switchToDark') : t('switchToLight')}
              >
                {theme === 'light' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start space-x-2 hover:text-destructive text-sm"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span>{t("logout")}</span>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}