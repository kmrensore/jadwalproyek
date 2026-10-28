# JadwalPro — Starter Project Vite + React + TypeScript + Supabase

Paket starter project lengkap untuk aplikasi **Penjadwalan Proyek Bulanan & Catatan Harian** menggunakan **React 18**, **TypeScript**, **Tailwind CSS**, **Supabase**, dan siap di-deploy ke **Vercel**.

---

## 1. Cara Menjalankan di Lokal (VS Code / Laptop)

Pastikan **Node.js (v18+)** sudah ter-install, lalu buka terminal di dalam folder ini:

```bash
# 1. Install seluruh dependensi
npm install

# 2. Jalankan development server
npm run dev
```

Buka URL yang muncul di terminal (biasanya `http://localhost:5173`). Aplikasi langsung berjalan menggunakan `localStorage` beserta 3 proyek contoh dan 12 catatan di bulan Oktober 2026.

---

## 2. Struktur Folder Proyek

```text
jadwal-proyek-vite-starter/
├── index.html               # Entry HTML + Font Inter
├── package.json             # Daftar dependensi (React, Lucide, Supabase, Tailwind, Vite)
├── tailwind.config.js       # Konfigurasi Tailwind CSS
├── postcss.config.js        # Konfigurasi PostCSS
├── tsconfig.json            # Konfigurasi TypeScript
├── vite.config.ts           # Konfigurasi bundler Vite
├── vercel.json              # Routing SPA untuk Vercel
├── .env.example             # Template environment variable Supabase
├── supabase/
│   └── schema.sql           # Skema SQL lengkap (Tabel, Index, Trigger, & RLS)
└── src/
    ├── main.tsx             # Entry point React DOM
    ├── index.css            # Direktif Tailwind CSS
    ├── types.ts             # Tipe data Project, ScheduleEntry, & EntryStatus
    ├── db.ts                # Modul operasi data aktif (default: localStorage)
    ├── db.supabase.ts       # Modul operasi data versi Supabase Client
    └── App.tsx              # Komponen utama Kalender, Sidebar Proyek, & Drawer Harian
```

---

## 3. Cara Menyambungkan ke Database Supabase

1. Buat project baru di **Supabase Dashboard**.
2. Buka menu **SQL Editor**, salin seluruh isi file `supabase/schema.sql`, lalu klik **Run**.
3. Salin file `.env.example` menjadi `.env.local`, lalu isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` dari menu **Project Settings → API** di Supabase.
4. Ganti pemanggilan data di `src/db.ts` dengan implementasi dari `src/db.supabase.ts`.

---

## 4. Cara Deploy ke Production di Vercel

1. Push folder project ini ke repositori **GitHub / GitLab / Bitbucket**.
2. Buka **Vercel Dashboard**, klik **Add New... → Project**, lalu pilih repositori tersebut.
3. Di bagian **Environment Variables**, masukkan:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Klik **Deploy**. Proyek akan otomatis ter-build dengan perintah `npm run build` dan langsung online!
