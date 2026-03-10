import { create } from 'zustand';
import { proxyApi } from '../lib/api';

export type Game = 'ZULA' | 'ZULA STRIKE' | 'WOLFTEAM';
export type Region = 'TR' | 'EU' | 'LATAM' | 'AXESO5' | 'MbRussia';

export type Role = string;

export interface RoleDefinition {
  id: string;
  name: string;
  permissions: string[];
}

export interface UserLog {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  performedBy: string;
}

export interface User {
  id: string;
  game: Game;
  region: Region;
  inGameUsername: string;
  systemUsername: string;
  fullName: string;
  email: string;
  roles: Role[];
  status: 'Active' | 'Passive';
  statusChangedAt?: string;
  description: string;
  deactivationReason?: string;
  hasSystemAccess?: boolean;
  passwordResetRequired?: boolean;
  discordId?: string;
  customId: string;
}

export interface ParticipationEntry {
  id: string;
  day: number;
  multiplier: number;
}

export type RefereeType = 'EVERYONE' | 'SABOTAGE';

export interface RefereeEntry {
  id: string;
  day: number;
  multiplier: number;
  type: RefereeType;
}

export interface Performance {
  userId: string;
  period: string;
  testParticipation: number;
  participationEntries?: ParticipationEntry[];
  bugReports: number;
  suggestions: number;
  details: string;
  support: number;
  refereePerformance: number;
  refereeEveryoneX: number;
  refereeSabotage: number;
  refereeEntries: RefereeEntry[];
  refereeDetails: string;
  qa: number;
  discordPc: number;
  discordTimeout: number;
  discordBan: number;
  discordMessageDelete: number;
  managerOpinion: number;
  notes: string;
}

interface AppState {
  users: User[];
  performances: Performance[];
  logs: UserLog[];
  roles: RoleDefinition[];
  currentUserRoles: Role[];
  currentUserId: string;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updatePerformance: (userId: string, period: string, perf: Partial<Performance>) => Promise<void>;
  setCurrentUserRoles: (roles: Role[]) => void;
  addRole: (role: RoleDefinition) => Promise<void>;
  updateRole: (id: string, role: Partial<RoleDefinition>) => Promise<void>;
  fetchInitialData: () => Promise<void>;
  checkAuth: () => Promise<void>;
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
}

const defaultRoles: RoleDefinition[] = [
  { id: 'role_sysadmin', name: 'System Administrator', permissions: ['all'] },
  { id: 'role_compmgr', name: 'Company Manager', permissions: ['users', 'performanceManagement', 'performanceReports'] },
  { id: 'role_compstaff', name: 'Company Staff', permissions: ['users', 'performanceManagement'] },
  { id: 'role_acadcap', name: 'Academy Captain', permissions: ['academy', 'performanceManagement'] },
  { id: 'role_acadmem', name: 'Academy Member', permissions: ['academy'] },
  { id: 'role_fedaimem', name: 'Fedai Member', permissions: ['academy'] },
  { id: 'role_headref', name: 'Head Referee', permissions: ['referees', 'performanceManagement'] },
  { id: 'role_ref', name: 'Referee', permissions: ['referees'] },
  { id: 'role_obs', name: 'Observer', permissions: ['referees'] },
  { id: 'role_discordmod', name: 'Discord Moderator', permissions: ['users'] },
];

