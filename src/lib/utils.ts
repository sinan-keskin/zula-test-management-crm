import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateParticipationTotal(details: string): number {
  if (!details) return 0;
  const parts = details.split(',').map(p => p.trim());
  let total = 0;
  for (const part of parts) {
    if (part.includes('x2')) {
      total += 2;
    } else if (part) {
      total += 1;
    }
  }
  return total;
}

export function calculateOverallPerformance(perf: any): number {
  return (
    (Number(perf.testParticipation || 0) * 1000) +
    (Number(perf.bugReports || 0) * 1000) +
    (Number(perf.suggestions || 0) * 1000) +
    (Number(perf.refereeEveryoneX || 0) * 2000) +
    (Number(perf.refereeSabotage || 0) * 5000) +
    (Number(perf.discordTimeout || 0) * 25) +
    (Number(perf.discordBan || 0) * 25) +
    (Number(perf.discordMessageDelete || 0) * 10) +
    (Number(perf.managerOpinion || 0))
  );
}

export function getRoleLevel(roleId: string): number {
  const levels: Record<string, number> = {
    role_sysadmin: 100,
    role_compmgr: 90,
    role_compstaff: 80,
    role_acadcap: 70,
    role_headref: 70,
    role_acadmem: 60,
    role_fedaimem: 60,
    role_ref: 60,
    role_obs: 50,
    role_discordmod: 40,
  };
  return levels[roleId] || 0;
}

export function getUserLevel(roles: string[]): number {
  if (!roles || roles.length === 0) return 0;
  return Math.max(...roles.map(getRoleLevel));
}
