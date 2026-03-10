import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, Role, RoleDefinition } from '../store/useStore';
import { Save, User, Shield, Plus, Edit2, X } from 'lucide-react';
import { cn } from '../lib/utils';

const availablePages = ['dashboard', 'users', 'performanceManagement', 'performanceReports', 'academy', 'referees', 'logs', 'settings'];

export default function SettingsPage() {
  const { t } = useTranslation();
  const currentUserRoles = useStore(state => state.currentUserRoles);
  const setCurrentUserRoles = useStore(state => state.setCurrentUserRoles);
  const roles = useStore(state => state.roles);
  const addRole = useStore(state => state.addRole);
  const updateRole = useStore(state => state.updateRole);
  const currentUserId = useStore(state => state.currentUserId);
  const users = useStore(state => state.users);

  const currentUser = users.find(u => u.id === currentUserId);
  const isSysAdmin = currentUserRoles.includes('role_sysadmin');

  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleSaveRole = () => {
    if (editingRole) {
      if (isAddingNew) {
        addRole(editingRole);
      } else {
        updateRole(editingRole.id, editingRole);
      }
      setEditingRole(null);
      setIsAddingNew(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t('settings')}
        </h1>
      </div>

      <div className="bg-white dark:bg-[#16181d] rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800/60 flex items-center gap-3">
          <Shield className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('roleSimulation')}</h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {t('changeRoleDesc')}
          </p>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {roles.map(role => {
                const isSelected = currentUserRoles.includes(role.id);
                return (
                  <button
                    key={role.id}
                    onClick={() => {
                      if (isSelected) {
                        // Don't allow removing the last role
                        if (currentUserRoles.length > 1) {
                          setCurrentUserRoles(currentUserRoles.filter(id => id !== role.id));
                        }
                      } else {
                        setCurrentUserRoles([...currentUserRoles, role.id]);
                      }
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                      isSelected
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/20 dark:border-indigo-500/30 dark:text-indigo-300"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-[#0f1115] dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800/50"
                    )}
                  >
                    {t(role.id) || role.name}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('currentRoles') || 'Current Roles'}: {currentUserRoles.map(id => t(id) || roles.find(r => r.id === id)?.name).join(', ')}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#16181d] rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('roleManagement')}</h3>
          </div>
          <button
            onClick={() => {
              setIsAddingNew(true);
              setEditingRole({ id: `role_${Date.now()}`, name: '', permissions: [] });
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('addNewRole')}
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {roles.map(role => (
              <div key={role.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0f1115] rounded-xl border border-gray-100 dark:border-gray-800">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{t(role.id) || role.name}</h4>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {role.permissions.includes('all') ? (
                      <span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-md">All Access</span>
                    ) : (
                      role.permissions.map(p => (
                        <span key={p} className="text-xs px-2 py-1 bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300 rounded-md">
                          {t(p)}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                {role.id !== 'role_sysadmin' && (
                  <button
                    onClick={() => {
                      setIsAddingNew(false);
                      setEditingRole({ ...role });
                    }}
                    className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {isSysAdmin && (
        <div className="bg-white dark:bg-[#16181d] rounded-2xl border border-gray-100 dark:border-gray-800/60 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800/60 flex items-center gap-3">
            <User className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('profileSettings')}</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('fullName')}</label>
                <input
                  type="text"
                  value={currentUser?.fullName || ''}
                  readOnly
                  className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all opacity-70 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('email')}</label>
                <input
                  type="email"
                  value={currentUser?.email || ''}
                  readOnly
                  className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all opacity-70 cursor-not-allowed"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <p className="text-[10px] text-gray-500 italic">Profil bilgileri yalnızca sistem yöneticisi tarafından düzenlenebilir.</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingRole(null)} />
          <div className="relative bg-white dark:bg-[#16181d] rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800/60">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isAddingNew ? t('addNewRole') : t(editingRole.id) || editingRole.name}
              </h2>
              <button
                onClick={() => setEditingRole(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('roleName')}</label>
                <input
                  type="text"
                  value={editingRole.name}
                  onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#0f1115] border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:text-gray-200 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('permissions')} ({t('pages')})</label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {availablePages.map(page => {
                    const hasPerm = editingRole.permissions.includes(page) || editingRole.permissions.includes('all');
                    return (
                      <label key={page} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={hasPerm}
                          onChange={(e) => {
                            if (editingRole.permissions.includes('all')) return; // Can't toggle if all access
                            const newPerms = e.target.checked
                              ? [...editingRole.permissions, page]
                              : editingRole.permissions.filter(p => p !== page);
                            setEditingRole({ ...editingRole, permissions: newPerms });
                          }}
                          disabled={editingRole.permissions.includes('all')}
                          className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{t(page)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-end gap-3 bg-gray-50/50 dark:bg-[#0f1115]/50">
              <button
                onClick={() => setEditingRole(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSaveRole}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
