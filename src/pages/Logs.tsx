import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollText, Search, Clock, User, FileText } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function LogsPage() {
  const { t } = useTranslation();
  const logs = useStore(state => state.logs);
  const users = useStore(state => state.users);

  const [searchQuery, setSearchQuery] = useState('');

  // Sort logs by timestamp descending (newest first)
  const sortedLogs = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter logs based on search query
  const filteredLogs = sortedLogs.filter(log => {
    const q = searchQuery.toLowerCase();
    const affectedUser = users.find(u => u.id === log.userId);
    const affectedUsername = affectedUser ? affectedUser.inGameUsername.toLowerCase() : '';
    const affectedFullName = affectedUser ? affectedUser.fullName.toLowerCase() : '';

    return log.action.toLowerCase().includes(q) ||
      log.performedBy.toLowerCase().includes(q) ||
      log.userId.toLowerCase().includes(q) ||
      affectedUsername.includes(q) ||
      affectedFullName.includes(q);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <ScrollText className="w-8 h-8 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 p-1.5 rounded-lg" />
          {t('logs')}
        </h1>
      </div>

      <div className="bg-white dark:bg-[#16181d] rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('systemActivity')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('recentActionsDesc')}</p>
          </div>

          <div className="relative w-full sm:w-72 mt-2 sm:mt-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50/50 dark:bg-[#0f1115]/50">
          <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <ScrollText className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">{t('noLogs')}</p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const affectedUser = users.find(u => u.id === log.userId);
                return (
                  <div key={log.id} className="p-5 flex items-start gap-4 hover:bg-white dark:hover:bg-[#1a1d24] transition-colors group">
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/20 transition-colors shrink-0 mt-1">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="truncate">{log.performedBy}</span>
                          <span className="text-gray-400 mx-1">&rarr;</span>
                          <span className="truncate text-indigo-600 dark:text-indigo-400">
                            {affectedUser ? `${affectedUser.fullName} (${affectedUser.inGameUsername})` : `ID: ${log.userId}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 shrink-0 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(log.timestamp).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-white dark:bg-[#16181d] p-3 rounded-lg border border-gray-100 dark:border-gray-800/60 shadow-sm inline-block max-w-full break-words">
                        {log.action}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
