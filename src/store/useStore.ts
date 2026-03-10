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
  password?: string;
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
  login: (username: string, password: string) => { success: boolean; message?: string; isFirstLogin?: boolean };
  logout: () => void;
  addUser: (user: User) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  updatePerformance: (userId: string, period: string, perf: Partial<Performance>) => Promise<void>;
  setCurrentUserRoles: (roles: Role[]) => void;
  addRole: (role: RoleDefinition) => Promise<void>;
  updateRole: (id: string, role: Partial<RoleDefinition>) => Promise<void>;
  migrateFromMock: () => Promise<{ success: boolean; message: string }>;
  fetchInitialData: () => Promise<void>;
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

const mockUsers: User[] = [
  {
    id: 'U001',
    game: 'ZULA',
    region: 'TR',
    inGameUsername: 'ZulaKing',
    systemUsername: 'zking_sys',
    fullName: 'Ahmet Yılmaz',
    email: 'ahmet@example.com',
    roles: ['role_acadcap'],
    status: 'Active',
    description: 'Experienced tester',
    hasSystemAccess: true,
  },
  {
    id: 'U002',
    game: 'ZULA STRIKE',
    region: 'EU',
    inGameUsername: 'StrikePro',
    systemUsername: 'strike_pro',
    fullName: 'John Doe',
    email: 'john@example.com',
    roles: ['role_ref', 'role_acadmem'],
    status: 'Active',
    description: 'Dual role member',
    hasSystemAccess: true,
  },
  {
    id: 'U003',
    game: 'WOLFTEAM',
    region: 'LATAM',
    inGameUsername: 'LoboLoco',
    systemUsername: 'lobo_loco',
    fullName: 'Carlos Santana',
    email: 'carlos@example.com',
    roles: ['role_obs'],
    status: 'Passive',
    statusChangedAt: '2026-02-15T00:00:00.000Z',
    description: 'Inactive for a while',
    deactivationReason: 'Personal reasons',
    hasSystemAccess: false,
  },
  {
    id: 'U004',
    game: 'ZULA',
    region: 'TR',
    inGameUsername: 'SniperTR',
    systemUsername: 'sniper_tr',
    fullName: 'Mehmet Demir',
    email: 'mehmet@example.com',
    roles: ['role_fedaimem'],
    status: 'Active',
    description: 'Good at finding map glitches',
    hasSystemAccess: true,
  },
  {
    id: 'U005',
    game: 'ZULA',
    region: 'TR',
    inGameUsername: 'ProGamer',
    systemUsername: 'pro_gamer',
    fullName: 'Ali Kaya',
    email: 'ali@example.com',
    roles: ['role_acadmem'],
    status: 'Active',
    description: 'Active participant',
    hasSystemAccess: true,
  },
  {
    id: 'U000',
    game: 'ZULA',
    region: 'TR',
    inGameUsername: 'Admin',
    systemUsername: 'admin',
    fullName: 'Sinan Keskin',
    email: 'info@sinankeskin.com.tr',
    roles: ['role_sysadmin'],
    status: 'Active',
    description: 'Main system administrator',
    hasSystemAccess: true,
  }
];

const mockPerformances: Performance[] = [
  {
    userId: 'U001',
    period: '2026-03',
    testParticipation: 10,
    bugReports: 5,
    suggestions: 2,
    details: '04, 09, 12x2, 17x2',
    support: 0,
    refereePerformance: 0,
    refereeEveryoneX: 0,
    refereeSabotage: 0,
    refereeEntries: [],
    refereeDetails: '',
    qa: 0,
    discordPc: 7,
    discordTimeout: 0,
    discordBan: 0,
    discordMessageDelete: 0,
    managerOpinion: 9,
    notes: 'Great contribution this month',
  },
  {
    userId: 'U002',
    period: '2026-03',
    testParticipation: 8,
    bugReports: 3,
    suggestions: 1,
    details: '01, 05, 10',
    support: 7,
    refereePerformance: 8,
    refereeEveryoneX: 4,
    refereeSabotage: 4,
    refereeEntries: [],
    refereeDetails: '',
    qa: 6,
    discordPc: 5,
    discordTimeout: 0,
    discordBan: 0,
    discordMessageDelete: 0,
    managerOpinion: 7,
    notes: 'Solid performance',
  },
  {
    userId: 'U003',
    period: '2026-03',
    testParticipation: 0,
    bugReports: 0,
    suggestions: 0,
    details: '',
    support: 0,
    refereePerformance: 0,
    refereeEveryoneX: 0,
    refereeSabotage: 0,
    refereeEntries: [],
    refereeDetails: '',
    qa: 0,
    discordPc: 0,
    discordTimeout: 0,
    discordBan: 0,
    discordMessageDelete: 0,
    managerOpinion: 0,
    notes: 'Inactive',
  },
  {
    userId: 'U004',
    period: '2026-03',
    testParticipation: 15,
    bugReports: 12,
    suggestions: 4,
    details: '02, 03x2, 05, 08x2, 11, 15',
    support: 9,
    refereePerformance: 0,
    refereeEveryoneX: 0,
    refereeSabotage: 0,
    refereeEntries: [],
    refereeDetails: '',
    qa: 10,
    discordPc: 8,
    discordTimeout: 0,
    discordBan: 0,
    discordMessageDelete: 0,
    managerOpinion: 10,
    notes: 'Exceptional bug reporting',
  },
  {
    userId: 'U005',
    period: '2026-03',
    testParticipation: 5,
    bugReports: 1,
    suggestions: 0,
    details: '07, 14, 21',
    support: 5,
    refereePerformance: 0,
    refereeEveryoneX: 0,
    refereeSabotage: 0,
    refereeEntries: [],
    refereeDetails: '',
    qa: 4,
    discordPc: 6,
    discordTimeout: 0,
    discordBan: 0,
    discordMessageDelete: 0,
    managerOpinion: 5,
    notes: 'Needs to improve participation',
  }
];

