import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, Game, Region } from '../store/useStore';
import { Search, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { cn, calculateParticipationTotal, calculateOverallPerformance } from '../lib/utils';

const games: Game[] = ['ZULA', 'ZULA STRIKE', 'WOLFTEAM'];
const regions: Region[] = ['TR', 'EU', 'LATAM', 'AXESO5', 'MbRussia'];

export default function PerformancePage() {
  const { t } = useTranslation();
  const users = useStore(state => state.users);
  const performances = useStore(state => state.performances);
  const updatePerformance = useStore(state => state.updatePerformance);
  const currentUserRoles = useStore(state => state.currentUserRoles);
  const isAdminOrStaff = currentUserRoles.some(r => ['role_sysadmin', 'role_compmgr', 'role_compstaff'].includes(r));

  const [activeGame, setActiveGame] = useState<Game | 'ALL'>('ALL');
  const [activeRegion, setActiveRegion] = useState<Region | 'ALL'>('ALL');
  const [activeCompetency, setActiveCompetency] = useState<'ALL' | 'ACADEMY' | 'REFEREE'>('ALL');
  const [activeRole, setActiveRole] = useState<string>('ALL');
  const [activeStatus, setActiveStatus] = useState<'Active' | 'Passive' | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [newEntryDay, setNewEntryDay] = useState<number>(new Date().getDate());
  const [newEntryMultiplier, setNewEntryMultiplier] = useState<number>(1);
  const [newRefEntryDay, setNewRefEntryDay] = useState<number>(new Date().getDate());
  const [newRefEntryMultiplier, setNewRefEntryMultiplier] = useState<number>(1);
  const [newRefEntryType, setNewRefEntryType] = useState<'EVERYONE' | 'SABOTAGE'>('EVERYONE');

  // Monthly Period Logic
  const getCurrentPeriod = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const [selectedPeriod, setSelectedPeriod] = useState<string>(getCurrentPeriod());

  // Generate last 12 months for the selector
  const periodOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return {
      value: `${year}-${month}`,
      label: `${year} - ${t(`month_${month}`)}`
    };
  });

  const allRoles = useStore(state => state.roles);

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
      u.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesGame && matchesRegion && matchesCompetency && matchesRole && matchesStatus && matchesSearch;
  });

  const handleEdit = (user: any, currentPerf: any) => {
    setSelectedUser(user);
    // Initialize with 0 for points, but keep historical entries/details
    setEditForm({
      ...currentPerf,
      testParticipation: 0,
      bugReports: 0,
      suggestions: 0,
      refereeEveryoneX: 0,
      refereeSabotage: 0,
      discordTimeout: 0,
      discordBan: 0,
      discordMessageDelete: 0,
      managerOpinion: 0
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!selectedUser) return;

    const userId = selectedUser.id;
    const currentPerf = performances.find(p => p.userId === userId && p.period === selectedPeriod) || {
      userId,
      period: selectedPeriod,
      testParticipation: 0,
      participationEntries: [],
      bugReports: 0,
      suggestions: 0,
      details: '',
      support: 0,
      refereePerformance: 0,
      qa: 0,
      discordPc: 0,
      managerOpinion: 0,
      notes: ''
    };

    const now = new Date().toLocaleString('tr-TR');
    const currentUserId = useStore.getState().currentUserId;
    const currentUser = users.find(u => u.id === currentUserId);
    const adminName = currentUser?.fullName || t('adminUser');

    const fieldsToLog = [
      { key: 'testParticipation', label: 'Test Katılımı' },
      { key: 'bugReports', label: 'Hata Bildirimi' },
      { key: 'suggestions', label: 'Öneri' },
      { key: 'refereeEveryoneX', label: 'Hakem (Herkes Tek/ÖTS)' },
      { key: 'refereeSabotage', label: 'Hakem (Sabotaj)' },
      { key: 'discordTimeout', label: 'Discord Uzaklaştırma/Zaman Aşımı' },
      { key: 'discordBan', label: 'Discord Yasaklama' },
      { key: 'discordMessageDelete', label: 'Discord Mesaj Silme' },
      { key: 'managerOpinion', label: 'Yönetici Görüşü' }
    ];

    // Cumulative sum: Add form values to current values
    const updatedValues: any = { ...editForm };
    fieldsToLog.forEach(({ key }) => {
      const currentVal = (currentPerf[key as keyof typeof currentPerf] as number) || 0;
      const addedVal = (editForm[key as keyof typeof editForm] as number) || 0;
      updatedValues[key] = currentVal + addedVal;
    });

    fieldsToLog.forEach(({ key, label }) => {
      const oldVal = (currentPerf[key as keyof typeof currentPerf] as number) || 0;
      const newVal = updatedValues[key];
      const addedVal = (editForm[key as keyof typeof editForm] as number) || 0;

      if (addedVal !== 0) {
        const actionText = addedVal > 0 ? `${addedVal} artırıldı` : `${Math.abs(addedVal)} azaltıldı`;

        useStore.getState().addLog({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          userId,
          action: `${now} tarihinde ${adminName} tarafından ${selectedUser.fullName} kullanıcısının (${selectedPeriod}) dönemi için ${label} performansı ${actionText}. (Yeni Toplam: ${newVal})`,
          timestamp: new Date().toISOString(),
          performedBy: adminName
        });
      }
    });

    // Handle notes log specially if changed
    if (currentPerf.notes !== editForm.notes) {
      useStore.getState().addLog({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        userId,
        action: `${now} tarihinde ${adminName} tarafından ${selectedUser.fullName} kullanıcısının (${selectedPeriod}) dönemi notu güncellendi.`,
        timestamp: new Date().toISOString(),
        performedBy: adminName
      });
      updatedValues.notes = editForm.notes;
    }

    // Update total referee performance
    updatedValues.refereePerformance = (Number(updatedValues.refereeEveryoneX) || 0) + (Number(updatedValues.refereeSabotage) || 0);

    // Update combined discordPc from sub-categories (weighted ZA)
    updatedValues.discordPc =
      (Number(updatedValues.discordTimeout) || 0) * 25 +
      (Number(updatedValues.discordBan) || 0) * 25 +
      (Number(updatedValues.discordMessageDelete) || 0) * 10;

    updatePerformance(userId, selectedPeriod, updatedValues);
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const addParticipationEntry = () => {
    const entries = [...(editForm.participationEntries || [])];
    const newEntry = {
      id: Date.now().toString(),
      day: newEntryDay,
      multiplier: newEntryMultiplier
    };
    const updatedEntries = [...entries, newEntry].sort((a, b) => a.day - b.day);

    const detailsFormatted = updatedEntries
      .map(entry => `${String(entry.day).padStart(2, '0')}x${entry.multiplier}`)
      .join(', ');

    setEditForm({
      ...editForm,
      participationEntries: updatedEntries,
      details: detailsFormatted
    });
  };

  const removeParticipationEntry = (id: string) => {
    const updatedEntries = (editForm.participationEntries || []).filter((e: any) => e.id !== id);
    const details = updatedEntries
      .map((entry: any) => `${String(entry.day).padStart(2, '0')}x${entry.multiplier}`)
      .join(', ');

    setEditForm({
      ...editForm,
      participationEntries: updatedEntries,
      details: details
    });
  };

  const addRefereeEntry = () => {
    const entries = [...(editForm.refereeEntries || [])];
    const newEntry = {
      id: Date.now().toString(),
      day: newRefEntryDay,
      multiplier: newRefEntryMultiplier,
      type: newRefEntryType
    };
    const updatedEntries = [...entries, newEntry].sort((a, b) => a.day - b.day);

    const detailsFormatted = updatedEntries
      .map(entry => `${String(entry.day).padStart(2, '0')}x${entry.multiplier} (${entry.type === 'EVERYONE' ? 'H' : 'S'})`)
      .join(', ');

    setEditForm({
      ...editForm,
      refereeEntries: updatedEntries,
      refereeDetails: detailsFormatted
    });
  };

  const removeRefereeEntry = (id: string) => {
    const updatedEntries = (editForm.refereeEntries || []).filter((e: any) => e.id !== id);

    const detailsFormatted = updatedEntries
      .map((entry: any) => `${String(entry.day).padStart(2, '0')}x${entry.multiplier} (${entry.type === 'EVERYONE' ? 'H' : 'S'})`)
      .join(', ');

    setEditForm({
      ...editForm,
      refereeEntries: updatedEntries,
      refereeDetails: detailsFormatted
    });
  };

  // Dynamic conditional formatting: color based on min/max of current dataset
  const getScoreColor = (score: number, min: number, max: number) => {
    if (max <= min) return 'text-indigo-600 dark:text-indigo-400 font-bold';
    const percent = (score - min) / (max - min);
    if (percent >= 0.8) return 'text-emerald-600 dark:text-emerald-400 font-black';
    if (percent >= 0.5) return 'text-blue-600 dark:text-blue-400 font-bold';
    if (percent >= 0.2) return 'text-amber-600 dark:text-amber-400 font-semibold';
    return 'text-rose-600 dark:text-rose-400 font-medium';
  };

  // Pre-compute performance data, sort descending by overall score
  // Exclude passive users from periods after their deactivation date
  const activeInPeriod = filteredUsers.filter(user => {
    if (user.status === 'Active') return true;
    if (!user.statusChangedAt) return false; // Passive with no date = exclude
    const deactivatedDate = new Date(user.statusChangedAt);
    const [periodYear, periodMonth] = selectedPeriod.split('-').map(Number);
    const periodStart = new Date(periodYear, periodMonth - 1, 1);
    // Show user if the period started before they became passive
    return periodStart < deactivatedDate;
  });

  const performanceList = activeInPeriod.map(user => {
    const perf = performances.find(p => p.userId === user.id && p.period === selectedPeriod) || {
      userId: user.id, period: selectedPeriod,
      testParticipation: 0, bugReports: 0, suggestions: 0, details: '',
      support: 0, refereePerformance: 0, refereeEveryoneX: 0, refereeSabotage: 0,
      refereeEntries: [], refereeDetails: '', qa: 0, discordPc: 0,
      discordTimeout: 0, discordBan: 0, discordMessageDelete: 0,
      managerOpinion: 0, notes: ''
    };
    const overallPerf = calculateOverallPerformance(perf);
    return { user, perf, overallPerf };
  }).sort((a, b) => b.overallPerf - a.overallPerf);

  const allScores = performanceList.map(p => p.overallPerf);
  const maxScore = allScores.length > 0 ? Math.max(...allScores) : 0;
  const minScore = allScores.length > 0 ? Math.min(...allScores) : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t('performance')}
        </h1>
      </div>

      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-[#16181d] p-4 rounded-t-2xl border border-b-0 border-gray-200 dark:border-gray-800/60 mt-6 gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap">Dönem:</label>
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                setIsModalOpen(false); // Stop editing if period changes
              }}
              className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg px-3 py-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
            >
              {periodOptions.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
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
                <th className="px-4 py-3 sticky left-0 bg-gray-50/50 dark:bg-[#0f1115]/50 z-10">{t('member')}</th>
                <th className="px-4 py-3">{t('testPart')}</th>
                <th className="px-4 py-3 bg-indigo-50/50 dark:bg-indigo-500/5">{t('testDet')}</th>
                <th className="px-4 py-3">{t('bugReports')}</th>
                <th className="px-4 py-3">{t('suggestions')}</th>
                <th className="px-4 py-3">{t('refPerf')}</th>
                <th className="px-4 py-3 bg-indigo-50/50 dark:bg-indigo-500/5">{t('refDet')}</th>
                <th className="px-4 py-3">{t('discordPc')}</th>
                {isAdminOrStaff && <th className="px-4 py-3">{t('mgrOpinion')}</th>}
                {isAdminOrStaff && <th className="px-4 py-3 bg-indigo-50/50 dark:bg-indigo-500/5">{t('overallPerformance')}</th>}
                <th className="px-4 py-3">{t('notes')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
              {performanceList.length === 0 ? (
                <tr>
                  <td colSpan={isAdminOrStaff ? 11 : 9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {t('noUsersFound')}
                  </td>
                </tr>
              ) : (
                performanceList.map(({ user, perf, overallPerf }) => (
                  <tr
                    key={user.id}
                    onClick={() => handleEdit(user, perf)}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors group cursor-pointer"
                  >
                    <td className="px-4 py-3 sticky left-0 bg-white dark:bg-[#16181d] group-hover:bg-gray-50/50 dark:group-hover:bg-[#1c1f26] z-10 border-r border-gray-100 dark:border-gray-800/40">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900 dark:text-white">{user.fullName}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{user.inGameUsername}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{perf.testParticipation}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs max-w-[150px] truncate bg-indigo-50/10 dark:bg-indigo-500/5" title={perf.details}>{perf.details || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{perf.bugReports}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{perf.suggestions}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-bold">{perf.refereePerformance}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs max-w-[150px] truncate bg-indigo-50/10 dark:bg-indigo-500/5" title={perf.refereeDetails}>{perf.refereeDetails || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{perf.discordPc}</td>
                    {isAdminOrStaff && <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{perf.managerOpinion}</td>}
                    {isAdminOrStaff && <td className={cn(
                      "px-4 py-3 bg-indigo-50/30 dark:bg-indigo-500/5",
                      getScoreColor(overallPerf, minScore, maxScore)
                    )}>
                      {overallPerf.toLocaleString()}
                    </td>}
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[150px] truncate" title={perf.notes}>{perf.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Performance Edit Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#16181d] w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800/60 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between bg-gray-50/30 dark:bg-gray-500/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                  <Edit2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">Performans Düzenle</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {selectedUser.fullName} <span className="mx-1">•</span> {selectedPeriod}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">

              {/* ═══ 1. TEST PUANLAMA ═══ */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Test Puanlama
                </h3>
                <div className="bg-gray-50/50 dark:bg-gray-500/5 p-4 rounded-xl border border-gray-100 dark:border-gray-800/60 space-y-4">
                  {/* Score input */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Test Katılımı Puanı</label>
                      <input type="number" value={editForm.testParticipation} onChange={e => setEditForm({ ...editForm, testParticipation: Number(e.target.value) })} className="w-full bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                    </div>
                  </div>
                  {/* Day/Multiplier entry */}
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Gün</label>
                      <input type="number" min="1" max="31" value={newEntryDay} onChange={e => setNewEntryDay(Number(e.target.value))} className="w-full bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Çarpan</label>
                      <input type="number" value={newEntryMultiplier} onChange={e => setNewEntryMultiplier(Number(e.target.value))} className="w-full bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white" />
                    </div>
                    <button onClick={addParticipationEntry} className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all active:scale-95">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {/* History */}
                  <div className="bg-white/50 dark:bg-[#0d0e12] p-3 rounded-lg border border-gray-100 dark:border-gray-800/40">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-2">Dönemsel Giriş Geçmişi</div>
                    <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                      {(editForm.participationEntries || []).length === 0 ? (
                        <div className="text-xs text-gray-400 italic py-1">Henüz giriş yapılmamış.</div>
                      ) : (
                        (editForm.participationEntries || []).map((entry: any) => (
                          <div key={entry.id} className="flex items-center justify-between bg-gray-50 dark:bg-[#1c1f26] p-1.5 rounded-md border border-gray-100 dark:border-gray-800/60 group">
                            <span className="text-xs font-medium dark:text-gray-200">Gün {entry.day} <span className="mx-1 text-gray-400">•</span> {entry.multiplier}x</span>
                            <button onClick={() => removeParticipationEntry(entry.id)} className="p-0.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-all opacity-0 group-hover:opacity-100">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══ 2. HAKEM PUANLAMA ═══ */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Hakem Puanlama
                </h3>
                <div className="bg-gray-50/50 dark:bg-gray-500/5 p-4 rounded-xl border border-gray-100 dark:border-gray-800/60 space-y-4">
                  {/* Score inputs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">{t('refEveryone')}</label>
                      <input type="number" value={editForm.refereeEveryoneX || 0} onChange={e => setEditForm({ ...editForm, refereeEveryoneX: Number(e.target.value) })} className="w-full bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">{t('refSabotage')}</label>
                      <input type="number" value={editForm.refereeSabotage || 0} onChange={e => setEditForm({ ...editForm, refereeSabotage: Number(e.target.value) })} className="w-full bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                    </div>
                  </div>
                  {/* Day/Multiplier/Type entry */}
                  <div className="flex items-end gap-3 flex-wrap">
                    <div className="flex-1 min-w-[70px]">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Gün</label>
                      <input type="number" min="1" max="31" value={newRefEntryDay} onChange={e => setNewRefEntryDay(Number(e.target.value))} className="w-full bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white" />
                    </div>
                    <div className="flex-1 min-w-[70px]">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Çarpan</label>
                      <input type="number" value={newRefEntryMultiplier} onChange={e => setNewRefEntryMultiplier(Number(e.target.value))} className="w-full bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white" />
                    </div>
                    <div className="flex-1 min-w-[100px]">
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Tip</label>
                      <select value={newRefEntryType} onChange={e => setNewRefEntryType(e.target.value as 'EVERYONE' | 'SABOTAGE')} className="w-full bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white">
                        <option value="EVERYONE">{t('refEveryone')}</option>
                        <option value="SABOTAGE">{t('refSabotage')}</option>
                      </select>
                    </div>
                    <button onClick={addRefereeEntry} className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all active:scale-95">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {/* History */}
                  <div className="bg-white/50 dark:bg-[#0d0e12] p-3 rounded-lg border border-gray-100 dark:border-gray-800/40">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-2">Dönemsel Hakem Geçmişi</div>
                    <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                      {(editForm.refereeEntries || []).length === 0 ? (
                        <div className="text-xs text-gray-400 italic py-1">Henüz giriş yapılmamış.</div>
                      ) : (
                        (editForm.refereeEntries || []).map((entry: any) => (
                          <div key={entry.id} className="flex items-center justify-between bg-gray-50 dark:bg-[#1c1f26] p-1.5 rounded-md border border-gray-100 dark:border-gray-800/60 group">
                            <span className="text-xs font-medium dark:text-gray-200">Gün {entry.day} <span className="mx-1 text-gray-400">•</span> {entry.multiplier}x ({entry.type === 'EVERYONE' ? 'H' : 'S'})</span>
                            <button onClick={() => removeRefereeEntry(entry.id)} className="p-0.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded transition-all opacity-0 group-hover:opacity-100">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══ 3. HATA & ÖNERİ PUANLAMA ═══ */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Hata & Öneri Puanlama
                </h3>
                <div className="grid grid-cols-2 gap-4 bg-gray-50/50 dark:bg-gray-500/5 p-4 rounded-xl border border-gray-100 dark:border-gray-800/60">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Hata Bildirimleri</label>
                    <input type="number" value={editForm.bugReports} onChange={e => setEditForm({ ...editForm, bugReports: Number(e.target.value) })} className="w-full bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Öneriler</label>
                    <input type="number" value={editForm.suggestions} onChange={e => setEditForm({ ...editForm, suggestions: Number(e.target.value) })} className="w-full bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none transition-all" />
                  </div>
                </div>
              </div>

              {/* ═══ 4. DİSCORD PUANLAMA ═══ */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                  Discord Puanlama
                </h3>
                <div className="grid grid-cols-3 gap-4 bg-gray-50/50 dark:bg-gray-500/5 p-4 rounded-xl border border-gray-100 dark:border-gray-800/60">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Uzaklaştırma / Z.Aşımı</label>
                    <input type="number" value={editForm.discordTimeout || 0} onChange={e => setEditForm({ ...editForm, discordTimeout: Number(e.target.value) })} className="w-full bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Yasaklama</label>
                    <input type="number" value={editForm.discordBan || 0} onChange={e => setEditForm({ ...editForm, discordBan: Number(e.target.value) })} className="w-full bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Mesaj Silme</label>
                    <input type="number" value={editForm.discordMessageDelete || 0} onChange={e => setEditForm({ ...editForm, discordMessageDelete: Number(e.target.value) })} className="w-full bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all" />
                  </div>
                </div>
              </div>

              {/* ═══ 5. DİĞER PERFORMANS VERİLERİ (RESTRICTED) ═══ */}
              {isAdminOrStaff && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    Diğer Performans Verileri
                  </h3>
                  <div className="bg-gray-50/50 dark:bg-gray-500/5 p-4 rounded-xl border border-gray-100 dark:border-gray-800/60">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">{t('mgrOpinion')}</label>
                      <input type="number" value={editForm.managerOpinion} onChange={e => setEditForm({ ...editForm, managerOpinion: Number(e.target.value) })} className="w-full bg-white dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all" />
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ 6. NOTLAR & PERFORMANS GEÇMİŞİ ═══ */}
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800/60">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                  Notlar & Performans Geçmişi
                </h3>
                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase">Notlar</label>
                  <textarea rows={2} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 outline-none resize-none transition-all" />
                </div>
                {/* Performance History */}
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-2">Performans Geçmişi ({selectedPeriod})</div>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                    {useStore.getState().logs
                      .filter(log => log.userId === selectedUser.id && log.action.includes(`(${selectedPeriod})`))
                      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map(log => (
                        <div key={log.id} className="p-3 bg-white/50 dark:bg-[#0d0e12] rounded-lg border border-gray-100 dark:border-gray-800/40 text-xs">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-gray-700 dark:text-gray-300">{log.performedBy}</span>
                            <span className="text-gray-400 font-mono">
                              {new Date(log.timestamp).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 break-words">{log.action}</p>
                        </div>
                      ))}
                    {useStore.getState().logs.filter(log => log.userId === selectedUser.id && log.action.includes(`(${selectedPeriod})`)).length === 0 && (
                      <p className="text-center text-xs text-gray-400 py-4 italic font-medium">Bu dönem için henüz işlem kaydı bulunmamaktadır.</p>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-end gap-3 bg-gray-50/30 dark:bg-gray-500/5">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
              >
                Vazgeç
              </button>
              <button
                onClick={handleSave}
                className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                Değişiklikleri Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
