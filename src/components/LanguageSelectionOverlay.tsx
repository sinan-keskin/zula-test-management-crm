import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

const languages = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'az', name: 'Azərbaycan', flag: '🇦🇿' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export default function LanguageSelectionOverlay() {
    const { i18n } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [selectedLang, setSelectedLang] = useState(i18n.language || 'tr');

    useEffect(() => {
        const hasSelected = localStorage.getItem('i18nextLng_selected');
        if (!hasSelected) {
            setIsVisible(true);
        }
    }, []);

    const handleConfirm = () => {
        i18n.changeLanguage(selectedLang);
        localStorage.setItem('i18nextLng_selected', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-[#090a0d]/90 backdrop-blur-md p-6"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-[#16181d] border border-gray-800 rounded-[32px] p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-4">
                            <Globe className="w-8 h-8 text-indigo-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Dil Seçimi / Language Selection</h2>
                        <p className="text-gray-400 text-sm">Devam etmek için bir dil seçiniz.<br />Please select a language to continue.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => setSelectedLang(lang.code)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 text-left",
                                    selectedLang === lang.code
                                        ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                                        : "bg-[#0f1115] border-gray-800 text-gray-400 hover:border-gray-700 hover:bg-[#1a1d23]"
                                )}
                            >
                                <span className="text-xl">{lang.flag}</span>
                                <span className="font-medium">{lang.name}</span>
                                {selectedLang === lang.code && (
                                    <motion.div layoutId="active" className="ml-auto w-2 h-2 bg-white rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleConfirm}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-600/10 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                    >
                        Devam Et / Continue
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
