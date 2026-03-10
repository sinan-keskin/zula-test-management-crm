# Zula CRM Proxy Server (Render Deployment)

Bu sunucu, React uygulamanız ile Supabase arasında bir köprü görevi görür. 2026 tarihli bilgisayarınızdaki SSL kilidini kırmak için tasarlanmıştır.

## Render Kurulum Adımları

1. [Render.com](https://render.com) adresine gidin ve giriş yapın.
2. **"New +"** -> **"Web Service"** seçeneğine tıklayın.
3. Bu projenin GitHub deposunu bağlayın.
4. **Root Directory:** `proxy-server` olarak ayarlayın.
5. **Runtime:** `Node`
6. **Build Command:** `npm install`
7. **Start Command:** `node index.js`
8. **Environment Variables:**
   - `SUPABASE_URL`: (Supabase Panelinden alın)
   - `SUPABASE_ANON_KEY`: (Supabase Panelinden alın)

Kurulum bitince Render size bir URL verecek (örn: `https://zula-proxy.onrender.com`). Bu URL'yi kopyalayın.
