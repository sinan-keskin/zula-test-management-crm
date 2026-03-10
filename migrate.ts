import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// .env dosyasını oku
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Hata: .env dosyasında Supabase bilgileri eksik!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const mockUsers = [
    {
        id: 'U001',
        game: 'ZULA',
        region: 'TR',
        in_game_username: 'ZulaKing',
        system_username: 'zking_sys',
        full_name: 'Ahmet Yılmaz',
        email: 'ahmet@example.com',
        roles: ['role_acadcap'],
        status: 'Active',
        description: 'Experienced tester',
        has_system_access: true,
    },
    {
        id: 'U002',
        game: 'ZULA STRIKE',
        region: 'EU',
        in_game_username: 'StrikePro',
        system_username: 'strike_pro',
        full_name: 'John Doe',
        email: 'john@example.com',
        roles: ['role_ref', 'role_acadmem'],
        status: 'Active',
        description: 'Dual role member',
        has_system_access: true,
    },
    {
        id: 'U003',
        game: 'WOLFTEAM',
        region: 'LATAM',
        in_game_username: 'LoboLoco',
        system_username: 'lobo_loco',
        full_name: 'Carlos Santana',
        email: 'carlos@example.com',
        roles: ['role_obs'],
        status: 'Passive',
        status_changed_at: '2026-02-15T00:00:00.000Z',
        description: 'Inactive for a while',
        deactivation_reason: 'Personal reasons',
        has_system_access: false,
    },
    {
        id: 'U004',
        game: 'ZULA',
        region: 'TR',
        in_game_username: 'SniperTR',
        system_username: 'sniper_tr',
        full_name: 'Mehmet Demir',
        email: 'mehmet@example.com',
        roles: ['role_fedaimem'],
        status: 'Active',
        description: 'Good at finding map glitches',
        has_system_access: true,
    },
    {
        id: 'U005',
        game: 'ZULA',
        region: 'TR',
        in_game_username: 'ProGamer',
        system_username: 'pro_gamer',
        full_name: 'Ali Kaya',
        email: 'ali@example.com',
        roles: ['role_acadmem'],
        status: 'Active',
        description: 'Active participant',
        has_system_access: true,
    },
    {
        id: 'U000',
        game: 'ZULA',
        region: 'TR',
        in_game_username: 'Admin',
        system_username: 'admin',
        full_name: 'Sinan Keskin',
        email: 'info@sinankeskin.com.tr',
        roles: ['role_sysadmin'],
        status: 'Active',
        description: 'Main system administrator',
        has_system_access: true,
    }
];

const mockPerformances = [
    {
        user_id: 'U001',
        period: '2026-03',
        test_participation: 10,
        bug_reports: 5,
        suggestions: 2,
        details: '04, 09, 12x2, 17x2',
        support: 0,
        referee_performance: 0,
        referee_everyone_x: 0,
        referee_sabotage: 0,
        referee_entries: [],
        referee_details: '',
        qa: 0,
        discord_pc: 7,
        discord_timeout: 0,
        discord_ban: 0,
        discord_message_delete: 0,
        manager_opinion: 9,
        notes: 'Great contribution this month',
    },
    {
        user_id: 'U002',
        period: '2026-03',
        test_participation: 8,
        bug_reports: 3,
        suggestions: 1,
        details: '01, 05, 10',
        support: 7,
        referee_performance: 8,
        referee_everyone_x: 4,
        referee_sabotage: 4,
        referee_entries: [],
        referee_details: '',
        qa: 6,
        discord_pc: 5,
        discord_timeout: 0,
        discord_ban: 0,
        discord_message_delete: 0,
        manager_opinion: 7,
        notes: 'Solid performance',
    },
    {
        user_id: 'U004',
        period: '2026-03',
        test_participation: 15,
        bug_reports: 12,
        suggestions: 4,
        details: '02, 03x2, 05, 08x2, 11, 15',
        support: 9,
        referee_performance: 0,
        referee_everyone_x: 0,
        referee_sabotage: 0,
        referee_entries: [],
        referee_details: '',
        qa: 10,
        discord_pc: 8,
        discord_timeout: 0,
        discord_ban: 0,
        discord_message_delete: 0,
        manager_opinion: 10,
        notes: 'Exceptional bug reporting',
    },
    {
        user_id: 'U005',
        period: '2026-03',
        test_participation: 5,
        bug_reports: 1,
        suggestions: 0,
        details: '07, 14, 21',
        support: 5,
        referee_performance: 0,
        referee_everyone_x: 0,
        referee_sabotage: 0,
        referee_entries: [],
        referee_details: '',
        qa: 4,
        discord_pc: 6,
        discord_timeout: 0,
        discord_ban: 0,
        discord_message_delete: 0,
        manager_opinion: 5,
        notes: 'Needs to improve participation',
    }
];

async function migrate() {
    console.log('Veri taşıma işlemi başlatıldı...');

    // Kullanıcıları yükle
    const { error: userError } = await supabase.from('users').upsert(mockUsers);
    if (userError) console.error('Kullanıcı yükleme hatası:', userError);
    else console.log('Kullanıcılar başarıyla yüklendi.');

    // Performansları yükle
    const { error: perfError } = await supabase.from('performances').upsert(mockPerformances);
    if (perfError) console.error('Performans yükleme hatası:', perfError);
    else console.log('Performanslar başarıyla yüklendi.');

    console.log('İşlem tamamlandı.');
}

migrate();
