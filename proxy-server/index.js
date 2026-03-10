const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Supabase Bağlantısı
const supabaseUrl = (process.env.SUPABASE_URL || 'https://qkrpafzzkfydcytmvgql.supabase.co').trim();
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcnBhZnp6a2Z5ZGN5dG12Z3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjk0MjQsImV4cCI6MjA4ODc0NTQyNH0.LtvqeYaGCe5eBy9GAXCB3SKNDzWrjxfZ6DZDGQRoTd4').trim();

console.log(`Supabase Bağlantı Denemesi: ${supabaseUrl}`);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- TEST / HEALTH CHECK ---
app.get('/', (req, res) => {
    res.send('Zula Proxy Sunucusu Aktif! Bağlantı başarılı.');
});

// --- AUTH PROXY ---
app.post('/auth/signin', async (req, res) => {
    const { email, password } = req.body;
    console.log(`Giriş denemesi: ${email}`);
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) console.error('Supabase Auth Hatası:', error.message);
        res.json({ data, error });
    } catch (e) {
        console.error('Proxy İstek Hatası:', e.message);
        res.status(500).json({ error: { message: e.message } });
    }
});

app.post('/auth/signout', async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();
        res.json({ error });
    } catch (e) {
        res.status(500).json({ error: { message: e.message } });
    }
});

// --- DATA PROXY ---
app.get('/api/:table', async (req, res) => {
    const { table } = req.params;
    const { select = '*', order, ascending = 'false', ...filters } = req.query;
    
    console.log(`Veri isteği: ${table}`, filters);

    try {
        let query = supabase.from(table).select(select);
        
        // Dinamik filtreler (örn: email=eq.info@... -> email: info@...)
        Object.entries(filters).forEach(([key, value]) => {
            if (typeof value === 'string' && value.startsWith('eq.')) {
                query = query.eq(key, value.replace('eq.', ''));
            } else {
                query = query.eq(key, value);
            }
        });

        if (order) query = query.order(order, { ascending: ascending === 'true' });
        
        const { data, error } = await query;
        if (error) {
            console.error(`Supabase Hatası [${table}]:`, error.message);
            return res.status(400).json({ error });
        }
        res.json(data || []);
    } catch (e) {
        console.error('Sistem Hatası:', e.message);
        res.status(500).json({ message: e.message });
    }
});

app.post('/api/:table', async (req, res) => {
    const { table } = req.params;
    const payload = req.body;
    
    try {
        // Performans tablosu için upsert (onConflict: user_id, period) kullanıyoruz
        let query = supabase.from(table).upsert(payload, { 
            onConflict: table === 'performances' ? 'user_id,period' : 'id' 
        });

        const { data, error } = await query;
        if (error) {
            console.error(`Supa Post/Upsert Hatası [${table}]:`, error.message);
            return res.status(400).json(error);
        }
        res.json(data);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

app.patch('/api/:table', async (req, res) => {
    const { table } = req.params;
    const { id, ...payload } = req.body;
    
    try {
        const { data, error } = await supabase.from(table).update(payload).eq('id', id);
        if (error) return res.status(400).json(error);
        res.json(data);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

app.delete('/api/:table/:id', async (req, res) => {
    const { table, id } = req.params;
    try {
        const { data, error } = await supabase.from(table).delete().eq('id', id);
        if (error) return res.status(400).json(error);
        res.json(data);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`Zula Proxy sunucusu ${PORT} portunda yayında...`);
});
