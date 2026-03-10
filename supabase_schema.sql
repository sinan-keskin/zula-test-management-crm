-- 1. Users Tablosu
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  game TEXT,
  region TEXT,
  in_game_username TEXT,
  system_username TEXT,
  full_name TEXT,
  email TEXT,
  roles TEXT[],
  status TEXT,
  status_changed_at TIMESTAMPTZ,
  description TEXT,
  deactivation_reason TEXT,
  has_system_access BOOLEAN DEFAULT true,
  password_reset_required BOOLEAN DEFAULT false,
  discord_id TEXT,
  password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Performances Tablosu
CREATE TABLE performances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  period TEXT, -- YYYY-MM
  test_participation INTEGER DEFAULT 0,
  participation_entries JSONB DEFAULT '[]',
  bug_reports INTEGER DEFAULT 0,
  suggestions INTEGER DEFAULT 0,
  details TEXT,
  support INTEGER DEFAULT 0,
  referee_performance INTEGER DEFAULT 0,
  referee_everyone_x INTEGER DEFAULT 0,
  referee_sabotage INTEGER DEFAULT 0,
  referee_entries JSONB DEFAULT '[]',
  referee_details TEXT,
  qa INTEGER DEFAULT 0,
  discord_pc INTEGER DEFAULT 0,
  discord_timeout INTEGER DEFAULT 0,
  discord_ban INTEGER DEFAULT 0,
  discord_message_delete INTEGER DEFAULT 0,
  manager_opinion INTEGER DEFAULT 0,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period)
);

-- 3. Logs Tablosu
CREATE TABLE logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  action TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  performed_by TEXT
);

-- 4. Roles Tablosu
CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  name TEXT,
  permissions TEXT[]
);

-- Örnek Roller (Varsayılanları manuel eklemek için)
INSERT INTO roles (id, name, permissions) VALUES
('role_sysadmin', 'System Administrator', '{"all"}'),
('role_compmgr', 'Company Manager', '{"users", "performanceManagement", "performanceReports"}'),
('role_compstaff', 'Company Staff', '{"users", "performanceManagement"}'),
('role_acadcap', 'Academy Captain', '{"academy", "performanceManagement"}'),
('role_acadmem', 'Academy Member', '{"academy"}'),
('role_fedaimem', 'Fedai Member', '{"academy"}'),
('role_headref', 'Head Referee', '{"referees", "performanceManagement"}'),
('role_ref', 'Referee', '{"referees"}'),
('role_obs', 'Observer', '{"referees"}'),
('role_discordmod', 'Discord Moderator', '{"users"}');
