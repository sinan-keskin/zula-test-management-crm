import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, User, AlertCircle, LogIn, Sun, Moon, ChevronDown, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';

const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'az', name: 'Azərbaycan', flag: '🇦🇿' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export default function Login() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const login = useStore(state => state.login);
    const isAuthenticated = useStore(state => state.isAuthenticated);

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLangOpen, setIsLangOpen] = useState(false);
    const isDark = useStore(state => state.isDark);
    const setIsDark = useStore(state => state.setIsDark);

    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Artificial delay for UX
        setTimeout(() => {
            const response = login(username, password);
            if (response.success) {
                navigate('/', { replace: true });
            } else {
                setError(response.message || 'Giriş başarısız.');
                setIsLoading(false);
            }
        }, 800);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#090a0d] p-6 transition-colors duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 dark:from-indigo-500/10 dark:to-purple-500/10 pointer-events-none" />

            {/* Top Bar - Language & Theme */}
            <div className="absolute top-6 right-6 flex items-center gap-2">
                <div className="relative">
                    <button
                        onClick={() => setIsLangOpen(!isLangOpen)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-[#16181d] border border-gray-200 dark:border-gray-800 shadow-sm hover:border-indigo-500 transition-all"
                    >
                        <span className="text-lg">{languages.find(l => l.code === i18n.language)?.flag || '🌍'}</span>
                        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", isLangOpen && "rotate-180")} />
                    </button>

                    {isLangOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#16181d] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800/60 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                            {languages.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        i18n.changeLanguage(lang.code);
                                        localStorage.setItem('i18nextLng_selected', 'true');
                                        setIsLangOpen(false);
                                    }}
                                    className={cn(
                                        "w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors",
                                        i18n.language === lang.code
                                            ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <span>{lang.flag}</span>
                                        {lang.name}
                                    </div>
                                    {i18n.language === lang.code && <Check className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setIsDark(!isDark)}
                    className="p-3 rounded-xl bg-white dark:bg-[#16181d] border border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-indigo-500 transition-all shadow-sm"
                >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
            </div>

            <div className="w-full max-w-md relative">
                {/* Logo Section */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-xl shadow-white/5 mb-6 transition-transform hover:scale-110 duration-300">
                        <img
                            src="https://www.madbytegames.com/wp-content/uploads/2022/11/madbyte-logo.png"
                            alt="MadByte"
                            className="w-14 h-14 object-contain"
                        />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
                        {t('appTitle')}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        {t('loginDesc') || 'Performans Yönetim Paneli Girişi'}
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white dark:bg-[#16181d] border border-gray-100 dark:border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent opacity-50" />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                                {t('usernameOrEmail') || 'Kullanıcı Adı / E-Posta'}
                            </label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-500 group-focus-within/input:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-2xl pl-12 pr-4 py-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-indigo-600/50 focus:border-indigo-600 outline-none transition-all"
                                    placeholder={t('enterUsername') || 'Kullanıcı adı veya e-posta girin'}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                                {t('password') || 'Şifre'}
                            </label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-500 group-focus-within/input:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-2xl pl-12 pr-4 py-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-indigo-600/50 focus:border-indigo-600 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="animate-in fade-in slide-in-from-top-2 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={cn(
                                "w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-600/10 flex items-center justify-center gap-3 transition-all active:scale-[0.98]",
                                isLoading ? "cursor-wait" : "cursor-pointer"
                            )}
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="h-5 w-5" />
                                    Giriş Yap
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
                        {t('noAccountDesc') || 'Hesabınız yoksa veya erişim sorunu yaşıyorsanız'} <br />
                        <a
                            href="mailto:info@sinankeskin.com.tr"
                            className="text-indigo-600 dark:text-indigo-500 font-medium hover:text-indigo-500 dark:hover:text-indigo-400 hover:underline transition-all"
                        >
                            {t('systemAdmin') || 'Sistem Yöneticisi'}
                        </a> {t('contactWith') || 'ile iletişime geçin.'}
                    </div>
                </div>

                {/* Footer info */}
                <div className="mt-8 text-center">
                    <p className="text-gray-400 dark:text-gray-600 text-[10px] font-bold uppercase tracking-[0.3em]">
                        MadByte Games CRM © 2026
                    </p>
                </div>
            </div>
        </div>
    );
}
