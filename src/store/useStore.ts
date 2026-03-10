import { create } from 'zustand';
import { supabase } from '../lib/supabase';

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
  statusChangedAt?: string; // ISO date string - tracks when status last changed
  description: string;
  deactivationReason?: string;
  hasSystemAccess?: boolean;
  passwordResetRequired?: boolean;
  discordId?: string;
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
  period: string; // YYYY-MM
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
  discordPc: number; // legacy combined field (for table display)
  discordTimeout: number; // Uzaklaştırma/Zaman Aşımı x25
  discordBan: number; // Yasaklama x25
  discordMessageDelete: number; // Mesaj Silme x10
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
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string; isFirstLogin?: boolean }>;
  logout: () => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
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
      const { data: users, error: uError } = await supabase.from('users').select('*');
      const { data: performances, error: pError } = await supabase.from('performances').select('*');
      const { data: logs, error: lError } = await supabase.from('logs').select('*').order('timestamp', { ascending: false });
      const { data: roles, error: rError } = await supabase.from('roles').select('*');

      if (uError || pError || lError || rError) {
        console.warn('Supabase veri çekme hatası:', uError || pError || lError || rError);
        // Hata durumunda (SSL vb.) kullanıcı listesini boşaltalım ki mock verilerle giriş yapılmasın
        set({ users: [] });
        return;
      }

      const newState: any = {};
      if (users && users.length > 0) {
        newState.users = users.map(u => ({
          ...u,
          inGameUsername: u.in_game_username,
          systemUsername: u.system_username,
          fullName: u.full_name,
          email: u.email,
          roles: u.roles || [],
          status: u.status,
          description: u.description,
          hasSystemAccess: u.has_system_access,
          passwordResetRequired: u.password_reset_required,
          discordId: u.discord_id,
          statusChangedAt: u.status_changed_at
        }));
      }

      if (performances && performances.length > 0) {
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

      if (logs && logs.length > 0) {
        newState.logs = logs.map(l => ({
          ...l,
          userId: l.user_id,
          performedBy: l.performed_by
        }));
      }

      if (roles && roles.length > 0) {
        newState.roles = roles;
      }

      if (Object.keys(newState).length > 0) {
        set(newState);
      }
    } catch (err) {
      console.warn('Güvenli veritabanı bağlantısı kısıtlı. Veriler canlı olarak çekilemiyor.');
      // Güvenlik için: Veritabanına ulaşılamıyorsa kullanıcı listesini boşaltalım
      set({ users: [] });
    }
  },

  addUser: async (user) => {
    const { error } = await supabase.from('users').insert([{
      ...user,
      in_game_username: user.inGameUsername,
      system_username: user.systemUsername,
      full_name: user.fullName,
      has_system_access: user.hasSystemAccess,
      password_reset_required: user.passwordResetRequired,
      discord_id: user.discordId,
      status_changed_at: user.statusChangedAt
    }]);
    if (!error) get().fetchInitialData();
  },

  updateUser: async (id, updatedUser) => {
    const statusChanged = updatedUser.status && updatedUser.status !== get().users.find(u => u.id === id)?.status;
    const updateData = {
      ...updatedUser,
      ...(statusChanged ? { status_changed_at: new Date().toISOString() } : {})
    };

    // Camelcase to snake_case conversion for Supabase
    const dbData: any = {};
    if (updateData.inGameUsername) dbData.in_game_username = updateData.inGameUsername;
    if (updateData.systemUsername) dbData.system_username = updateData.systemUsername;
    if (updateData.fullName) dbData.full_name = updateData.fullName;
    if (updateData.hasSystemAccess !== undefined) dbData.has_system_access = updateData.hasSystemAccess;
    if (updateData.status) dbData.status = updateData.status;
    if (updateData.email) dbData.email = updateData.email;
    if (updateData.roles) dbData.roles = updateData.roles;
    if (dbData.status_changed_at) dbData.status_changed_at = updateData.status_changed_at;

    const { error } = await supabase.from('users').update(dbData).eq('id', id);
    if (!error) get().fetchInitialData();
  },

  updatePerformance: async (userId, period, updatedPerf) => {
    const dbData: any = {
      user_id: userId,
      period,
      ...updatedPerf
    };

    // Map camcelCase to snake_case for Supabase
    if (updatedPerf.testParticipation !== undefined) dbData.test_participation = updatedPerf.testParticipation;
    if (updatedPerf.participationEntries) dbData.participation_entries = updatedPerf.participationEntries;
    if (updatedPerf.bugReports !== undefined) dbData.bug_reports = updatedPerf.bugReports;
    if (updatedPerf.refereePerformance !== undefined) dbData.referee_performance = updatedPerf.refereePerformance;
    if (updatedPerf.refereeEveryoneX !== undefined) dbData.referee_everyone_x = updatedPerf.refereeEveryoneX;
    if (updatedPerf.refereeSabotage !== undefined) dbData.referee_sabotage = updatedPerf.refereeSabotage;
    if (updatedPerf.refereeEntries) dbData.referee_entries = updatedPerf.refereeEntries;
    if (updatedPerf.refereeDetails !== undefined) dbData.referee_details = updatedPerf.refereeDetails;
    if (updatedPerf.discordPc !== undefined) dbData.discord_pc = updatedPerf.discordPc;
    if (updatedPerf.discordTimeout !== undefined) dbData.discord_timeout = updatedPerf.discordTimeout;
    if (updatedPerf.discordBan !== undefined) dbData.discord_ban = updatedPerf.discordBan;
    if (updatedPerf.discordMessageDelete !== undefined) dbData.discord_message_delete = updatedPerf.discordMessageDelete;
    if (updatedPerf.managerOpinion !== undefined) dbData.manager_opinion = updatedPerf.managerOpinion;

    const { error } = await supabase.from('performances').upsert([dbData], { onConflict: 'user_id,period' });
    if (!error) get().fetchInitialData();
  },

  setCurrentUserRoles: (roles) => set({ currentUserRoles: roles }),

  addLog: async (log) => {
    const { error } = await supabase.from('logs').insert([{
      user_id: log.userId,
      action: log.action,
      performed_by: log.performedBy
    }]);
    if (!error) get().fetchInitialData();
  },

  addRole: async (role) => {
    const { error } = await supabase.from('roles').insert([role]);
    if (!error) get().fetchInitialData();
  },

  updateRole: async (id, updatedRole) => {
    const { error } = await supabase.from('roles').update(updatedRole).eq('id', id);
    if (!error) get().fetchInitialData();
  },

  login: async (username, password) => {
    const cleanInput = username.trim();
    let email = cleanInput;

    try {
      // Eğer kullanıcı adı girildiyse, veritabanından e-postasını bulalım
      if (!cleanInput.includes('@')) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .ilike('system_username', cleanInput)
          .single();
        
        if (userData?.email) {
          email = userData.email;
        } else if (userError) {
          console.warn('Kullanıcı adına göre e-posta bulunamadı:', userError.message);
        }
      }

      // Supabase Auth ile giriş yap
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const authUser = data.user;
      if (!authUser) throw new Error('Kimlik bilgileri alınamadı.');

      // Profil verilerini çek
      const { data: profiles, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .eq('has_system_access', true)
        .limit(1);

      if (profileError) throw profileError;
      const profile = profiles?.[0];

      if (!profile) {
        // Eğer Auth'da var ama users tablosunda yoksa/erişimi yoksa
        await supabase.auth.signOut();
        return { success: false, message: 'Sistem profiliniz bulunamadı veya yetkiniz yok.' };
      }

      set({
        currentUserId: profile.id,
        currentUserRoles: profile.roles || [],
        isAuthenticated: true
      });

      await get().fetchInitialData();
      return { success: true };

    } catch (err: any) {
      console.error('Auth Login hatası:', err.message);
      let msg = 'Giriş başarısız: ' + err.message;
      if (err.message.includes('Invalid login credentials')) msg = 'Hatalı e-posta/kullanıcı adı veya şifre.';
      if (err.message.includes('Failed to fetch')) msg = 'Güvenli bağlantı kurulamadı (SSL/Tarih hatası).';
      
      return { success: false, message: msg };
    }
  },
  logout: async () => {
    await supabase.auth.signOut();
    set({
      currentUserId: '',
      currentUserRoles: [],
      isAuthenticated: false
    });
  },
  checkAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('email', session.user.email)
        .eq('has_system_access', true)
        .single();

      if (profile) {
        set({
          currentUserId: profile.id,
          currentUserRoles: profile.roles || [],
          isAuthenticated: true
        });
        await get().fetchInitialData();
      }
    }
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
