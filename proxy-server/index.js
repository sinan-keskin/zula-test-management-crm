const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Supabase Bağlantısı (Kendi zaman diliminde çalıştığı için SSL hatası almaz)
const supabaseUrl = process.env.SUPABASE_URL || 'https://qrpafzzkfydcytmvgql.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcnBhZnp6a2Z5ZGN5dG12Z3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjk0MjQsImV4cCI6MjA4ODc0NTQyNH0.LtvqeYaGCe5eBy9GAXCB3SKNDzWrjxfZ6DZDGQRoTd4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- TEST / HEALTH CHECK ---
app.get('/', (req, res) => {
    res.send('Zula Proxy Sunucusu Aktif! Bağlantı başarılı.');
});

// --- AUTH PROXY ---
app.post('/auth/signin', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return res.status(400).json(error);
        res.json(data);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

app.post('/auth/signout', async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) return res.status(400).json(error);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

// --- DATA PROXY ---
app.get('/api/:table', async (req, res) => {
    const { table } = req.params;
    const { select = '*', order, ascending = 'false' } = req.query;
    
    try {
        let query = supabase.from(table).select(select);
        if (order) query = query.order(order, { ascending: ascending === 'true' });
        
        const { data, error } = await query;
        if (error) return res.status(400).json(error);
        res.json(data);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
});

app.post('/api/:table', async (req, res) => {
    const { table } = req.params;
    const payload = req.body;
    
    try {
        const { data, error } = await supabase.from(table).insert(payload);
        if (error) return res.status(400).json(error);
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

app.listen(PORT, () => {
    console.log(`Zula Proxy sunucusu ${PORT} portunda yayında...`);
});
