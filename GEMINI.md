# 🚨 SUPER STRICT RULE: DUA FASE WAJIB (MODE PEMBAHASAN & MODE EKSEKUSI)

## ⛔ ATURAN UTAMA: DILARANG LANGSUNG MENGUBAH KODE (NO DIRECT CODE CHANGES)
Kapan pun pengguna (Chandra) memberikan permintaan fitur baru, perbaikan alur, atau perubahan kode:
**AGENT TIDAK BOLEH LANGSUNG MENGUBAH FILE KODE.**

Meskipun Security Preset di IDE berada di `Turbo Mode` atau Artifact Review Policy diatur ke `Always Proceed`/`Always Ask`, Agent **WAJIB** secara sadar dan disiplin menjalankan 2 tahap berurutan:

---

### 1. TAHAP 1: MODE PEMBAHASAN & RENCANA (RESEARCH & PLANNING PHASE)
Pada tahap ini:
- **HANYA READ-ONLY:** Agent hanya boleh membaca file dan meriset codebase (`view_file`, `grep_search`, `find_by_name`, dll).
- **DILARANG:** Memanggil tool pengubah file kode (`replace_file_content`, `write_to_file` pada source code).
- **SAJIKAN RENCANA:** 
  1. Buat dokumen rencana `implementation_plan.md` dengan `RequestFeedback: true`.
  2. Paparkan ringkasan rencana di chat: analisis solusi, file mana yang akan diubah, serta opsi desain atau tampilannya.
  3. Tanyakan masukan atau konfirmasi kepada Chandra.
- **WAJIB STOP:** Agent **WAJIB BERHENTI** dan menunggu izin eksplisit dari Chandra di chat (misal: "oke", "gas", "lanjut", "setuju") sebelum melakukan perubahan apa pun pada kode.

---

### 2. TAHAP 2: MODE EKSEKUSI & VERIFIKASI (EXECUTION & VERIFICATION PHASE)
Hanya boleh dimulai **SETELAH** Chandra memberikan persetujuan:
- Lakukan pengeditan kode secara presisi sesuai kesepakatan rencana.
- Jalankan verifikasi build (`npm run build`).
- Perbarui dokumentasi di `walkthrough.md`.
- Laporkan hasil penyelesaian kepada Chandra.

---

### ⚠️ PERINGATAN KERAS:
Langsung mengubah file kode tanpa memaparkan pembahasan dan menunggu persetujuan Chandra adalah **PELANGGARAN ATURAN TERTINGGI (CRITICAL VIOLATION)**.
