# Entity-Relationship Diagram (ERD) Sistem Rapot Digital

Dokumen ini berisi struktur database (ERD) berdasarkan skema Supabase (`schema.sql`, `schema_tahap3.sql`, `schema_tahap4.sql`, `schema_tahap5.sql`, `schema_tahap6.sql`, dan `schema_audit_log.sql`).

```mermaid
erDiagram
    users {
        uuid id PK
        text email
        text nama_lengkap
        enum role "TU, GURU_MAPEL, WALI_KELAS, KEPALA_SEKOLAH, SISWA"
        timestamp created_at
    }

    kelas {
        uuid id PK
        text nama_kelas
        text tingkat
        text tahun_ajaran
        uuid wali_kelas_id FK "References users.id"
        timestamp created_at
    }

    siswa {
        uuid id PK
        text nisn
        text nis
        text nama_lengkap
        enum jenis_kelamin "L, P"
        text tempat_lahir
        date tanggal_lahir
        text agama
        text alamat
        text nama_ayah
        text nama_ibu
        uuid kelas_id FK "References kelas.id"
        uuid user_id FK "References users.id"
        timestamp created_at
    }

    mapel {
        uuid id PK
        text nama_mapel
        text kelompok
        int kkm
        timestamp created_at
    }

    guru_mapel {
        uuid id PK
        uuid guru_id FK "References users.id"
        uuid mapel_id FK "References mapel.id"
        uuid kelas_id FK "References kelas.id"
        timestamp created_at
    }

    absensi {
        uuid id PK
        uuid siswa_id FK "References siswa.id"
        date tanggal
        enum status "HADIR, SAKIT, IZIN, ALPA"
        text keterangan
        timestamp created_at
    }

    nilai {
        uuid id PK
        uuid siswa_id FK "References siswa.id"
        uuid mapel_id FK "References mapel.id"
        uuid kelas_id FK "References kelas.id"
        enum semester "Ganjil, Genap"
        text tahun_ajaran
        numeric nilai_tugas
        numeric nilai_uts
        numeric nilai_uas
        text deskripsi_pengetahuan
        text deskripsi_keterampilan
        timestamp created_at
    }

    rapor_wali_kelas {
        uuid id PK
        uuid siswa_id FK "References siswa.id"
        uuid kelas_id FK "References kelas.id"
        enum semester "Ganjil, Genap"
        text tahun_ajaran
        text sikap_spiritual
        text sikap_sosial
        text ekskul_1_nama
        text ekskul_1_nilai
        text ekskul_2_nama
        text ekskul_2_nilai
        text ekskul_3_nama
        text ekskul_3_nilai
        text catatan
        boolean is_approved_by_kepsek
        timestamp created_at
    }

    log_aktivitas {
        uuid id PK
        uuid user_id FK "References users.id"
        text nama_pengguna
        text role
        text aksi
        text keterangan
        timestamp created_at
    }

    %% Relationships
    users ||--o{ kelas : "menjadi wali kelas (WALI_KELAS)"
    users ||--o{ siswa : "login akun siswa (SISWA)"
    users ||--o{ guru_mapel : "sebagai guru pengampu"
    users ||--o{ log_aktivitas : "melakukan aktivitas"
    
    kelas ||--o{ siswa : "memiliki siswa"
    kelas ||--o{ guru_mapel : "memiliki guru pengampu mapel"
    kelas ||--o{ nilai : "sebagai referensi kelas"
    kelas ||--o{ rapor_wali_kelas : "sebagai referensi kelas"
    
    mapel ||--o{ guru_mapel : "diampu oleh guru"
    mapel ||--o{ nilai : "referensi nilai mapel"
    
    siswa ||--o{ absensi : "memiliki riwayat absen"
    siswa ||--o{ nilai : "memperoleh nilai"
    siswa ||--o{ rapor_wali_kelas : "memiliki catatan rapor"
```

## Daftar Tabel dan Deskripsi Singkat:
1. **users**: Menyimpan data autentikasi dan peran semua pengguna (TU, Guru Mapel, Wali Kelas, Kepala Sekolah, Siswa).
2. **kelas**: Menyimpan daftar kelas, tingkat, tahun ajaran, beserta siapa wali kelasnya.
3. **siswa**: Menyimpan biodata lengkap siswa, terhubung ke kelas dan juga terhubung ke `users` untuk akses login.
4. **mapel**: Menyimpan data master mata pelajaran beserta nilai KKM.
5. **guru_mapel**: Tabel perantara (transaksi) yang memetakan guru (dari `users`), mengajar `mapel` apa, dan di `kelas` mana.
6. **absensi**: Menyimpan data riwayat kehadiran siswa per hari (Hadir/Sakit/Izin/Alpa).
7. **nilai**: Menyimpan nilai tugas, UTS, UAS, dan deskripsi penilaian siswa untuk tiap mata pelajaran, semester, dan tahun ajaran.
8. **rapor_wali_kelas**: Menyimpan penilaian sikap (spiritual, sosial), ekstrakurikuler, catatan khusus dari wali kelas, serta status persetujuan (_approval_) dari Kepala Sekolah.
9. **log_aktivitas**: Menyimpan riwayat semua aktivitas yang dilakukan oleh pengguna (Audit Trail).
