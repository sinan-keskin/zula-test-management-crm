import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, Game, Region, User, Role } from '../store/useStore';
import { Search, Plus, X, Copy, Check, Lock } from 'lucide-react';
import { cn, getUserLevel } from '../lib/utils';
import { UserEditModal } from '../components/UserEditModal';

const games: Game[] = ['ZULA', 'ZULA STRIKE', 'WOLFTEAM'];
const regions: Region[] = ['TR', 'EU', 'LATAM', 'AXESO5', 'MbRussia'];

export default function UsersPage() {
  const { t } = useTranslation();
  const users = useStore(state => state.users);
  const addUser = useStore(state => state.addUser);
  const updateUser = useStore(state => state.updateUser);
  const allRoles = useStore(state => state.roles);
  const logs = useStore(state => state.logs);
  const addLog = useStore(state => state.addLog);
  const currentUserRoles = useStore(state => state.currentUserRoles);

  const [activeGame, setActiveGame] = useState<Game | 'ALL'>('ALL');
  const [activeRegion, setActiveRegion] = useState<Region | 'ALL'>('ALL');
  const [activeCompetency, setActiveCompetency] = useState<'ALL' | 'ACADEMY' | 'REFEREE'>('ALL');
  const [activeRole, setActiveRole] = useState<string>('ALL');
  const [activeStatus, setActiveStatus] = useState<'Active' | 'Passive' | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const currentUserLevel = getUserLevel(currentUserRoles);
  const isSysAdmin = currentUserRoles.includes('role_sysadmin');
  const [deactivationError, setDeactivationError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ id?: string, inGameUsername?: string, systemUsername?: string, email?: string, fullName?: string, roles?: string }>({});

  const filteredUsers = users.filter(u => {
    const matchesGame = activeGame === 'ALL' || u.game === activeGame;
    const matchesRegion = activeRegion === 'ALL' || u.region === activeRegion;

    // Competency Check
    let matchesCompetency = true;
    if (activeCompetency === 'ACADEMY') {
      matchesCompetency = u.roles.some(r => ['role_acadcap', 'role_acadmem', 'role_fedaimem'].includes(r));
    } else if (activeCompetency === 'REFEREE') {
      matchesCompetency = u.roles.some(r => ['role_headref', 'role_ref', 'role_obs'].includes(r));
    }

    const matchesRole = activeRole === 'ALL' || u.roles.includes(activeRole);
    const matchesStatus = activeStatus === 'ALL' || u.status === activeStatus;
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.inGameUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.customId.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesGame && matchesRegion && matchesCompetency && matchesRole && matchesStatus && matchesSearch;
  });

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [originalUserId, setOriginalUserId] = useState<string | null>(null);

  const handleRowClick = (user: User) => {
    setEditingUser({ ...user });
    setOriginalUserId(user.id);
    setValidationErrors({});
    setDeactivationError(null);
  };

  const handleAddUser = () => {
    setEditingUser({
      id: crypto.randomUUID(), // Teknik ID sistem tarafından atanır
      customId: `U${String(users.length + 1).padStart(3, '0')}`, // Kullanıcının göreceği ID
      game: 'ZULA',
      region: 'TR',
      inGameUsername: '',
      systemUsername: '',
      fullName: '',
      email: '',
      roles: [],
      status: 'Active',
      description: '',
      hasSystemAccess: false,
    });
    setOriginalUserId(null); // Indicates new user
    setValidationErrors({});
    setDeactivationError(null);
  };

  const handleSaveUser = (savedUser: User, passedOriginalId: string | null) => {
    const originalUser = users.find(u => u.id === passedOriginalId);
    const now = new Date().toLocaleString('tr-TR');
    const currentUserId = useStore.getState().currentUserId;
    const currentUser = users.find(u => u.id === currentUserId);
    const adminName = currentUser?.fullName || 'Admin';

    if (originalUser) {
      if (originalUser.status !== savedUser.status) {
        if (savedUser.status === 'Active') {
          addLog({
            userId: savedUser.id,
            action: `${now} tarihinde ${adminName} kullanıcısı tarafından aktif olarak eklendi.`,
            performedBy: adminName
          });
        } else {
          addLog({
            userId: savedUser.id,
            action: `${now} tarihinde ${savedUser.deactivationReason || 'belirtilmeyen'} sebebiyle ${adminName} kullanıcısı tarafından pasif edildi.`,
            performedBy: adminName
          });
        }
      }

      // Track all field changes
      const changes: string[] = [];

      // Helper function to format field name for logs
      const getFieldName = (key: keyof User) => {
        const map: Record<string, string> = {
          fullName: 'Adı Soyadı',
          inGameUsername: 'Oyun İçi Kullanıcı Adı',
          systemUsername: 'Sistem Kullanıcı Adı',
          email: 'E-posta',
          game: 'Oyun',
          region: 'Bölge',
          hasSystemAccess: 'Sistem Erişimi',
          description: 'Açıklama',
          discordId: 'Discord ID'
        };
        return map[key as string] || key;
      };

      // Check standard text/select fields
      const fieldsToCheck: (keyof User)[] = ['fullName', 'inGameUsername', 'systemUsername', 'email', 'game', 'region', 'description', 'discordId'];

      fieldsToCheck.forEach(field => {
        if (originalUser[field] !== savedUser[field]) {
          let oldValue = originalUser[field] || 'boş';
          let newValue = savedUser[field] || 'boş';

          addLog({
            userId: savedUser.id,
            action: `${now} tarihinde ${adminName} kullanıcısı tarafından, kullanıcının ${oldValue} olan ${getFieldName(field)} ${newValue} olarak değiştirildi.`,
            performedBy: adminName
          });
        }
      });

      // Check boolean field
      if (originalUser.hasSystemAccess !== savedUser.hasSystemAccess) {
        const oldVal = originalUser.hasSystemAccess ? 'Var' : 'Yok';
        const newVal = savedUser.hasSystemAccess ? 'Var' : 'Yok';
        addLog({
          userId: savedUser.id,
          action: `${now} tarihinde ${adminName} kullanıcısı tarafından, kullanıcının ${oldVal} olan ${getFieldName('hasSystemAccess')} ${newVal} olarak değiştirildi.`,
          performedBy: adminName
        });
      }

      // Check password reset specifically
      if (savedUser.passwordResetRequired && !originalUser.passwordResetRequired) {
        addLog({
          userId: savedUser.id,
          action: `${now} tarihinde ${adminName} kullanıcısı tarafından şifresi sıfırlandı.`,
          performedBy: adminName
        });
      }

      // Check for role changes
      const addedRoles = savedUser.roles.filter(r => !originalUser.roles.includes(r));
      const removedRoles = originalUser.roles.filter(r => !savedUser.roles.includes(r));

      addedRoles.forEach(roleId => {
        const roleDef = allRoles.find(r => r.id === roleId);
        const roleName = t(roleId) || (roleDef ? roleDef.name : roleId);
        addLog({
          userId: savedUser.id,
          action: `${now} tarihinde ${adminName} kullanıcısı tarafından ${roleName} rolü eklendi.`,
          performedBy: adminName
        });
      });

      removedRoles.forEach(roleId => {
        const roleDef = allRoles.find(r => r.id === roleId);
        const roleName = t(roleId) || (roleDef ? roleDef.name : roleId);
        addLog({
          userId: savedUser.id,
          action: `${now} tarihinde ${adminName} kullanıcısı tarafından ${roleName} rolü kaldırıldı.`,
          performedBy: adminName
        });
      });

      if (passedOriginalId !== savedUser.id) {
        // ID has changed, update both users and performances
        useStore.setState(state => ({
          users: state.users.map(u => u.id === passedOriginalId ? savedUser : u),
          performances: state.performances.map(p => p.userId === passedOriginalId ? { ...p, userId: savedUser.id } : p)
        }));
      } else {
        updateUser(passedOriginalId, savedUser);
      }
    } else {
      // Create new user
      addUser(savedUser);
      addLog({
        userId: savedUser.id,
        action: `${now} tarihinde ${adminName} kullanıcısı tarafından sisteme eklendi.`,
        performedBy: adminName
      });
    }
    setEditingUser(null);
    setOriginalUserId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t('users')}
        </h1>
        <button
          onClick={handleAddUser}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          {t('add')}
        </button>
      </div>

      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-[#16181d] p-4 rounded-t-2xl border border-b-0 border-gray-200 dark:border-gray-800/60 mt-6 gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <select
            value={activeGame}
            onChange={(e) => setActiveGame(e.target.value as Game | 'ALL')}
            className="bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all"
          >
            <option value="ALL">{t('allGames') || 'Tüm Oyunlar'}</option>
            {games.map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          <select
            value={activeRegion}
            onChange={(e) => setActiveRegion(e.target.value as Region | 'ALL')}
            className="bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all"
          >
            <option value="ALL">{t('allRegions') || 'Tüm Bölgeler'}</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select
            value={activeCompetency}
            onChange={(e) => {
              setActiveCompetency(e.target.value as 'ALL' | 'ACADEMY' | 'REFEREE');
              setActiveRole('ALL'); // Reset role when competency changes
            }}
            className="bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all"
          >
            <option value="ALL">{t('allRoles') || 'Tüm Yetkinlikler'}</option>
            <option value="ACADEMY">{t('academy')}</option>
            <option value="REFEREE">{t('referees')}</option>
          </select>

          {activeCompetency !== 'ALL' && (
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value)}
              className="bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all"
            >
              <option value="ALL">Tüm Rolleri Gör</option>
              {allRoles
                .filter(r => {
                  if (activeCompetency === 'ACADEMY') return ['role_acadcap', 'role_acadmem', 'role_fedaimem'].includes(r.id);
                  if (activeCompetency === 'REFEREE') return ['role_headref', 'role_ref', 'role_obs'].includes(r.id);
                  return false;
                })
                .map(r => <option key={r.id} value={r.id}>{t(r.id) || r.name}</option>)}
            </select>
          )}

          <select
            value={activeStatus}
            onChange={(e) => setActiveStatus(e.target.value as 'Active' | 'Passive' | 'ALL')}
            className="bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all"
          >
            <option value="ALL">{t('allStatuses') || 'Durum'}</option>
            <option value="Active">{t('active')}</option>
            <option value="Passive">{t('passive')}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#16181d] border border-gray-200 dark:border-gray-800/60 rounded-b-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 dark:bg-[#0f1115]/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800/60">
              <tr>
                <th className="px-6 py-4">{t('userId')}</th>
                <th className="px-6 py-4">{t('inGameUsername')}</th>
                <th className="px-6 py-4">{t('fullName')}</th>
                <th className="px-6 py-4">{t('email')}</th>
                <th className="px-6 py-4">{t('roleCompetency')}</th>
                <th className="px-6 py-4">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {t('noUsersFound')}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const targetUserLevel = getUserLevel(user.roles);
                  const canEdit = isSysAdmin || (currentUserLevel > targetUserLevel);

                  return (
                    <tr
                      key={user.id}
                      onClick={() => handleRowClick(user)}
                      className={cn(
                        "hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors cursor-pointer group",
                        !canEdit && "opacity-75"
                      )}
                    >
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => handleCopyId(e, user.customId)}
                          className="flex items-center gap-2 font-mono text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          title={t('copyToClipboard') || 'Copy to clipboard'}
                        >
                          {user.customId}
                          {copiedId === user.customId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => handleCopyId(e, user.inGameUsername)}
                          className="flex items-center gap-2 font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          title={t('copyToClipboard') || 'Copy to clipboard'}
                        >
                          {user.inGameUsername}
                          {!canEdit && <Lock className="w-3.5 h-3.5 text-amber-500/70" title="Sadece Görüntülenebilir" />}
                          {copiedId === user.inGameUsername ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{user.fullName}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => handleCopyId(e, user.email)}
                          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          title={t('copyToClipboard') || 'Copy to clipboard'}
                        >
                          {user.email}
                          {copiedId === user.email ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1 flex-wrap">
                          {user.roles.map(roleId => {
                            const roleDef = allRoles.find(r => r.id === roleId);
                            return (
                              <span key={roleId} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                                {t(roleId) || (roleDef ? roleDef.name : roleId)}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                          user.status === 'Active'
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/20"
                            : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-inset ring-rose-500/20"
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", user.status === 'Active' ? "bg-emerald-500" : "bg-rose-500")} />
                          {t(user.status.toLowerCase())}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <UserEditModal
          initialUser={editingUser}
          originalUserId={editingUser.id}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}