export const useStore = create<AppState>((set, get) => ({
  isDark: (() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  })(),
  users: mockUsers,
  performances: mockPerformances,
  logs: [],
  roles: defaultRoles,
  currentUserRoles: ['role_sysadmin'],
  currentUserId: '',
  isAuthenticated: false,

  migrateFromMock: async () => {
    try {
      // 1. Kullanıcıları taşı
      const usersToInsert = mockUsers.map(u => ({
        ...u,
        in_game_username: u.inGameUsername,
        system_username: u.systemUsername,
        full_name: u.fullName,
        has_system_access: u.hasSystemAccess
      }));
      const { error: userError } = await supabase.from('users').upsert(usersToInsert);
      if (userError) throw userError;

      // 2. Performansları taşı
      const perfsToInsert = mockPerformances.map(p => ({
        ...p,
        user_id: p.userId,
        test_participation: p.testParticipation,
        bug_reports: p.bugReports,
        referee_performance: p.refereePerformance,
        referee_everyone_x: p.refereeEveryoneX,
        referee_sabotage: p.refereeSabotage,
        discord_pc: p.discordPc,
        manager_opinion: p.managerOpinion
      }));
      const { error: perfError } = await supabase.from('performances').upsert(perfsToInsert);
      if (perfError) throw perfError;

      // 3. Rolleri taşı
      const { error: roleError } = await supabase.from('roles').upsert(defaultRoles);
      if (roleError) throw roleError;

      await get().fetchInitialData();
      return { success: true, message: 'Veriler başarıyla Supabase\'e aktarıldı!' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  fetchInitialData: async () => {
    const { data: users } = await supabase.from('users').select('*');
    const { data: performances } = await supabase.from('performances').select('*');
    const { data: logs } = await supabase.from('logs').select('*').order('timestamp', { ascending: false });
    const { data: roles } = await supabase.from('roles').select('*');

    const newState: any = {};
    if (users && users.length > 0) {
      newState.users = users.map(u => ({
        ...u,
        inGameUsername: u.in_game_username,
        systemUsername: u.system_username,
        fullName: u.full_name,
        email: u.email,
        roles: u.roles,
        status: u.status,
        description: u.description,
        hasSystemAccess: u.has_system_access,
        passwordResetRequired: u.password_reset_required,
        password: u.password,
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

  login: (username, password) => {
    const state = get();
    const cleanUsername = username.toLowerCase().trim();
    // Fallback if users list is empty (first run)
    const usersToSearch = state.users.length > 0 ? state.users : mockUsers;

    const user = usersToSearch.find(u =>
      (u.systemUsername?.toLowerCase() === cleanUsername ||
        u.email?.toLowerCase() === cleanUsername) &&
      u.hasSystemAccess
    );

    if (!user) {
      return { success: false, message: 'Kullanıcı bulunamadı veya sistem erişimi yok.' };
    }

    if (!user.password) {
      supabase.from('users').update({ password: password }).eq('id', user.id).then(() => get().fetchInitialData());
      set({
        currentUserId: user.id,
        currentUserRoles: user.roles,
        isAuthenticated: true
      });
      return { success: true, isFirstLogin: true };
    }

    if (user.password === password) {
      set({
        currentUserId: user.id,
        currentUserRoles: user.roles,
        isAuthenticated: true
      });
      return { success: true };
    }

    return { success: false, message: 'Hatalı şifre.' };
  },
  logout: () => set({
    currentUserId: '',
    currentUserRoles: [],
    isAuthenticated: false
  }),
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
