import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, Game, Region, User } from '../store/useStore';
import { X, Lock } from 'lucide-react';
import { cn, getUserLevel, getRoleLevel } from '../lib/utils';

interface UserEditModalProps {
    initialUser: User;
    originalUserId: string | null;
    onClose: () => void;
    onSave: (user: User, originalId: string | null) => void;
}

export function UserEditModal({ initialUser, originalUserId, onClose, onSave }: UserEditModalProps) {
    const { t } = useTranslation();
    const allRoles = useStore(state => state.roles);
    const logs = useStore(state => state.logs);
    const currentUserRoles = useStore(state => state.currentUserRoles);
    const users = useStore(state => state.users); // needed for uniqueness validation

    const games: Game[] = ['ZULA', 'ZULA STRIKE', 'WOLFTEAM'];
    const regions: Region[] = ['TR', 'EU', 'LATAM', 'AXESO5', 'MbRussia'];

    const [editingUser, setEditingUser] = useState<User>({ ...initialUser });
    const [deactivationError, setDeactivationError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<{ id?: string, inGameUsername?: string, systemUsername?: string, email?: string, fullName?: string, roles?: string, discordId?: string }>({});

    const currentUserLevel = getUserLevel(currentUserRoles);
    const targetUserLevel = getUserLevel(initialUser.roles);
    const isSysAdmin = currentUserRoles.includes('role_sysadmin');

    // Can edit if:
    // 1. Current user is sysadmin
    // 2. OR Current user's highest role level is GREATER THAN target user's highest role level
    const canEdit = isSysAdmin || (currentUserLevel > targetUserLevel);

    // For new users (originalUserId is null), we check if they can add ANY role
    const canAdd = isSysAdmin || currentUserLevel > 0;

    const handleSaveUser = () => {
        const errors: typeof validationErrors = {};
        let hasError = false;

        // Validate required fields
        const requiredFields: (keyof User)[] = ['id', 'inGameUsername', 'systemUsername', 'fullName', 'email'];
        requiredFields.forEach(field => {
            if (!editingUser[field] || String(editingUser[field]).trim() === '') {
                errors[field as keyof typeof errors] = t('required') || 'Zorunlu';
                hasError = true;
            }
        });

        if (!editingUser.roles || editingUser.roles.length === 0) {
            errors.roles = t('required') || 'Zorunlu';
            hasError = true;
        }

        // Discord ID validation if user has discord_mod role
        if (editingUser.roles.includes('role_discordmod')) {
            if (!editingUser.discordId || editingUser.discordId.trim() === '') {
                errors.discordId = t('discordIdRequired') || 'Discord ID is required for Discord Moderators.';
                hasError = true;
            } else {
                const discordRegex = /^\d{17,}$/;
                if (!discordRegex.test(editingUser.discordId)) {
                    errors.discordId = t('invalidDiscordIdFormat') || 'Discord ID must be at least 17 digits.';
                    hasError = true;
                }
            }
        }

        // In-Game Username format validation
        if (!errors.inGameUsername) {
            const inGameUsernameRegex = /^[a-zA-Z0-9çğıöşüÇĞİÖŞÜ!^\/+?=_$#{}|[\]~`<>*\-]{3,12}$/;
            if (!inGameUsernameRegex.test(editingUser.inGameUsername)) {
                errors.inGameUsername = t('invalidInGameUsernameFormat') || 'Oyun İçi Kullanıcı Adı 3-12 karakter olmalı ve yalnızca şu özel karakterleri içerebilir: ! ^ / + ? = _ - $ # { } [ ] | ~ ` < > *';
                hasError = true;
            }
        }

        // System Username format validation
        if (!errors.systemUsername) {
            const systemUsernameRegex = /^[a-zA-Z0-9]{4,10}$/;
            if (!systemUsernameRegex.test(editingUser.systemUsername)) {
                errors.systemUsername = t('invalidSystemUsernameFormat') || 'Sistem Kullanıcı Adı 4-10 karakter uzunluğunda olmalı ve sadece İngilizce harf ve rakam içerebilir.';
                hasError = true;
            }
        }

        // Email format validation
        if (!errors.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(editingUser.email)) {
                errors.email = t('invalidEmailFormat') || 'Geçerli bir E-Posta adresi giriniz.';
                hasError = true;
            }
        }

        // Validate uniqueness constraints (only if field is not empty / invalid)
        const otherUsers = originalUserId ? users.filter(u => u.id !== originalUserId) : users;

        if (!errors.id && otherUsers.some(u => u.id.toLocaleLowerCase('tr-TR') === editingUser.id.toLocaleLowerCase('tr-TR'))) {
            errors.id = t('userIdExists') || 'Bu Kullanıcı Kimliği zaten kullanılıyor.';
            hasError = true;
        }
        if (!errors.inGameUsername && otherUsers.some(u => u.inGameUsername.toLocaleLowerCase('tr-TR') === editingUser.inGameUsername.toLocaleLowerCase('tr-TR'))) {
            errors.inGameUsername = t('inGameUsernameExists') || 'Bu Oyun İçi Kullanıcı Adı zaten kullanılıyor.';
            hasError = true;
        }
        if (!errors.systemUsername && otherUsers.some(u => u.systemUsername.toLocaleLowerCase('tr-TR') === editingUser.systemUsername.toLocaleLowerCase('tr-TR'))) {
            errors.systemUsername = t('systemUsernameExists') || 'Bu Sistem Kullanıcı Adı zaten kullanılıyor.';
            hasError = true;
        }
        if (!errors.email && otherUsers.some(u => u.email.toLocaleLowerCase('tr-TR') === editingUser.email.toLocaleLowerCase('tr-TR'))) {
            errors.email = t('emailExists') || 'Bu E-Posta adresi zaten kullanılıyor.';
            hasError = true;
        }
        if (!errors.discordId && editingUser.discordId && otherUsers.some(u => u.discordId === editingUser.discordId)) {
            errors.discordId = t('discordIdExists') || 'Bu Discord ID zaten başka bir kullanıcıda kayıtlı.';
            hasError = true;
        }

        setValidationErrors(errors);
        if (hasError) return;

        // Validate deactivation reason
        if (editingUser.status === 'Passive' && !editingUser.deactivationReason?.trim()) {
            setDeactivationError(t('deactivationReasonRequired') || 'Lütfen kullanıcıyı pasife çekme sebebini giriniz.');
            return;
        }

        setDeactivationError(null);
        onSave(editingUser, originalUserId);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-[#16181d] rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800/60">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {originalUserId ? (t('editUser') || 'Edit User') : (t('addUser') || 'New User')} - {editingUser.id}
                        {!canEdit && originalUserId && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                                <Lock className="w-3 h-3 mr-1" />
                                Salt Okunur
                            </span>
                        )}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('userId')}</label>
                            <input
                                type="text"
                                value={editingUser.id}
                                onChange={(e) => {
                                    setEditingUser({ ...editingUser, id: e.target.value });
                                    if (validationErrors.id) setValidationErrors({ ...validationErrors, id: undefined });
                                }}
                                className={cn(
                                    "w-full bg-gray-50 dark:bg-[#0f1115] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all font-mono",
                                    validationErrors.id ? "border-2 border-red-500 focus:ring-red-500" : "border border-gray-200 dark:border-gray-800"
                                )}
                            />
                            {validationErrors.id && (
                                <p className="mt-1.5 text-xs text-red-500 font-medium animate-in slide-in-from-top-1">{validationErrors.id}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('inGameUsername')}</label>
                            <input
                                type="text"
                                maxLength={12}
                                value={editingUser.inGameUsername}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^[a-zA-Z0-9çğıöşüÇĞİÖŞÜ!^\/+?=_$#{}|[\]~`<>*\-]*$/.test(val)) {
                                        setEditingUser({ ...editingUser, inGameUsername: val });
                                        if (validationErrors.inGameUsername) setValidationErrors({ ...validationErrors, inGameUsername: undefined });
                                    }
                                }}
                                className={cn(
                                    "w-full bg-gray-50 dark:bg-[#0f1115] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all",
                                    validationErrors.inGameUsername ? "border-2 border-red-500 focus:ring-red-500" : "border border-gray-200 dark:border-gray-800"
                                )}
                            />
                            {validationErrors.inGameUsername && (
                                <p className="mt-1.5 text-xs text-red-500 font-medium animate-in slide-in-from-top-1">{validationErrors.inGameUsername}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('systemUsername')}</label>
                            <input
                                type="text"
                                maxLength={10}
                                value={editingUser.systemUsername}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^[a-zA-Z0-9]*$/.test(val)) {
                                        setEditingUser({ ...editingUser, systemUsername: val });
                                        if (validationErrors.systemUsername) setValidationErrors({ ...validationErrors, systemUsername: undefined });
                                    }
                                }}
                                className={cn(
                                    "w-full bg-gray-50 dark:bg-[#0f1115] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all",
                                    validationErrors.systemUsername ? "border-2 border-red-500 focus:ring-red-500" : "border border-gray-200 dark:border-gray-800"
                                )}
                            />
                            {validationErrors.systemUsername && (
                                <p className="mt-1.5 text-xs text-red-500 font-medium animate-in slide-in-from-top-1">{validationErrors.systemUsername}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fullName')}</label>
                            <input
                                type="text"
                                value={editingUser.fullName}
                                disabled={!canEdit && !!originalUserId}
                                onChange={(e) => {
                                    setEditingUser({ ...editingUser, fullName: e.target.value });
                                    if (validationErrors.fullName) setValidationErrors({ ...validationErrors, fullName: undefined });
                                }}
                                className={cn(
                                    "w-full bg-gray-50 dark:bg-[#0f1115] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all",
                                    validationErrors.fullName ? "border-2 border-red-500 focus:ring-red-500" : "border border-gray-200 dark:border-gray-800",
                                    (!canEdit && !!originalUserId) && "opacity-60 cursor-not-allowed"
                                )}
                            />
                            {validationErrors.fullName && (
                                <p className="mt-1.5 text-xs text-red-500 font-medium animate-in slide-in-from-top-1">{validationErrors.fullName}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email')}</label>
                            <input
                                type="email"
                                value={editingUser.email}
                                disabled={!canEdit && !!originalUserId}
                                onChange={(e) => {
                                    setEditingUser({ ...editingUser, email: e.target.value });
                                    if (validationErrors.email) setValidationErrors({ ...validationErrors, email: undefined });
                                }}
                                className={cn(
                                    "w-full bg-gray-50 dark:bg-[#0f1115] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all",
                                    validationErrors.email ? "border-2 border-red-500 focus:ring-red-500" : "border border-gray-200 dark:border-gray-800",
                                    (!canEdit && !!originalUserId) && "opacity-60 cursor-not-allowed"
                                )}
                            />
                            {validationErrors.email && (
                                <p className="mt-1.5 text-xs text-red-500 font-medium animate-in slide-in-from-top-1">{validationErrors.email}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('game')}</label>
                            <select
                                value={editingUser.game}
                                onChange={(e) => setEditingUser({ ...editingUser, game: e.target.value as Game })}
                                className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all"
                            >
                                {games.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('region')}</label>
                            <select
                                value={editingUser.region}
                                onChange={(e) => setEditingUser({ ...editingUser, region: e.target.value as Region })}
                                className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all"
                            >
                                {regions.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('status')}</label>
                            <select
                                value={editingUser.status}
                                onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'Active' | 'Passive' })}
                                className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all"
                            >
                                <option value="Active">{t('active')}</option>
                                <option value="Passive">{t('passive')}</option>
                            </select>
                        </div>
                    </div>

                    {editingUser.status === 'Passive' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('deactivationReason')}</label>
                            <input
                                type="text"
                                value={editingUser.deactivationReason || ''}
                                onChange={(e) => {
                                    setEditingUser({ ...editingUser, deactivationReason: e.target.value });
                                    if (deactivationError) setDeactivationError(null);
                                }}
                                className={cn(
                                    "w-full bg-gray-50 dark:bg-[#0f1115] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all",
                                    deactivationError
                                        ? "border-2 border-red-500 focus:ring-red-500"
                                        : "border border-gray-200 dark:border-gray-800"
                                )}
                            />
                            {deactivationError && (
                                <p className="mt-1.5 text-xs text-red-500 font-medium animate-in slide-in-from-top-1">
                                    {deactivationError}
                                </p>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('roleCompetency')}</label>
                        <div className={cn(
                            "flex flex-wrap gap-2 rounded-lg border transition-colors",
                            validationErrors.roles ? "border-red-500/50 bg-red-50 p-2 dark:bg-red-500/10" : "border-transparent"
                        )}>
                            {allRoles.map(role => {
                                const hasRole = editingUser.roles.includes(role.id);
                                const roleLevel = getRoleLevel(role.id);

                                // Can assign role if:
                                // 1. Current user is sysadmin
                                // 2. OR Current user's level is GREATER THAN the role's level
                                const canToggle = isSysAdmin || (currentUserLevel > roleLevel);

                                if (!isSysAdmin) {
                                    // Existing specialized logic for manager/staff stays as secondary filter
                                    let legacyCanAssign = false;
                                    if (currentUserRoles.includes('role_compmgr')) {
                                        if (role.id !== 'role_sysadmin' && role.id !== 'role_compmgr') {
                                            legacyCanAssign = true;
                                        }
                                    } else if (currentUserRoles.includes('role_compstaff')) {
                                        if (role.id === 'role_acadcap' || role.id === 'role_headref') {
                                            legacyCanAssign = true;
                                        }
                                    } else {
                                        const assignableRoles = new Set<string>();
                                        if (currentUserRoles.includes('role_acadcap')) {
                                            assignableRoles.add('role_acadcap');
                                            assignableRoles.add('role_acadmem');
                                            assignableRoles.add('role_fedaimem');
                                        }
                                        if (currentUserRoles.includes('role_headref')) {
                                            assignableRoles.add('role_ref');
                                            assignableRoles.add('role_obs');
                                        }
                                        if (assignableRoles.has(role.id)) {
                                            legacyCanAssign = true;
                                        }
                                    }
                                    // If legacy logic says NO, we follow it. If it says YES, we also check our level-based system.
                                    if (!legacyCanAssign) return null;
                                }

                                if (!canToggle && !hasRole) return null; // Don't even show roles they can't assign (unless already assigned)

                                return (
                                    <button
                                        key={role.id}
                                        disabled={!canToggle || (!canEdit && !!originalUserId)}
                                        onClick={() => {
                                            let newRoles = hasRole
                                                ? editingUser.roles.filter(r => r !== role.id)
                                                : [...editingUser.roles, role.id];

                                            if (!hasRole) {
                                                if (role.id === 'role_obs') {
                                                    newRoles = newRoles.filter(r => r !== 'role_ref');
                                                } else if (role.id === 'role_ref') {
                                                    newRoles = newRoles.filter(r => r !== 'role_obs');
                                                } else if (role.id === 'role_acadmem') {
                                                    newRoles = newRoles.filter(r => r !== 'role_fedaimem');
                                                } else if (role.id === 'role_fedaimem') {
                                                    newRoles = newRoles.filter(r => r !== 'role_acadmem');
                                                }
                                            }

                                            setEditingUser({ ...editingUser, roles: newRoles });
                                            if (validationErrors.roles && newRoles.length > 0) {
                                                setValidationErrors({ ...validationErrors, roles: undefined });
                                            }
                                        }}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                                            hasRole
                                                ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300"
                                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-[#0f1115] dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800/50",
                                            (!canToggle || (!canEdit && !!originalUserId)) && "opacity-60 cursor-not-allowed"
                                        )}
                                    >
                                        {t(role.id) || role.name}
                                        {!canToggle && hasRole && <Lock className="w-3 h-3 ml-1 inline opacity-50" />}
                                    </button>
                                );
                            })}
                        </div>
                        {validationErrors.roles && (
                            <p className="mt-1.5 text-xs text-red-500 font-medium animate-in slide-in-from-top-1">{validationErrors.roles}</p>
                        )}
                    </div>

                    {editingUser.roles.includes('role_discordmod') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('discordId')}</label>
                            <input
                                type="text"
                                value={editingUser.discordId || ''}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, ''); // only allow digits
                                    setEditingUser({ ...editingUser, discordId: val });
                                    if (validationErrors.discordId) setValidationErrors({ ...validationErrors, discordId: undefined });
                                }}
                                className={cn(
                                    "w-full bg-gray-50 dark:bg-[#0f1115] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all font-mono",
                                    validationErrors.discordId ? "border-2 border-red-500 focus:ring-red-500" : "border border-gray-200 dark:border-gray-800"
                                )}
                                placeholder="12345678901234567"
                            />
                            {validationErrors.discordId && (
                                <p className="mt-1.5 text-xs text-red-500 font-medium animate-in slide-in-from-top-1">
                                    {validationErrors.discordId}
                                </p>
                            )}
                        </div>
                    )}

                    {(currentUserRoles.includes('role_sysadmin') || currentUserRoles.includes('role_compmgr')) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('systemAccess')}</label>
                                <select
                                    value={editingUser.hasSystemAccess ? 'yes' : 'no'}
                                    onChange={(e) => setEditingUser({ ...editingUser, hasSystemAccess: e.target.value === 'yes' })}
                                    className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all"
                                >
                                    <option value="yes">{t('yes')}</option>
                                    <option value="no">{t('no')}</option>
                                </select>
                            </div>
                            {editingUser.hasSystemAccess && (
                                <div className="flex items-end">
                                    <button
                                        onClick={() => {
                                            setEditingUser({ ...editingUser, passwordResetRequired: true });
                                            alert(t('passwordResetSuccess'));
                                        }}
                                        className="w-full px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        {t('resetPassword')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('description')}</label>
                        <textarea
                            value={editingUser.description}
                            onChange={(e) => setEditingUser({ ...editingUser, description: e.target.value })}
                            rows={3}
                            className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all resize-none"
                        />
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mt-6">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">{t('userLogs') || 'Kullanıcı Kayıtları'}</h3>
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                            {!originalUserId ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">Kullanıcı henüz kaydedilmediği için kayıt bulunmuyor.</p>
                            ) : logs.filter(l => l.userId === editingUser.id).length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">{t('noLogs')}</p>
                            ) : (
                                logs.filter(l => l.userId === editingUser.id).map(log => (
                                    <div key={log.id} className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-[#0f1115] p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                                        {log.action}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-end gap-3 bg-gray-50/50 dark:bg-[#0f1115]/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        {t('cancel')}
                    </button>
                    {canEdit || !originalUserId ? (
                        <button
                            onClick={handleSaveUser}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                        >
                            {t('save')}
                        </button>
                    ) : (
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Bu kullanıcıyı düzenlemek için yetkiniz yetersiz.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
