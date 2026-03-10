import { create } from 'zustand';

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
  login: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  addUser: (user: User) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  updatePerformance: (userId: string, period: string, perf: Partial<Performance>) => void;
  setCurrentUserRoles: (roles: Role[]) => void;
  addLog: (log: UserLog) => void;
  addRole: (role: RoleDefinition) => void;
  updateRole: (id: string, role: Partial<RoleDefinition>) => void;
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
  addUser: (user) => set((state) => ({ users: [...state.users, user] })),
  updateUser: (id, updatedUser) => set((state) => ({
    users: state.users.map(u => {
      if (u.id !== id) return u;
      const statusChanged = updatedUser.status && updatedUser.status !== u.status;
      return {
        ...u,
        ...updatedUser,
        ...(statusChanged ? { statusChangedAt: new Date().toISOString() } : {})
      };
    })
  })),
  updatePerformance: (userId, period, updatedPerf) => set((state) => {
    const existingIndex = state.performances.findIndex(p => p.userId === userId && p.period === period);

    if (existingIndex > -1) {
      const updatedPerformances = [...state.performances];
      updatedPerformances[existingIndex] = { ...updatedPerformances[existingIndex], ...updatedPerf };
      return { performances: updatedPerformances };
    } else {
      const newRecord: Performance = {
        userId,
        period,
        testParticipation: 0,
        participationEntries: [],
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
        notes: '',
        ...updatedPerf
      };
      return { performances: [...state.performances, newRecord] };
    }
  }),
  setCurrentUserRoles: (roles) => set({ currentUserRoles: roles }),
  addLog: (log) => set((state) => ({ logs: [log, ...state.logs] })),
  addRole: (role) => set((state) => ({ roles: [...state.roles, role] })),
  updateRole: (id, updatedRole) => set((state) => ({
    roles: state.roles.map(r => r.id === id ? { ...r, ...updatedRole } : r)
  })),
  login: (username, password) => {
    const state = useStore.getState();
    const userIndex = state.users.findIndex(u => (u.systemUsername === username || u.email === username) && u.hasSystemAccess);

    if (userIndex === -1) {
      return { success: false, message: 'Kullanıcı bulunamadı veya sistem erişimi yok.' };
    }

    const user = state.users[userIndex];

    // Password setting on first login
    if (!user.password) {
      const updatedUsers = [...state.users];
      updatedUsers[userIndex] = { ...user, password: password };
      set({
        users: updatedUsers,
        currentUserId: user.id,
        currentUserRoles: user.roles,
        isAuthenticated: true
      });
      return { success: true };
    }

    // Password verification
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