export const useStore = create<AppState>((set, get) => ({
  isDark: (() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  })(),
  users: [],
  performances: [],
  logs: [],
  roles: defaultRoles,
  currentUserRoles: [],
  currentUserId: '',
  isAuthenticated: false,

  fetchInitialData: async () => {
    try {
      const usersRes = await proxyApi.getData('users');
      const performancesRes = await proxyApi.getData('performances');
      const logsRes = await proxyApi.getData('logs', { order: 'timestamp', ascending: 'false' });
      const rolesRes = await proxyApi.getData('roles');

      if (usersRes.error) {
        console.error('Kullanıcı verisi alınamadı:', usersRes.error);
        set({ users: [] });
        return;
      }

      const users = usersRes.data || [];
      const performances = performancesRes.data || [];
      const logs = logsRes.data || [];
      const roles = rolesRes.data || [];

      const newState: any = { roles: roles.length > 0 ? roles : defaultRoles };

      if (Array.isArray(users)) {
        newState.users = users.map(u => ({
          ...u,
          inGameUsername: u.in_game_username || '',
          systemUsername: u.system_username || '',
          fullName: u.full_name || '',
          description: u.description || '',
          deactivationReason: u.deactivation_reason || '',
          hasSystemAccess: u.has_system_access,
          passwordResetRequired: u.password_reset_required,
          discordId: u.discord_id || '',
          statusChangedAt: u.status_changed_at || '',
          customId: u.custom_id || u.id // Eğer custom_id yoksa teknik ID'yi göster
        }));
      }

      if (Array.isArray(performances)) {
        newState.performances = performances.map(p => ({
          ...p,
          userId: p.user_id,
          participationEntries: p.participation_entries,
          bugReports: p.bug_reports,
          refereePerformance: p.referee_performance,
          refereeEveryoneX: p.referee_everyone_x,
          refereeSabotage: p.referee_sabotage,
          refereeEntries: p.referee_entries,
          refereeDetails: p.referee_details,
          discordPc: p.discord_pc,
          discordTimeout: p.discord_timeout,
          discordBan: p.discord_ban,
          discordMessageDelete: p.discord_message_delete,
          managerOpinion: p.manager_opinion
        }));
      }

      if (Array.isArray(logs)) {
        newState.logs = logs.map(l => ({
          ...l,
          userId: l.user_id,
          performedBy: l.performed_by
        }));
      }

      set(newState);
    } catch (err) {
      console.warn('Proxy veri çekme hatası:', err);
      set({ users: [] });
    }
  },

  addUser: async (user) => {
    await proxyApi.postData('users', {
      ...user,
      in_game_username: user.inGameUsername,
      system_username: user.systemUsername,
      full_name: user.fullName,
      has_system_access: user.hasSystemAccess,
      password_reset_required: user.passwordResetRequired,
      discord_id: user.discordId,
      status_changed_at: user.statusChangedAt,
      custom_id: user.customId
    });
    get().fetchInitialData();
  },

  updateUser: async (id, updatedUser) => {
    // 1. Optimistic Update: Yerel state'i anında güncelle
    const previousUsers = get().users;
    set(state => ({
      users: state.users.map(u => u.id === id ? { ...u, ...updatedUser } : u)
    }));

    const dbData: any = { id };
    if (updatedUser.game !== undefined) dbData.game = updatedUser.game;
    if (updatedUser.region !== undefined) dbData.region = updatedUser.region;
    if (updatedUser.inGameUsername !== undefined) dbData.in_game_username = updatedUser.inGameUsername;
    if (updatedUser.systemUsername !== undefined) dbData.system_username = updatedUser.systemUsername;
    if (updatedUser.fullName !== undefined) dbData.full_name = updatedUser.fullName;
    if (updatedUser.email !== undefined) dbData.email = updatedUser.email;
    if (updatedUser.roles !== undefined) dbData.roles = updatedUser.roles;
    if (updatedUser.status !== undefined) dbData.status = updatedUser.status;
    if (updatedUser.description !== undefined) dbData.description = updatedUser.description;
    if (updatedUser.statusChangedAt !== undefined) dbData.status_changed_at = updatedUser.statusChangedAt;
    if (updatedUser.deactivationReason !== undefined) dbData.deactivation_reason = updatedUser.deactivationReason;
    if (updatedUser.hasSystemAccess !== undefined) dbData.has_system_access = updatedUser.hasSystemAccess;
    if (updatedUser.passwordResetRequired !== undefined) dbData.password_reset_required = updatedUser.passwordResetRequired;
    if (updatedUser.discordId !== undefined) dbData.discord_id = updatedUser.discordId;
    if (updatedUser.customId !== undefined) dbData.custom_id = updatedUser.customId;

    try {
      const response = await proxyApi.patchData('users', dbData);
      if (response.error) throw response.error;
      
      // 2. Sunucudaki son hali doğrula (arka planda)
      await get().fetchInitialData();
    } catch (err) {
      console.error('Kullanıcı güncelleme hatası:', err);
      // Hata durumunda eski state'e geri dön
      set({ users: previousUsers });
    }
  },

  deleteUser: async (id) => {
    await proxyApi.deleteData('users', id);
    get().fetchInitialData();
  },

  updatePerformance: async (userId, period, updatedPerf) => {
    const dbData: any = {
      user_id: userId,
      period,
      ...updatedPerf
    };

    // CamelCase -> Snake_case dönüşümleri
    if (updatedPerf.testParticipation !== undefined) dbData.test_participation = updatedPerf.testParticipation;
    if (updatedPerf.participationEntries !== undefined) dbData.participation_entries = updatedPerf.participationEntries;
    if (updatedPerf.bugReports !== undefined) dbData.bug_reports = updatedPerf.bugReports;
    if (updatedPerf.refereePerformance !== undefined) dbData.referee_performance = updatedPerf.refereePerformance;
    if (updatedPerf.refereeEveryoneX !== undefined) dbData.referee_everyone_x = updatedPerf.refereeEveryoneX;
    if (updatedPerf.refereeSabotage !== undefined) dbData.referee_sabotage = updatedPerf.refereeSabotage;
    if (updatedPerf.refereeEntries !== undefined) dbData.referee_entries = updatedPerf.refereeEntries;
    if (updatedPerf.refereeDetails !== undefined) dbData.referee_details = updatedPerf.refereeDetails;
    if (updatedPerf.discordPc !== undefined) dbData.discord_pc = updatedPerf.discordPc;
    if (updatedPerf.discordTimeout !== undefined) dbData.discord_timeout = updatedPerf.discordTimeout;
    if (updatedPerf.discordBan !== undefined) dbData.discord_ban = updatedPerf.discordBan;
    if (updatedPerf.discordMessageDelete !== undefined) dbData.discord_message_delete = updatedPerf.discordMessageDelete;
    if (updatedPerf.managerOpinion !== undefined) dbData.manager_opinion = updatedPerf.managerOpinion;

    // React state içinde kalan eski camelCase anahtarları temizle (Supabase hata vermesin diye)
    delete dbData.testParticipation;
    delete dbData.participationEntries;
    delete dbData.bugReports;
    delete dbData.refereePerformance;
    delete dbData.refereeEveryoneX;
    delete dbData.refereeSabotage;
    delete dbData.refereeEntries;
    delete dbData.refereeDetails;
    delete dbData.discordPc;
    delete dbData.discordTimeout;
    delete dbData.discordBan;
    delete dbData.discordMessageDelete;
    delete dbData.managerOpinion;
    delete dbData.userId; // user_id olarak zaten var

    await proxyApi.postData('performances', dbData);
    get().fetchInitialData();
  },

  login: async (username, password) => {
    try {
      const response = await proxyApi.signIn(username, password);
      
      // Hata kontrolü
      if (response.error) {
        throw response.error;
      }

      const authData = response.data;
      if (!authData?.user?.email) {
        throw new Error('Kullanıcı bilgileri alınamadı.');
      }

      const profile = await proxyApi.getData('users', { 
        email: `eq.${authData.user.email}`,
        has_system_access: 'eq.true'
      });

      if (!profile || !Array.isArray(profile) || profile.length === 0) {
        await proxyApi.signOut();
        return { success: false, message: 'Profil bulunamadı veya yetkiniz yok.' };
      }

      set({
        currentUserId: profile[0].id,
        currentUserRoles: profile[0].roles || [],
        isAuthenticated: true
      });

      await get().fetchInitialData();
      return { success: true };
    } catch (err: any) {
      console.error('Login Hatası Detayı:', err);
      let msg = err.message || 'Giriş işlemi sırasında teknik bir hata oluştu.';
      
      if (msg === 'Failed to fetch') {
        msg = 'Bağlantı Hatası: Lütfen "Bağlantıyı Onayla" butonuna tıklayıp açılan sayfada "Gelişmiş -> Devam Et" diyerek sisteme güvenin.';
      } else if (msg.includes('Invalid login credentials')) {
        msg = 'Hatalı e-posta veya şifre.';
      }
      
      return { success: false, message: msg };
    }
  },

  logout: async () => {
    await proxyApi.signOut();
    set({ currentUserId: '', currentUserRoles: [], isAuthenticated: false });
  },

  checkAuth: async () => {
    // Proxy oturum kontrolü (Opsiyonel: Eğer Proxy JWT dönüyorsa burada kontrol edilebilir)
    // Şimdilik oturum kontrolünü basit tutuyoruz.
  },

  setCurrentUserRoles: (roles) => set({ currentUserRoles: roles }),

  addLog: async (log) => {
    await proxyApi.postData('logs', {
      user_id: log.userId,
      action: log.action,
      performed_by: log.performedBy
    });
    get().fetchInitialData();
  },

  addRole: async (role) => {
    await proxyApi.postData('roles', role);
    get().fetchInitialData();
  },

  updateRole: async (id, updatedRole) => {
    await proxyApi.patchData('roles', { id, ...updatedRole });
    get().fetchInitialData();
  },

  setIsDark: (isDark) => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ isDark });
  }
}));
