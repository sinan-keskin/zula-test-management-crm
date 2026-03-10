# Sinan Keskin - Zula CRM Dashboard

![Zula Logo](https://upload.wikimedia.org/wikipedia/tr/d/d6/Zula_Oyun_Logo.png)

Zula CRM, MadByte Akademi bünyesindeki ekiplerin (Akademi, Hakem, Fedai) performanslarını takip etmek, kullanıcı yönetimini sağlamak ve detaylı raporlar oluşturmak için tasarlanmış profesyonel bir yönetim panelidir.

## 🚀 Özellikler

- **Gelişmiş Dashboard:** Genel istatistikler, kullanıcı dağılımı ve aylık performans grafiklerini anlık olarak takip edin.
- **Rol Tabanlı Yetkilendirme:** Sistem Yöneticisi, Şirket Müdürü, Akademi Kaptanı, Hakem gibi rollerle tam erişim kontrolü.
- **Performans Takibi:** Test katılımı, hata raporları, öneriler ve hakemlik performanslarının detaylı kaydı.
- **Raporlama Sistemi:** Filtrelenebilir tablolar ve Excel formatında veri dışa aktarma (XLSX).
- **Gerçek Zamanlı Veri:** Supabase entegrasyonu ile tüm veriler bulut üzerinde güvenle saklanır ve anında senkronize olur.
- **Modern Arayüz:** Karanlık/Aydınlık tema desteği ve mobil uyumlu (Responsive) tasarım.

## 🛠 Kullanılan Teknolojiler

- **Frontend:** React 19, Vite, Tailwind CSS, Lucide Icons, Recharts, Framer Motion.
- **State Management:** Zustand (Asenkron).
- **Backend/DB:** Supabase (PostgreSQL).
- **Dil Desteği:** i18next (Türkçe & İngilizce).

## 📦 Kurulum

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

2. `.env` dosyasını oluşturun ve Supabase bilgilerinizi ekleyin:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

3. Veritabanı şemasını oluşturmak için `supabase_schema.sql` dosyasını Supabase SQL Editor üzerinde çalıştırın.

4. Mevcut verileri aktarmak için:
   ```bash
   npx tsx migrate.ts
   ```

5. Geliştirme modunda başlatın:
   ```bash
   npm run dev
   ```

## 🌐 Yayına Alma (GitHub Pages)

Proje GitHub Pages ile tam uyumludur:
```bash
npm run deploy
```

---
*Geliştiren: **Sinan Keskin** & **MadByte Akademi Ekibi***
