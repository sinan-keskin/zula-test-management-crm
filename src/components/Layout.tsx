import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  BarChart2,
  GraduationCap,
  Scale,
  FileText,
  ScrollText,
  Settings,
  LayoutDashboard,
  Bell,
  Search,
  Moon,
  Sun,
  ChevronDown,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/useStore';

type NavItem = {
  path: string;
  icon: React.ElementType;
  label: string;
  children?: NavItem[];
};

const navItems: NavItem[] = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'dashboard' },
  {
    path: '/dashboard/users',
    icon: Users,
    label: 'users',
    children: [
      { path: '/dashboard/academy', icon: GraduationCap, label: 'academy' },
      { path: '/dashboard/referees', icon: Scale, label: 'referees' },
    ]
  },
  {
    path: '/dashboard/performance',
    icon: BarChart2,
    label: 'performanceManagement',
    children: [
      { path: '/dashboard/reports', icon: FileText, label: 'performanceReports' },
    ]
  },
  {
    path: '/dashboard/settings',
    icon: Settings,
    label: 'settings',
    children: [
      { path: '/dashboard/logs', icon: ScrollText, label: 'logs' },
    ]
  },
];

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'az', name: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export default function Layout() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isDark = useStore(state => state.isDark);
  const setIsDark = useStore(state => state.setIsDark);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const currentUserRoles = useStore(state => state.currentUserRoles);
  const currentUserId = useStore(state => state.currentUserId);
  const users = useStore(state => state.users);
  const logout = useStore(state => state.logout);
  const roles = useStore(state => state.roles);

  const currentUser = users.find(u => u.id === currentUserId);
  const initials = currentUser?.fullName
    ? currentUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'AD';
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    '/users': true
  });

  const hasPermission = (page: string) => {
    return currentUserRoles.some(roleId => {
      const roleDef = roles.find(r => r.id === roleId);
      if (!roleDef) return false;
      if (roleDef.permissions.includes('all')) return true;
      return roleDef.permissions.includes(page);
    });
  };

  const filterNavItems = (items: NavItem[]): NavItem[] => {
    return items.reduce((acc: NavItem[], item) => {
      const children = item.children ? filterNavItems(item.children) : undefined;
      const isVisible = item.label === 'dashboard' || hasPermission(item.label) || (children && children.length > 0);

      if (isVisible) {
        acc.push({ ...item, children });
      }
      return acc;
    }, []);
  };

  const visibleNavItems = filterNavItems(navItems);

  // Removed local theme effect, now handled in App.tsx

  useEffect(() => {
    document.documentElement.dir = i18n.dir();
    document.title = t('appTitle') || 'MadByte Akademi';
  }, [i18n, i18n.language, t]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.lang-dropdown')) setIsLangOpen(false);
      if (!(e.target as Element).closest('.notif-dropdown')) setIsNotifOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0f1115] text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#16181d] flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <img src="https://www.madbytegames.com/wp-content/uploads/2022/11/madbyte-logo.png" alt="MadByte" className="w-8 h-8 rounded object-contain" />
            <span className="font-bold text-lg tracking-tight">{t('appTitle')}</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            // Precise active logic to avoid 'users' highlighting when 'academy' is active
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedMenus[item.path];

            const handleToggle = (e: React.MouseEvent, path: string) => {
              if (hasChildren) {
                e.preventDefault();
                e.stopPropagation();
                setExpandedMenus(prev => ({ ...prev, [path]: !prev[path] }));
              }
            };

            return (
              <div key={item.path} className="flex flex-col">
                <div
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                    (isActive && !hasChildren) || (isActive)
                      ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
                  )}
                >
                  <NavLink
                    to={item.path}
                    className="flex items-center gap-3 flex-1"
                  >
                    <Icon className="w-5 h-5" />
                    {t(item.label)}
                  </NavLink>
                  {hasChildren && (
                    <button
                      onClick={(e) => handleToggle(e, item.path)}
                      className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                {hasChildren && isExpanded && (
                  <div className="ml-6 mt-1 flex flex-col space-y-1 border-l-2 border-gray-100 dark:border-gray-800/60 pl-2">
                    {item.children!.map(child => {
                      const ChildIcon = child.icon;
                      const isChildActive = location.pathname === child.path || (child.path !== '/' && location.pathname.startsWith(child.path));
                      return (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                            isChildActive
                              ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200"
                          )}
                        >
                          <ChildIcon className="w-4 h-4" />
                          {t(child.label)}
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium text-xs">
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate">
                {currentUser?.fullName || t('adminUser')}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate uppercase font-bold tracking-wider">
                {currentUserRoles.length > 0 ? (
                  currentUserRoles.map(roleId => {
                    const roleDef = roles.find(r => r.id === roleId);
                    return t(roleId) || (roleDef ? roleDef.name : roleId);
                  }).join(', ')
                ) : 'No Role'}
              </span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            {t('logout') || 'Çıkış Yap'}
          </button>

          <div className="h-px bg-gray-200 dark:bg-gray-800 my-4" />

          {/* Sidebar Footer */}
          <div className="flex flex-col items-center justify-center opacity-100">
            <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-[0.2em]">
              {t('footer_contact')}
            </div>
            <div className="flex items-center gap-2 text-black dark:text-white text-xs font-bold ring-offset-white dark:ring-offset-[#16181d]">
              <span className="opacity-20">|</span>
              <a
                href="https://www.sinankeskin.com.tr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black dark:text-white hover:text-indigo-500 dark:hover:text-indigo-400 hover:scale-125 transition-all duration-200"
                title="Website"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
              </a>
              <span className="opacity-20">|</span>
              <a
                href="mailto:info@sinankeskin.com.tr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black dark:text-white hover:text-[#1e90ff] hover:scale-125 transition-all duration-200"
                title="E-posta"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16 c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" /></svg>
              </a>
              <span className="opacity-20">|</span>
              <a
                href="https://github.com/sinan-keskin"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black dark:text-white hover:text-[#333] dark:hover:text-gray-300 hover:scale-125 transition-all duration-200"
                title="GitHub"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.84 10.93c.57.1.77-.25.77-.55v-2.02c-3.19.69-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.68-1.28-1.68 -1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.24 3.34.95.1-.74.4-1.24.72-1.52 -2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.47.11-3.06 0 0 .96-.31 3.14 1.18a10.9 10.9 0 0 1 5.72 0c2.18-1.49 3.14-1.18 3.14-1.18.62 1.59.23 2.77.11 3.06.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.67.41.35.78 1.03.78 2.08v3.08c0 .3.2.65.78.54A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" /></svg>
              </a>
              <span className="opacity-20">|</span>
              <a
                href="https://instagram.com/sinankeeeee"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black dark:text-white hover:text-[#E4405F] hover:scale-125 transition-all duration-200"
                title="Instagram"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10 c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7zm10 2c1.65 0 3 1.35 3 3v10c0 1.65-1.35 3-3 3H7 c-1.65 0-3-1.35-3-3V7c0-1.65 1.35-3 3-3h10zm-5 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm4.8-.9a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2z" /></svg>
              </a>
              <span className="opacity-20">|</span>
              <a
                href="https://t.me/sinankeeeee"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black dark:text-white hover:text-[#229ED9] hover:scale-125 transition-all duration-200"
                title="Telegram"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M9.04 15.81 8.8 19.34c.47 0 .68-.2.93-.44l2.24-2.13 4.65 3.38c.85.47 1.47.22 1.7-.79l3.09-14.38c.28-1.3-.46-1.8-1.3-1.49L2.4 9.67c-1.27.49-1.26 1.18-.22 1.49l4.47 1.4 10.38-6.56c.49-.31.94-.14.57.2L9.04 15.81z" /></svg>
              </a>
              <span className="opacity-20">|</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-[#16181d]/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            {/* Search removed as requested - each page has its own filter */}
          </div>

          <div className="flex items-center gap-2">
            {/* Language Dropdown */}
            <div className="relative lang-dropdown">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={t('language')}
              >
                <span className="text-xl leading-none">{languages.find(l => l.code === i18n.language)?.flag || '🇬🇧'}</span>
              </button>
              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#16181d] rounded-xl shadow-lg border border-gray-100 dark:border-gray-800/60 py-1 z-50">
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        i18n.changeLanguage(lang.code);
                        setIsLangOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors",
                        i18n.language === lang.code
                          ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      )}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
              title={t('theme')}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative notif-dropdown">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#16181d]"></span>
              </button>
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#16181d] rounded-xl shadow-lg border border-gray-100 dark:border-gray-800/60 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800/60 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('notifications')}</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer border-b border-gray-50 dark:border-gray-800/30">
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">System Update</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Version 2.0 has been deployed successfully.</p>
                      <p className="text-xs text-indigo-500 mt-1">2 mins ago</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                      <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">New Report</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">A new bug report was submitted by U004.</p>
                      <p className="text-xs text-indigo-500 mt-1">1 hour ago</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
