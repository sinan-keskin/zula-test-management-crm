import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, Game, Region, User } from '../store/useStore';
import { Search, Plus, Copy, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserEditModal } from '../components/UserEditModal';

const games: Game[] = ['ZULA', 'ZULA STRIKE', 'WOLFTEAM'];
const regions: Region[] = ['TR', 'EU', 'LATAM', 'AXESO5', 'MbRussia'];
const academyRoles = ['role_acadcap', 'role_acadmem', 'role_fedaimem'];

export default function AcademyPage() {
  const { t } = useTranslation();
  const users = useStore(state => state.users);
  const allRoles = useStore(state => state.roles);

  const [activeGame, setActiveGame] = useState<Game | 'ALL'>('ALL');
  const [activeRegion, setActiveRegion] = useState<Region | 'ALL'>('ALL');
  const [activeRole, setActiveRole] = useState<string>('ALL');
  const [activeStatus, setActiveStatus] = useState<'Active' | 'Passive' | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [originalUserId, setOriginalUserId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredUsers = users.filter(u => {
    const matchesGame = activeGame === 'ALL' || u.game === activeGame;
    const matchesRegion = activeRegion === 'ALL' || u.region === activeRegion;
    const matchesAcademy = u.roles.some(role => academyRoles.includes(role));
    const matchesRole = activeRole === 'ALL' || u.roles.includes(activeRole);
    const matchesStatus = activeStatus === 'ALL' || u.status === activeStatus;
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.inGameUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesGame && matchesRegion && matchesAcademy && matchesRole && matchesStatus && matchesSearch;
  });

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRowClick = (user: User) => {
    setEditingUser({ ...user });
    setOriginalUserId(user.id);
  };

  const handleAddUser = () => {
    setEditingUser({
      id: `U${String(users.length + 1).padStart(3, '0')}`,
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
    setOriginalUserId(null);
  };

  const handleSaveUser = (savedUser: User, passedOriginalId: string | null) => {
    const { updateUser, addUser, addLog, roles: allRoles } = useStore.getState();
    const originalUser = users.find(u => u.id === passedOriginalId);
    const now = new Date().toLocaleString('tr-TR');
    const adminName = 'Admin'; // Dummy admin name

    if (originalUser) {
      if (passedOriginalId !== savedUser.id) {
        useStore.setState(state => ({
          users: state.users.map(u => u.id === passedOriginalId ? savedUser : u),
          performances: state.performances.map(p => p.userId === passedOriginalId ? { ...p, userId: savedUser.id } : p)
        }));
      } else {
        updateUser(passedOriginalId, savedUser);
      }
    } else {
      addUser(savedUser);
    }

    // Simplistic logging for demonstration
    addLog({
      id: Date.now().toString(),
      userId: savedUser.id,
      action: `${now} tarihinde ${adminName} kullanıcısı tarafından ${originalUser ? 'güncellendi' : 'eklendi'}.`,
      timestamp: new Date().toISOString(),
      performedBy: adminName
    });

    setEditingUser(null);
    setOriginalUserId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t('academy')}
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
            value={activeRole}
            onChange={(e) => setActiveRole(e.target.value)}
            className="bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all"
          >
            <option value="ALL">{t('allRoles') || 'Tüm Rolleri Gör'}</option>
            {allRoles
              .filter(r => academyRoles.includes(r.id))
              .map(r => <option key={r.id} value={r.id}>{t(r.id) || r.name}</option>)}
          </select>

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
                <th className="px-6 py-4">{t('roleCompetency')}</th>
                <th className="px-6 py-4">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {t('noAcademyFound')}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => handleRowClick(user)}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => handleCopyId(e, user.id)}
                        className="flex items-center gap-2 font-mono text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title={t('copyToClipboard')}
                      >
                        {user.id}
                        {copiedId === user.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => handleCopyId(e, user.inGameUsername)}
                        className="flex items-center gap-2 font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title={t('copyToClipboard')}
                      >
                        {user.inGameUsername}
                        {copiedId === user.inGameUsername ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{user.fullName}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {user.roles.filter(r => academyRoles.includes(r)).map(role => (
                          <span key={role} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                            {t(role)}
                          </span>
                        ))}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <UserEditModal
          initialUser={editingUser}
          originalUserId={originalUserId}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}
