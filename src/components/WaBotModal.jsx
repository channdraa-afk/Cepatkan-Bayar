import React, { useState, useEffect } from 'react';
import { 
  X, Bot, Key, Send, CheckCircle2, AlertCircle, 
  ExternalLink, Eye, EyeOff, MessageSquare, Sparkles 
} from 'lucide-react';
import { sound } from '../lib/audio';
import { getFonnteToken, setFonnteToken, testFonnteToken } from '../lib/whatsapp';

export default function WaBotModal({ isOpen, onClose, onTokenUpdated }) {
  const [token, setToken] = useState(() => getFonnteToken());
  const [showToken, setShowToken] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [previewTab, setPreviewTab] = useState('pickup'); // 'pickup' | 'delivery'

  useEffect(() => {
    if (isOpen) {
      setToken(getFonnteToken());
      setIsSaved(false);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveToken = () => {
    sound.playComplete();
    setFonnteToken(token);
    setIsSaved(true);
    if (onTokenUpdated) onTokenUpdated();
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleClearToken = () => {
    sound.playRemove();
    setToken('');
    setFonnteToken('');
    setIsSaved(true);
    if (onTokenUpdated) onTokenUpdated();
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestSend = async () => {
    if (!testPhone.trim()) {
      setTestResult({ success: false, reason: 'Ketik nomor WhatsApp tes terlebih dahulu.' });
      return;
    }

    sound.playClick();
    setIsTesting(true);
    setTestResult(null);

    const result = await testFonnteToken(token, testPhone);
    setIsTesting(false);
    setTestResult(result);
    if (result.success) {
      sound.playComplete();
    } else {
      sound.playRemove();
    }
  };

  const hasToken = Boolean(token && token.trim());

  return (
    <div className="fixed inset-0 z-50 bg-espresso/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-cream border-2 border-espresso rounded-2xl shadow-tactile-lg flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b-2 border-espresso bg-cream-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 border-2 border-espresso flex items-center justify-center text-white shadow-tactile-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-espresso">Pengaturan Bot WhatsApp Stand</h2>
              <p className="text-xs text-espresso/70 font-bold">Pemberitahuan otomatis "Pesanan Siap Diambil"</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-cream border border-espresso flex items-center justify-center text-espresso hover:bg-cream-200 active:translate-y-0.5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* Status Mode Banner */}
          <div className={`p-3.5 rounded-xl border-2 border-espresso shadow-tactile-sm ${
            hasToken ? 'bg-emerald-100/90 text-emerald-950' : 'bg-sky-100/90 text-sky-950'
          }`}>
            <div className="flex items-start gap-2.5">
              {hasToken ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-black text-xs sm:text-sm">
                  {hasToken 
                    ? '🟢 Mode Bot Background Aktif (Fonnte API)' 
                    : '🔵 Mode Direct WhatsApp Aktif (Bawaan / 100% Gratis)'}
                </h4>
                <p className="text-xs font-bold mt-1 opacity-80 leading-relaxed">
                  {hasToken
                    ? 'Saat kamu klik tombol "Pesanan Siap", pesan WhatsApp akan terkirim otomatis di latar belakang tanpa membuka browser WA.'
                    : 'Sekali klik tombol "Pesanan Siap", WhatsApp Web / Aplikasi WA otomatis terbuka dengan format pesan ramah yang sudah terisi. Kasir tinggal klik kirim!'}
                </p>
              </div>
            </div>
          </div>

          {/* Setup Info Box */}
          <div className="p-3 bg-cream-50 rounded-xl border border-espresso/30 text-xs text-espresso/80 space-y-1.5 font-bold">
            <div className="flex items-center justify-between">
              <span className="font-black text-espresso flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-caramel" />
                Ingin Menggunakan Bot Background Tanpa Buka Tab WA?
              </span>
              <a
                href="https://fonnte.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-black text-emerald-700 hover:text-emerald-900 underline flex items-center gap-0.5"
              >
                <span>Buka Fonnte.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[11px] leading-relaxed text-espresso/70">
              1. Daftar gratis di fonnte.com &gt; Tambah Device &gt; Scan QR WhatsApp tokomu.<br />
              2. Salin <strong>Token</strong> device dan tempel di bawah. Token hanya tersimpan aman di browsermu.<br />
              <em>*Jika dibiarkan kosong, sistem tetap berjalan normal menggunakan Mode Direct WhatsApp (bebas biaya selamanya).</em>
            </p>
          </div>

          {/* Form Input Token */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-espresso uppercase tracking-wider">
              Token Fonnte API (Opsional)
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                placeholder="Contoh: a1b2c3d4e5f6g7h8..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full pl-3 pr-10 py-2.5 rounded-xl border-2 border-espresso bg-cream-50 text-espresso font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-tactile-sm"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso/60 hover:text-espresso"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveToken}
                className="btn-tactile-primary px-4 py-2 text-xs font-black flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Simpan Token</span>
              </button>

              {hasToken && (
                <button
                  type="button"
                  onClick={handleClearToken}
                  className="px-3 py-2 rounded-xl bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-400 text-xs font-bold"
                  title="Hapus token dan beralih ke Mode Direct WhatsApp"
                >
                  Hapus Token
                </button>
              )}

              {isSaved && (
                <span className="text-xs font-black text-emerald-700 animate-in fade-in">
                  ✓ Berhasil disimpan!
                </span>
              )}
            </div>
          </div>

          {/* Kotak Uji Coba Bot */}
          {hasToken && (
            <div className="p-3.5 bg-emerald-50/70 border-2 border-emerald-500 rounded-xl space-y-2.5">
              <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-emerald-700" />
                Uji Coba Kirim Pesan ke WhatsApp
              </h4>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="tel"
                  placeholder="Nomor WA tes (contoh: 08123456789)"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border-2 border-espresso bg-cream text-espresso font-bold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-tactile-sm"
                />
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={handleTestSend}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl border-2 border-espresso shadow-tactile-sm flex items-center justify-center gap-1.5 shrink-0"
                >
                  {isTesting ? 'Mengirim...' : 'Kirim Tes 🚀'}
                </button>
              </div>

              {testResult && (
                <div className={`p-2.5 rounded-lg border text-xs font-bold ${
                  testResult.success 
                    ? 'bg-emerald-100 border-emerald-500 text-emerald-900' 
                    : 'bg-rose-100 border-rose-500 text-rose-900'
                }`}>
                  {testResult.success ? (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{testResult.message}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{testResult.reason}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Preview Format Pesan Stand */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-espresso/60 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                Preview Format Pesan WhatsApp:
              </span>

              {/* Tab Switcher: Ambil vs Antar */}
              <div className="flex items-center gap-1 bg-cream-200 border border-espresso p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setPreviewTab('pickup');
                  }}
                  className={`px-2.5 py-1 rounded text-[10px] font-black transition-all ${
                    previewTab === 'pickup'
                      ? 'bg-sage text-espresso shadow-tactile-sm'
                      : 'text-espresso/60 hover:text-espresso'
                  }`}
                >
                  🚶 Ambil di Kasir
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setPreviewTab('delivery');
                  }}
                  className={`px-2.5 py-1 rounded text-[10px] font-black transition-all ${
                    previewTab === 'delivery'
                      ? 'bg-amber-400 text-espresso shadow-tactile-sm'
                      : 'text-espresso/60 hover:text-espresso'
                  }`}
                >
                  🛵 Diantar ke Kelas
                </button>
              </div>
            </div>

            {previewTab === 'pickup' ? (
              /* Preview 1: Ambil di Kasir */
              <div className="p-3 bg-emerald-900 text-cream rounded-xl border-2 border-espresso text-[11px] font-sans leading-relaxed space-y-1 shadow-tactile-sm animate-in fade-in duration-150">
                <p className="font-bold">Halo kak <strong className="text-amber-300">Chandra (XI RPL 2)</strong>! 👋</p>
                <p>Pesananmu di <strong className="text-emerald-300">Lunar Cafe</strong> sudah <strong>SIAP DIAMBIL</strong> nih! 🥤✨</p>
                <div className="p-2 bg-emerald-950/60 rounded border border-emerald-700/50 text-[10px] my-1 font-mono">
                  📋 <strong>Rincian Pesanan #001:</strong><br />
                  • 1× Es Kopi Susu Aren<br />
                  • 2× Risol Mayo Keju<br />
                  💰 <strong>Total:</strong> Rp 25.000 (QRIS)
                </div>
                <p>🚶 <strong>Pesananmu sudah siap di meja Lunar Cafe, yuk langsung ke stand untuk mengambilnya yaa.</strong></p>
                <p className="text-[10px] text-emerald-200 pt-1">Ditunggu kedatangannya yaa kak, terima kasih banyak! 🙏😊</p>
              </div>
            ) : (
              /* Preview 2: Diantar ke Kelas */
              <div className="p-3 bg-amber-950 text-cream rounded-xl border-2 border-espresso text-[11px] font-sans leading-relaxed space-y-1 shadow-tactile-sm animate-in fade-in duration-150">
                <p className="font-bold">Halo kak <strong className="text-amber-300">Chandra (XI RPL 2)</strong>! 👋</p>
                <p>Pesananmu di <strong className="text-amber-400">Lunar Cafe</strong> sudah selesai dan <strong>SEDANG DIANTAR</strong> nih! 🛵💨</p>
                <div className="p-2 bg-black/40 rounded border border-amber-800/50 text-[10px] my-1 font-mono">
                  📋 <strong>Rincian Pesanan #002:</strong><br />
                  • 2× Es Coklat Klasik<br />
                  • 1× Roti Bakar Coklat<br />
                  💰 <strong>Total:</strong> Rp 30.000 (Tunai)<br />
                  📍 <strong>Tujuan Antar:</strong> XI RPL 2
                </div>
                <p>🛵 <strong>Tim kurir stand kami sedang meluncur ke kelasmu, mohon ditunggu di kelas yaa kak.</strong></p>
                <p className="text-[10px] text-amber-200 pt-1">Terima kasih banyak sudah jajan di stand kami! 🙏😊</p>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 border-t-2 border-espresso bg-cream-100 flex justify-end">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="btn-tactile-cream px-5 py-2 text-xs font-black"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
