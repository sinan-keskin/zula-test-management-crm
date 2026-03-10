import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, FileText, Activity, TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import { calculateOverallPerformance } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { t } = useTranslation();
  const users = useStore(state => state.users);
  const performances = useStore(state => state.performances);
  const adminRoles = ['role_sysadmin', 'role_compmgr', 'role_compstaff'];

  // Filter out administrative staff for participant statistics
  const participants = users.filter(u => !u.roles?.some(r => adminRoles.includes(r)));
  const activeParticipants = participants.filter(u => u.status === 'Active');

  const participantPerformances = performances.filter(p =>
    participants.some(u => u.id === p.userId)
  );

  const totalReports = participantPerformances.reduce((acc, p) => acc + p.bugReports, 0);

  const avgPerformanceValue = participantPerformances.length > 0
    ? (participantPerformances.reduce((acc, p) => acc + calculateOverallPerformance(p), 0) / participantPerformances.length)
    : 0;
  const avgPerformance = avgPerformanceValue.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const gameData = [
    { name: 'ZULA', users: participants.filter(u => u.game === 'ZULA').length },
    { name: 'STRIKE', users: participants.filter(u => u.game === 'ZULA STRIKE').length },
    { name: 'WOLFTEAM', users: participants.filter(u => u.game === 'WOLFTEAM').length },
  ];

  const regionData = [
    { name: 'TR', users: participants.filter(u => u.region === 'TR').length },
    { name: 'EU', users: participants.filter(u => u.region === 'EU').length },
    { name: 'LATAM', users: participants.filter(u => u.region === 'LATAM').length },
    { name: 'AXESO5', users: participants.filter(u => u.region === 'AXESO5').length },
    { name: 'MbRussia', users: participants.filter(u => u.region === 'MbRussia').length },
  ].filter(d => d.users > 0);

  const logs = useStore(state => state.logs);
  const recentLogs = logs.slice(0, 5);

  const topPerformers = [...participantPerformances]
    .sort((a, b) => calculateOverallPerformance(b) - calculateOverallPerformance(a))
    .slice(0, 4)
    .map(p => {
      const user = participants.find(u => u.id === p.userId);
      return {
        id: p.userId,
        name: user?.fullName || 'Unknown',
        username: user?.inGameUsername || 'Unknown',
        score: calculateOverallPerformance(p)
      };
    });

  // Calculate Region Champions
  const regions: string[] = ['TR', 'EU', 'LATAM', 'AXESO5', 'MbRussia'];
  const regionChampions = regions.map(reg => {
    const regionalParticipants = participants.filter(u => u.region === reg);
    const regionalPerfs = participantPerformances.filter(p =>
      regionalParticipants.some(u => u.id === p.userId)
    );

    if (regionalPerfs.length === 0) return null;

    const bestPerf = [...regionalPerfs].sort((a, b) =>
      calculateOverallPerformance(b) - calculateOverallPerformance(a)
    )[0];

    const user = participants.find(u => u.id === bestPerf.userId);
    return {
      region: reg,
      name: user?.fullName || 'Unknown',
      score: calculateOverallPerformance(bestPerf)
    };
  }).filter(Boolean);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t('dashboard')}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('totalUsers')}
          value={participants.length}
          icon={Users}
          trend="+8%"
          trendUp={true}
        />
        <StatCard
          title={t('activeUsers')}
          value={activeParticipants.length}
          icon={Activity}
          trend="+3%"
          trendUp={true}
        />
        <StatCard
          title={t('totalReports')}
          value={totalReports}
          icon={FileText}
          trend="-2%"
          trendUp={false}
        />
        <StatCard
          title={t('avgPerformance')}
          value={avgPerformance}
          icon={TrendingUp}
          trend="+0.4"
          trendUp={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white dark:bg-[#16181d] p-6 rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Dağılım Analizi</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-48">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 text-center">Oyun Dağılımı</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gameData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="users" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-48">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 text-center">Bölge Dağılımı</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="users" fill="#818cf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#16181d] p-6 rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-sm">
          <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">{t('recentActivity')}</h3>
          <div className="space-y-4">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic py-4">{t('noLogs')}</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={log.action}>{log.action}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(log.timestamp).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Performers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#16181d] p-6 rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-sm">
          <h3 className="text-lg font-medium mb-6 text-gray-900 dark:text-white">{t('topPerformers')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topPerformers.map((performer, idx) => (
              <div key={performer.id} className="flex flex-col p-4 rounded-xl bg-gray-50 dark:bg-[#0f1115] border border-gray-100 dark:border-gray-800/60 relative group overflow-hidden transition-all hover:scale-[1.02]">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp className="w-8 h-8 text-indigo-500" />
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs ring-1 ring-indigo-200 dark:ring-indigo-500/30">
                    #{idx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{performer.name}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">{performer.username}</p>
                  </div>
                </div>
                <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-800/60 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Puan</span>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{performer.score.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#16181d] p-6 rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-sm">
          <h3 className="text-lg font-medium mb-6 text-gray-900 dark:text-white">Bölge Şampiyonları</h3>
          <div className="space-y-4">
            {regionChampions.map((champ: any) => (
              <div key={champ.region} className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100/50 dark:border-indigo-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#0f1115] flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
                    {champ.region}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{champ.name}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">En Yüksek Puan</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{champ.score.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, trendUp }: any) {
  return (
    <div className="bg-white dark:bg-[#16181d] p-6 rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-sm flex flex-col gap-4 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg text-indigo-600 dark:text-indigo-400">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">{value}</span>
        <span className={`text-xs font-medium ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
          {trend}
        </span>
      </div>
    </div>
  );
}
