import React, { useEffect } from 'react';
import { CheckCircle, Clock, Utensils, X, Bell, Download, AlertCircle, CheckCircle2, MessageCircle, Star, ExternalLink } from 'lucide-react';
import { formatRupiah } from './MenuCard';
import { sound } from '../lib/audio';
import { getCashierWaUrl } from '../lib/whatsapp';
import { getVoteUrl } from '../lib/storage';

export default function OrderTrackerModal({ order, onClose, onNewOrder }) {
  // Kunci scroll background halaman saat modal tiket terbuka di HP
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalWidth = document.body.style.width;

    document.body.style.overflow = 'hidden';
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.width = originalWidth;
    };
  }, []);

  if (!order) return null;

  const handleDownloadQris = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    sound.playClick();
    try {
      const res = await fetch('/qris.png');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = 'qris-stand-bazar.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch {
      window.open('/qris.png', '_blank');
    }
  };

  const isPending = order.status === 'pending';
  const isCooking = order.status === 'cooking';
  const isCompleted = order.status === 'completed';
  const isCancelled = order.status === 'cancelled';

  const isDelivery = order.delivery_type === 'delivery' || (order.notes && order.notes.includes('🛵 Diantar'));
  const cleanNotes = order.display_notes || (order.notes || '')
    .replace(/\[🛵 Diantar ke Kelas\]/g, '')
    .replace(/\[🚶 Ambil di Kasir\]/g, '')
    .replace(/\[WA:\s*[^\]]+\]/g, '')
    .replace(/\[QRIS_LUNAS\]/g, '')
    .trim();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden overscroll-contain bg-espresso/60 backdrop-blur-sm p-3 sm:p-4">
      <div className="min-h-full flex items-center justify-center py-3 sm:py-6">
        <div className="relative w-full max-w-md bg-cream border-2 border-espresso rounded-2xl shadow-tactile-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top vintage banner */}
        <div className="bg-caramel p-4 border-b-2 border-espresso text-cream text-center relative">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="absolute right-3 top-3 w-8 h-8 rounded-lg bg-cream border border-espresso flex items-center justify-center text-espresso hover:bg-cream-100"
          >
            <X className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-black tracking-widest uppercase bg-espresso/30 px-3 py-1 rounded-full inline-block mb-1">
            Pesanan Berhasil Terkirim!
          </span>
          <h2 className="text-2xl font-black tracking-tight">Stand Bazar Siap Melayani</h2>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          
          {/* Queue Card */}
          <div className="p-4 bg-cream-100 border-2 border-espresso rounded-xl shadow-tactile-sm text-center">
            <span className="text-xs uppercase font-extrabold text-espresso/60 block">Nomor Antrean Kamu</span>
            <div className="text-4xl font-black text-caramel tracking-tight my-1">
              {order.order_number}
            </div>
            <p className="text-sm font-bold text-espresso">
              Pemesan: <span className="font-extrabold">{order.customer_name}</span>
            </p>

            <div className="flex items-center justify-center gap-1.5 my-2">
              <span className={`text-[11px] font-black px-3 py-1 rounded-full border border-espresso shadow-tactile-sm ${
                isDelivery ? 'bg-caramel text-cream' : 'bg-sage text-espresso'
              }`}>
                {isDelivery ? '🛵 Diantar ke Kelas' : '🚶 Ambil di Meja Kasir'}
              </span>
            </div>

            {cleanNotes && (
              <p className="text-xs text-espresso/80 font-bold mt-1.5 bg-cream-50 p-2 rounded-xl border border-espresso/20">
                📝 Catatan: "{cleanNotes}"
              </p>
            )}
          </div>

          {/* Status Tracker */}
          <div className="p-3.5 bg-cream-50 border-2 border-espresso rounded-xl">
            <h4 className="text-xs font-black uppercase text-espresso/70 mb-3 text-center">Status Pesanan Realtime</h4>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              {/* Step 1: Menunggu */}
              <div className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                isPending 
                  ? 'bg-amber-100 border-amber-500 text-amber-900 font-extrabold shadow-tactile-sm' 
                  : (isCooking || isCompleted)
                  ? 'bg-sage-100 border-sage-600 text-sage-800 opacity-70'
                  : 'bg-cream-200/40 border-espresso/20 text-espresso/40'
              }`}>
                <Clock className="w-5 h-5 mb-1" />
                <span className="text-[10px] leading-tight">1. Menunggu Kasir</span>
              </div>

              {/* Step 2: Dimasak / Diracik */}
              <div className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                isCooking 
                  ? 'bg-caramel-100 border-caramel text-caramel-700 font-extrabold shadow-tactile-sm animate-pulse' 
                  : isCompleted
                  ? 'bg-sage-100 border-sage-600 text-sage-800 opacity-70'
                  : 'bg-cream-200/40 border-espresso/20 text-espresso/40'
              }`}>
                <Utensils className="w-5 h-5 mb-1" />
                <span className="text-[10px] leading-tight">2. Sedang Diracik</span>
              </div>

              {/* Step 3: Siap Diambil / Diantar */}
              <div className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                isCompleted 
                  ? 'bg-sage border-2 border-espresso text-espresso font-black shadow-tactile animate-bounce' 
                  : 'bg-cream-200/40 border-espresso/20 text-espresso/40'
              }`}>
                <CheckCircle className="w-5 h-5 mb-1" />
                <span className="text-[10px] leading-tight">
                  {isDelivery ? '3. Sedang Diantar!' : '3. Siap Diambil!'}
                </span>
              </div>
            </div>

            {/* Banner Khusus Saat Sedang Diracik */}
            {isCooking && (
              <div className="mt-3 p-2.5 bg-amber-100 border-2 border-caramel rounded-xl text-center text-xs font-black text-amber-950 flex items-center justify-center gap-1.5 animate-pulse shadow-tactile-sm">
                <Utensils className="w-4 h-4 text-caramel shrink-0" />
                <span>Pesananmu sedang diracik oleh tim stand! Harap ditunggu yaa 👨‍🍳✨</span>
              </div>
            )}

            {/* Banner Khusus Saat Selesai */}
            {isCompleted && (
              <div className="mt-3 p-2.5 bg-emerald-100 border-2 border-emerald-600 rounded-xl text-center text-xs font-black text-emerald-950 flex items-center justify-center gap-1.5 shadow-tactile-sm">
                <Bell className="w-4 h-4 text-emerald-700 animate-bounce shrink-0" />
                <span>
                  {isDelivery 
                    ? '🛵 Hore! Pesananmu sudah selesai & sedang meluncur diantar ke kelas!' 
                    : '🥤 Hore! Pesananmu sudah siap, yuk langsung ambil di meja kasir stand!'}
                </span>
              </div>
            )}

            {/* Banner Khusus Saat Dibatalkan / Ditolak */}
            {isCancelled && (
              <div className="mt-3 p-2.5 bg-rose-100 border-2 border-rose-500 rounded-xl text-center text-xs font-black text-rose-950 flex items-center justify-center gap-1.5 shadow-tactile-sm">
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                <span>⚠️ Pesanan ini telah dibatalkan / ditolak oleh kasir stand.</span>
              </div>
            )}
          </div>

          {/* Ringkasan Item */}
          <div className="p-3 bg-cream-100 border-2 border-espresso rounded-xl text-xs space-y-1.5">
            <span className="font-black text-espresso block mb-1">Rincian Menu:</span>
            {order.items.map((it, idx) => (
              <div key={idx} className="flex justify-between font-bold text-espresso gap-2">
                <span className="truncate min-w-0">{it.qty}× {it.name}</span>
                <span className="shrink-0">{formatRupiah(it.price * it.qty)}</span>
              </div>
            ))}
            <div className="border-t border-espresso/20 pt-1.5 flex justify-between font-black text-sm text-caramel">
              <span>Total ({order.payment_method}):</span>
              <span>{formatRupiah(order.total_price)}</span>
            </div>
          </div>

          {/* Petunjuk Pembayaran */}
          <div className="p-3 bg-cream-50 border border-espresso/30 rounded-xl text-xs text-espresso/80 leading-relaxed text-center">
            {order.payment_method === 'Tunai' ? (
              <p>💵 Siapkan uang tunai <strong>{formatRupiah(order.total_price)}</strong> dan bayar ke kasir saat mengambil pesanan.</p>
            ) : (
              <div className="space-y-2.5">
                {/* Status Validasi Pembayaran QRIS dari Kasir */}
                {order.is_qris_validated ? (
                  <div className="p-2.5 bg-emerald-100 border-2 border-emerald-600 rounded-xl text-emerald-950 text-xs font-black flex items-center justify-center gap-2 shadow-tactile-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Pembayaran QRIS Terverifikasi Kasir ✓</span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-amber-100 border-2 border-amber-500 rounded-xl text-amber-950 text-xs text-center shadow-tactile-sm space-y-1">
                    <span className="font-black text-amber-900 flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 animate-pulse" />
                      <span>Menunggu Validasi Kasir</span>
                    </span>
                    <p className="text-[11px] font-bold">
                      Scan QRIS sejumlah <strong>{formatRupiah(order.total_price)}</strong>, lalu tunjukkan bukti transfer ke kasir stand.
                    </p>
                  </div>
                )}

                <div className="relative w-full max-w-[260px] mx-auto bg-white p-2.5 rounded-2xl border-2 border-espresso shadow-tactile-sm">
                  <img src="/qris.png" alt="QRIS Stand" className="w-full h-auto max-h-[340px] mx-auto rounded-xl object-contain" />
                </div>

                {/* Tombol Simpan QRIS ke HP */}
                <button
                  type="button"
                  onClick={handleDownloadQris}
                  className="w-full py-2 px-3 rounded-xl bg-cream hover:bg-cream-100 text-espresso font-black text-xs flex items-center justify-center gap-2 border-2 border-espresso shadow-tactile-sm transition-all"
                  title="Simpan foto QRIS ke galeri HP untuk dibayar lewat m-banking atau e-wallet"
                >
                  <Download className="w-4 h-4" />
                  <span>Simpan / Unduh QRIS ke HP</span>
                </button>

                {/* Tombol Kirim Bukti Transfer ke WA Kasir */}
                <a
                  href={getCashierWaUrl(order)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => sound.playClick()}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:translate-y-0.5 text-white font-black text-xs flex items-center justify-center gap-2 border-2 border-espresso shadow-tactile transition-all text-center"
                  title="Kirim foto/screenshot bukti transfer QRIS langsung ke WhatsApp Kasir Stand"
                >
                  <MessageCircle className="w-4 h-4 text-white shrink-0" />
                  <span>Kirim Bukti Transfer ke WA Kasir</span>
                </a>

                {/* Petunjuk Santai: Pembeli Tidak Wajib Menunggu di Layar Ini */}
                <p className="text-[11px] text-espresso/70 font-bold text-center bg-cream-100 p-2 rounded-xl border border-espresso/20">
                  💡 <em>Setelah bayar / kirim bukti, kamu bebas tutup tiket ini atau pesan menu lain. Status validasi kasir akan ter-update otomatis!</em>
                </p>
              </div>
            )}
          </div>

          {/* Banner 1-Klik Vote Stand Bazar */}
          <div className="p-3 bg-amber-50 border-2 border-amber-400 rounded-2xl text-center space-y-2 shadow-tactile-sm">
            <div className="flex items-center justify-center gap-1.5 text-amber-950 font-black text-xs">
              <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>Suka Makanan & Pelayanan Kami?</span>
            </div>
            <p className="text-[11px] font-bold text-espresso/80 leading-tight">
              Dukung stand bazar kami jadi stand terfavorit dengan 1-klik vote!
            </p>
            <a
              href={getVoteUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-espresso font-black text-xs flex items-center justify-center gap-1.5 border-2 border-espresso shadow-tactile transition-all active:translate-y-0.5"
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>⭐ Vote Stand Kami Sekarang</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>
          </div>

          {/* Tombol Selesai / Pesan Baru */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                sound.playClick();
                onNewOrder();
              }}
              className="btn-tactile-cream flex-1 py-2.5 text-xs text-center"
            >
              Pesan Menu Lain
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="btn-tactile-primary flex-1 py-2.5 text-xs text-center"
            >
              Tutup
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
);
}
