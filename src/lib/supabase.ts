import { createClient } from '@supabase/supabase-js';

// GitHub Pages ortamında .env bazen sorunlu olabildiği için, 
// demo projesi olduğu için URL ve Key'i doğrudan buraya ekliyoruz.
const supabaseUrl = 'https://qrpafzzkfydcytmvgql.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrcnBhZnp6a2Z5ZGN5dG12Z3FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNjk0MjQsImV4cCI6MjA4ODc0NTQyNH0.LtvqeYaGCe5eBy9GAXCB3SKNDzWrjxfZ6DZDGQRoTd4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
