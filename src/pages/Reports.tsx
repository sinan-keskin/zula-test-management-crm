import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, Game, Region } from '../store/useStore';
import { Search, FileDown, Copy, Check } from 'lucide-react';
import { cn, calculateOverallPerformance } from '../lib/utils';
import * as XLSX from 'xlsx';

const games: Game[] = ['ZULA', 'ZULA STRIKE', 'WOLFTEAM'];
const regions: Region[] = ['TR', 'EU', 'LATAM', 'AXESO5', 'MbRussia'];

export default function ReportsPage() {
  const { t } = useTranslation();
  const users = useStore(state => state.users);
  const performances = useStore(state => state.performances);
  const currentUserRoles = useStore(state => state.currentUserRoles);
  const isAdminOrStaff = currentUserRoles.some(r => ['role_sysadmin', 'role_compmgr', 'role_compstaff'].includes(r));

  const [activeGame, setActiveGame] = useState<Game | 'ALL'>('ALL');
  const [activeRegion, setActiveRegion] = useState<Region | 'ALL'>('ALL');
  const [activeCompetency, setActiveCompetency] = useState<'ALL' | 'ACADEMY' | 'REFEREE'>('ALL');
  const [activeRole, setActiveRole] = useState<string>('ALL');
  const [activeStatus, setActiveStatus] = useState<'Active' | 'Passive' | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Monthly/Yearly Period Logic
  const getCurrentPeriod = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  const [selectedPeriod, setSelectedPeriod] = useState<string>(getCurrentPeriod());
  const [periodType, setPeriodType] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

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

  const performanceList = filteredUsers.map(user => {
    let overallPerf = 0;

    if (periodType === 'MONTHLY') {
      const perf = performances.find(p => p.userId === user.id && p.period === selectedPeriod) || {
        testParticipation: 0, bugReports: 0, suggestions: 0, support: 0, refereePerformance: 0, qa: 0, discordPc: 0, managerOpinion: 0
      };
      overallPerf = calculateOverallPerformance(perf as any);
    } else {
      // Yearly Logic: Sum of all months in that year
      const yearStr = selectedPeriod.split('-')[0];
      const yearlyPerfs = performances.filter(p => p.userId === user.id && p.period.startsWith(yearStr));
      overallPerf = yearlyPerfs.reduce((sum, p) => sum + calculateOverallPerformance(p), 0);
    }

    return { user, overallPerf };
  }).sort((a, b) => b.overallPerf - a.overallPerf);

  const allScores = performanceList.map(p => p.overallPerf);
  const maxScore = allScores.length > 0 ? Math.max(...allScores) : 0;
  const minScore = allScores.length > 0 ? Math.min(...allScores) : 0;

  const getScoreColor = (score: number, min: number, max: number) => {
    if (max <= min) return 'text-indigo-600 dark:text-indigo-400 font-bold';
    const percent = (score - min) / (max - min);
    if (percent >= 0.8) return 'text-emerald-600 dark:text-emerald-400 font-black';
    if (percent >= 0.5) return 'text-blue-600 dark:text-blue-400 font-bold';
    if (percent >= 0.2) return 'text-amber-600 dark:text-amber-400 font-semibold';
    return 'text-rose-600 dark:text-rose-400 font-medium';
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const exportExcel = () => {
    // Determine headers
    const headers = [
      'MemberId',
      'ZulaCredit'
    ];

    // Prepare data rows
    const rows = performanceList.map(p => [
      p.user.id,
      isAdminOrStaff ? p.overallPerf : '***'
    ]);

    // Combine headers and rows
    const aoaData = [headers, ...rows];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(aoaData);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Performans Raporu");

    // Auto-size columns (using wch for character width)
    const colWidths = headers.map((_, i) => {
      const maxLen = aoaData.reduce((max, row) => {
        const cellValue = row[i]?.toString() || "";
        return Math.max(max, cellValue.length);
      }, 0);
      return { wch: Math.max(maxLen, 12) + 2 };
    });

    ws['!cols'] = colWidths;

    // Generate filename based on period
    const fileName = `Performans_Raporu_${periodType === 'YEARLY' ? selectedPeriod.split('-')[0] : selectedPeriod}.xlsx`;

    // Download the file
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t('performanceReports')}
        </h1>
        <button
          onClick={exportExcel}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
        >
          <FileDown className="w-4 h-4" />
          Excel Olarak İndir
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#16181d] p-4 rounded-2xl border border-gray-200 dark:border-gray-800/60 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="relative w-full lg:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
            />
          </div>

          <div className="flex items-center gap-3 bg-gray-50 dark:bg-[#0f1115] p-1 rounded-xl border border-gray-200 dark:border-gray-800 w-full lg:w-auto">
            <button
              onClick={() => setPeriodType('MONTHLY')}
              className={cn(
                "flex-1 lg:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                periodType === 'MONTHLY'
                  ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              Aylık
            </button>
            <button
              onClick={() => setPeriodType('YEARLY')}
              className={cn(
                "flex-1 lg:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                periodType === 'YEARLY'
                  ? "bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              Yıllık
            </button>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap">Seçim:</label>
            {periodType === 'MONTHLY' ? (
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full lg:w-auto bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg px-3 py-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
              >
                {periodOptions.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            ) : (
              <select
                value={selectedPeriod.split('-')[0]}
                onChange={(e) => setSelectedPeriod(`${e.target.value}-01`)}
                className="w-full lg:w-auto bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-lg px-3 py-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <select
            value={activeGame}
            onChange={(e) => setActiveGame(e.target.value as Game | 'ALL')}
            className="bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-gray-200"
          >
            <option value="ALL">{t('allGames')}</option>
            {games.map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          <select
            value={activeRegion}
            onChange={(e) => setActiveRegion(e.target.value as Region | 'ALL')}
            className="bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-gray-200"
          >
            <option value="ALL">{t('allRegions')}</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          <select
            value={activeCompetency}
            onChange={(e) => {
              setActiveCompetency(e.target.value as 'ALL' | 'ACADEMY' | 'REFEREE');
              setActiveRole('ALL');
            }}
            className="bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-gray-200"
          >
            <option value="ALL">Tüm Yetkinlikler</option>
            <option value="ACADEMY">{t('academy')}</option>
            <option value="REFEREE">{t('referees')}</option>
          </select>

          <select
            value={activeStatus}
            onChange={(e) => setActiveStatus(e.target.value as 'Active' | 'Passive' | 'ALL')}
            className="bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-gray-200"
          >
            <option value="ALL">{t('allStatuses')}</option>
            <option value="Active">{t('active')}</option>
            <option value="Passive">{t('passive')}</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-[#16181d] border border-gray-200 dark:border-gray-800/60 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 dark:bg-[#0f1115]/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800/60 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4">{t('userId')}</th>
                <th className="px-6 py-4">{t('fullName')}</th>
                <th className="px-6 py-4">{t('inGameUsername')}</th>
                {isAdminOrStaff && <th className="px-6 py-4 text-right">{t('overallPerformance')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/40">
              {performanceList.length === 0 ? (
                <tr>
                  <td colSpan={isAdminOrStaff ? 4 : 3} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {t('noUsersFound')}
                  </td>
                </tr>
              ) : (
                performanceList.map(({ user, overallPerf }) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors group">
                    <td
                      className="px-6 py-4 font-mono text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50/10 dark:bg-indigo-500/5 cursor-pointer hover:bg-indigo-100/50 dark:hover:bg-indigo-500/20 transition-background relative group/id"
                      onClick={() => handleCopy(user.id, user.id + '_id')}
                    >
                      <div className="flex items-center gap-2">
                        {user.id}
                        {copiedId === user.id + '_id' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-0 group-hover/id:opacity-100 transition-opacity" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{user.fullName}</td>
                    <td
                      className="px-6 py-4 text-gray-500 dark:text-gray-400 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group/ig"
                      onClick={() => handleCopy(user.inGameUsername, user.id + '_ig')}
                    >
                      <div className="flex items-center gap-2">
                        {user.inGameUsername}
                        {copiedId === user.id + '_ig' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 opacity-0 group-hover/ig:opacity-100 transition-opacity" />}
                      </div>
                    </td>
                    {isAdminOrStaff && (
                      <td className="px-6 py-4 text-right pr-12">
                        <span className={cn(
                          "px-3 py-1 rounded-full font-bold bg-opacity-10 dark:bg-opacity-10",
                          getScoreColor(overallPerf, minScore, maxScore).replace('text-', 'bg-').replace('dark:text-', 'dark:bg-'),
                          getScoreColor(overallPerf, minScore, maxScore)
                        )}>
                          {overallPerf.toLocaleString()}
                        </span>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
