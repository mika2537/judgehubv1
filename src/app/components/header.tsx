"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Home,
  Gavel,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
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

  const handleLogout = () => {
    signOut({ callbackUrl: "/pages/login" });
  };

  // Define navigation items with allowed roles
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
        icon: Settings, // You may replace this icon with something else, e.g. Users or Shield
        roles: ["admin"],
      },
    ],
    [t]
  );

  // Filter nav items by user's role
  const filteredNavItems = useMemo(() => {
    if (!session?.user?.role) return [];
    return navItems.filter((item) => item.roles.includes(session?.user?.role ?? ""));
  }, [navItems, session?.user?.role]);

  return (
    <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/pages/Dashboard"
          className="flex items-center hover:opacity-80 transition-opacity"
          aria-label={t("judgeHub")}
        >
          <Image
            src="/favicon.ico"
            alt={t("logoAlt")}
            width={40}
            height={40}
            className="mr-2 rounded"
          />
          <span className="font-bold text-xl bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            {t("judgeHub")}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden md:flex items-center space-x-1"
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
                    rounded-md px-3 py-2
                    ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/50"
                        : "hover:bg-primary/10 hover:text-primary focus:bg-primary/20 focus:text-primary"
                    }
                    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1
                  `}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* User Actions */}
        <div className="flex items-center space-x-2">
          {session?.user ? (
            <>
              {/* Language Selector */}
              <LanguageSelector />

              {/* Profile and Sign Out */}
              <div className="hidden md:flex items-center space-x-3">
                <Button
                  onClick={() => router.push("/profile")}
                  className="flex items-center hover:opacity-80 transition-opacity"
                  aria-label={`${t("profile")} ${session.user.name || ""}`}
                >
                  <Image
                    src="/eventImage/userprofile.png"
                    alt={t("profileImageAlt")}
                    width={32}
                    height={32}
                    className="rounded-full mr-2 border border-gray-200 dark:border-gray-600"
                  />
                  <span>{session.user.name || t("unknownUser")}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="hover:scale-110 transition-transform duration-200 hover:text-destructive"
                  aria-label={t("logout")}
                  title={t("logout")}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? t("closeMenu") : t("openMenu")}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => router.push("/pages/login")}
              variant="ghost"
              className="hover:bg-accent"
            >
              {t("login")}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && session?.user && (
        <div
          className="md:hidden py-4 space-y-2 animate-fade-in bg-white/80 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700"
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
                  className={`w-full justify-start space-x-2 ${
                    isActive ? "bg-primary text-primary-foreground" : ""
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-medium">{session.user.name || t("unknownUser")}</p>
              <p className="text-xs text-muted-foreground capitalize">
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
              className="w-full justify-start space-x-2 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>{t("logout")}</span>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}