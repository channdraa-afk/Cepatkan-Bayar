import React from 'react';
import { CheckCircle, Clock, Utensils, Sparkles, X, ChevronRight, Bell } from 'lucide-react';
import { formatRupiah } from './MenuCard';
import { sound } from '../lib/audio';

export default function OrderTrackerModal({ order, onClose, onNewOrder }) {
  if (!order) return null;

  const isPending = order.status === 'pending';
  const isCooking = order.status === 'cooking';
  const isCompleted = order.status === 'completed';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-espresso/60 backdrop-blur-sm flex items-center justify-center p-4">
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
            {order.notes && (
              <p className="text-xs text-espresso/70 italic mt-1 bg-cream-50 p-1.5 rounded-lg border border-espresso/20">
                Catatan: {order.notes}
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

              {/* Step 3: Siap Diambil */}
              <div className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                isCompleted 
                  ? 'bg-sage border-2 border-espresso text-espresso font-black shadow-tactile animate-bounce' 
                  : 'bg-cream-200/40 border-espresso/20 text-espresso/40'
              }`}>
                <CheckCircle className="w-5 h-5 mb-1" />
                <span className="text-[10px] leading-tight">3. Siap Diambil!</span>
              </div>
            </div>

            {isCompleted && (
              <div className="mt-3 p-2.5 bg-sage-100 border border-sage-600 rounded-lg text-center text-xs font-black text-espresso flex items-center justify-center gap-1.5">
                <Bell className="w-4 h-4 text-espresso animate-wiggle" />
                Hore! Pesananmu sudah siap diambil di meja stand!
              </div>
            )}
          </div>

          {/* Ringkasan Item */}
          <div className="p-3 bg-cream-100 border-2 border-espresso rounded-xl text-xs space-y-1.5">
            <span className="font-black text-espresso block mb-1">Rincian Menu:</span>
            {order.items.map((it, idx) => (
              <div key={idx} className="flex justify-between font-bold text-espresso">
                <span>{it.qty}× {it.name}</span>
                <span>{formatRupiah(it.price * it.qty)}</span>
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
              <div className="space-y-2">
                <p>📱 Silakan scan QRIS di bawah ini sejumlah <strong>{formatRupiah(order.total_price)}</strong> dan tunjukkan bukti transfer ke kasir:</p>
                <div className="p-2 bg-white rounded-xl border border-espresso/30 inline-block shadow-sm">
                  <img src="/qris.png" alt="QRIS Stand" className="max-h-44 w-auto mx-auto rounded-lg object-contain" />
                </div>
              </div>
            )}
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
  );
}
