# Sistem Rapor Digital — Project Context

> **Dokumen ini adalah SUMBER KEBENARAN TUNGGAL untuk scope proyek.**
> Agent (AI coding assistant) WAJIB membaca dan mematuhi dokumen ini sebelum menulis kode apa pun.
> Jika ada instruksi lain yang bertentangan dengan dokumen ini, dokumen ini yang menang.

---

## 1. Tentang Proyek

Sistem informasi pengelolaan nilai / rapor digital berbasis web untuk sekolah, dengan 5 aktor pengguna. Sistem menggantikan proses input nilai, rekap, dan cetak rapor manual menjadi digital, real-time, dan terintegrasi.

## 2. Tech Stack (TETAP — tidak boleh diganti agent)

| Layer | Teknologi |
|---|---|
| Front-end | React (JavaScript) |
| Back-end / Database | Supabase (PostgreSQL, Auth, Storage, Row Level Security, Auto-generated API) |
| Ekspor dokumen | jsPDF (client-side PDF generation) |
| Styling | Lihat bagian **Design Guidelines** — dilarang pakai template generik |

**Larangan eksplisit:**
- Jangan ganti Supabase dengan MySQL/Firebase/backend custom apa pun.
- Jangan tambah framework CSS besar (Bootstrap, Material UI) kecuali diminta eksplisit.
- Jangan tambah state management library (Redux, Zustand, dll) kecuali kebutuhan sudah jelas kompleks dan didiskusikan dulu.
- Jangan membuat back-end server terpisah (Express/Node API) — semua logika server-side memakai Supabase (RLS policies, Database Functions/Edge Functions bila perlu).

## 3. Aktor & Hak Akses

| Aktor | Deskripsi Singkat |
|---|---|
| **TU (Tata Usaha)** | Mengelola data induk siswa, akun pengguna, dan absensi |
| **Guru Mata Pelajaran** | Input & koreksi nilai per mata pelajaran yang diampu |
| **Guru Wali Kelas** | Memantau nilai siswa di kelasnya, input catatan, validasi rekap, cetak rapor |
| **Kepala Sekolah** | Approve rapor (tanda tangan digital), melihat laporan statistik sekolah |
| **Siswa** | Melihat dan mengunduh rapor sendiri |

Semua aktor login lewat satu halaman Login yang sama; sistem mengarahkan ke dashboard sesuai role (role-based routing + Supabase RLS berdasarkan role).

## 4. Daftar Fitur per Aktor (Scope Wajib — Definition of Done)

Agent HANYA boleh mengerjakan fitur yang tercantum di bawah ini. Fitur di luar daftar ini TIDAK BOLEH ditambahkan tanpa konfirmasi eksplisit dari user, sekalipun "kelihatan berguna" atau "best practice".

### 4.1 Umum (semua aktor)
- [ ] Login (dengan validasi autentikasi via Supabase Auth)
- [ ] Logout
- [ ] Deteksi & notifikasi sesi kadaluarsa (auto-redirect ke login)

### 4.2 TU
- [ ] Kelola Data Siswa (CRUD)
- [ ] Kelola Akun Pengguna (CRUD, assign role)
- [ ] Input Absensi Siswa
- [ ] Rekap Absensi (termasuk validasi kehadiran)

### 4.3 Guru Mata Pelajaran
- [ ] Input Nilai (Harian, PTS, PAS) per siswa per mapel
- [ ] Validasi rentang nilai (0–100) saat input
- [ ] Hitung Nilai Akhir & Predikat otomatis (rumus bisa dikonfirmasi ke user, jangan mengarang bobot)
- [ ] Generate Deskripsi Capaian Pembelajaran otomatis (template teks berbasis nilai/KKM)
- [ ] Edit / Koreksi Nilai
- [ ] Input Nilai Remedial (untuk nilai di bawah KKM)

### 4.4 Guru Wali Kelas
- [ ] Pantau Nilai Real-time seluruh siswa di kelasnya
- [ ] Input Catatan Wali Kelas (per siswa)
- [ ] Rekap & Validasi Nilai (dari semua mapel)
- [ ] Kirim Notifikasi ke Orang Tua (setelah rekap divalidasi)
- [ ] Cetak Rapor → Generate PDF (pakai jsPDF)

### 4.5 Kepala Sekolah
- [ ] Approve & Tanda Tangan Digital rapor
- [ ] Lihat Laporan Statistik (nilai rata-rata sekolah, per kelas, dll — lingkup ditentukan saat implementasi, konfirmasi dulu ke user)
- [ ] Ekspor Laporan (PDF/Excel)

### 4.6 Siswa
- [ ] Lihat Rapor Online
- [ ] Unduh Rapor (PDF, hasil dari Generate PDF yang sama dengan milik Wali Kelas)

## 5. Aturan Kerja untuk Agent

1. **Jangan menambah fitur di luar daftar Section 4**, meski "kelihatan wajar" (contoh: chat antar user, kalender akademik, sistem pembayaran SPP, dsb — SEMUA DI LUAR SCOPE kecuali diminta).
2. **Jangan mengubah struktur database secara sepihak** tanpa menunjukkan skema/migration yang diusulkan ke user dulu.
3. **Setiap fitur baru = task terpisah.** Jangan gabungkan beberapa use case sekaligus dalam satu sesi kerja tanpa diminta.
4. **Ikuti Design Guidelines** (Section 6) — dilarang pakai layout/komponen generik AI (lihat detail di bawah).
5. **Kalau ada ambiguitas requirement** (misal rumus nilai akhir, format predikat, isi laporan statistik), STOP dan tanyakan ke user — jangan mengarang asumsi bisnis (nilai KKM, bobot nilai, dsb).
6. **Row Level Security (RLS) wajib aktif** di setiap tabel Supabase — jangan matikan RLS demi "kemudahan development".
7. **Commit/perubahan kode harus scoped** — satu fitur, satu perubahan yang jelas, mudah di-review.

## 6. Design Guidelines (Ringkas — detail lengkap ada di prompt Antigravity)

- **Dilarang** tampilan generik ala AI: kartu putih dengan shadow tipis + Inter font default + palet biru-ungu gradient + ikon outline generik tanpa arah desain.
- **Wajib** ada identitas visual yang jelas dan konsisten (lihat token desain di `PROMPT_ANTIGRAVITY.md` Section "Design Direction").
- Referensi nuansa: aplikasi akademik profesional (bukan SaaS startup generik) — rapi, formal, mudah dibaca guru/TU yang mungkin tidak terlalu melek teknologi, tapi tetap modern.

## 7. Struktur Folder yang Diharapkan

```
/src
  /pages          -> halaman per aktor (dashboard-tu, dashboard-guru, dll)
  /components     -> komponen reusable (Table, Modal, FormInput, dll)
  /features       -> logic per fitur (nilai, absensi, rapor, dll), dikelompokkan per domain
  /lib
    supabaseClient.js
  /hooks
  /utils
  /styles         -> design tokens (warna, tipografi, spacing)
```

## 8. Referensi

- Diagram use case sumber: `USE_CASE.drawio` (5 aktor, sesuai Section 3)
- Stack: React + Supabase (PostgreSQL) + jsPDF
