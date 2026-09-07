import React, { useEffect } from 'react';
import { 
  X, ClipboardList, Utensils, Clock, 
  ChevronRight, ShoppingBag, Sparkles 
} from 'lucide-react';
import { formatRupiah } from './MenuCard';
import { sound } from '../lib/audio';

export default function CustomerOrdersModal({
  isOpen,
  onClose,
  myOrders = [],
  onSelectOrder
}) {
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalWidth = document.body.style.width;

    document.body.style.overflow = 'hidden';
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.width = originalWidth;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const activeOrders = myOrders.filter(o => o.status === 'pending' || o.status === 'cooking');
  const pastOrders = myOrders.filter(o => o.status === 'completed' || o.status === 'cancelled');

  return (
    <div className="fixed inset-0 z-50 bg-espresso/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto overflow-x-hidden overscroll-contain">
      <div className="min-h-full flex items-center justify-center py-2 sm:py-4">
        <div className="relative w-full max-w-lg bg-cream border-2 border-espresso rounded-2xl shadow-tactile-lg flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b-2 border-espresso bg-cream-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-caramel border-2 border-espresso flex items-center justify-center text-cream shadow-tactile-sm">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-espresso">Pesanan Saya</h2>
                {activeOrders.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-950 border border-espresso animate-pulse">
                    {activeOrders.length} Aktif
                  </span>
                )}
              </div>
              <p className="text-xs text-espresso/70 font-bold">Pantau proses racik & status antrean secara *live*</p>
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
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
          
          {myOrders.length === 0 ? (
            <div className="text-center py-12 px-4 card-tactile bg-cream-50">
              <div className="w-16 h-16 rounded-2xl bg-cream-200 border-2 border-espresso flex items-center justify-center mx-auto mb-3 shadow-tactile-sm">
                <ShoppingBag className="w-8 h-8 text-espresso/40" />
              </div>
              <h3 className="text-base font-black text-espresso mb-1">Belum Ada Riwayat Pesanan</h3>
              <p className="text-xs text-espresso/60 font-bold max-w-xs mx-auto leading-relaxed">
                Pesanan yang kamu buat di stand akan otomatis tersimpan di sini agar kamu bisa melihat proses racik di kasir!
              </p>
            </div>
          ) : (
            <>
              {/* Bagian 1: Pesanan Sedang Berjalan (Aktif) */}
              {activeOrders.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-caramel" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-espresso">
                      Pesanan Berlangsung ({activeOrders.length})
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {activeOrders.map((order) => {
                      const isCooking = order.status === 'cooking';
                      const isDelivery = order.delivery_type === 'delivery' || 
                        (order.notes && order.notes.includes('🛵 Diantar'));

                      return (
                        <div 
                          key={order.id}
                          className={`p-3.5 rounded-xl border-2 border-espresso shadow-tactile-sm space-y-3 transition-all ${
                            isCooking ? 'bg-amber-50/90 border-caramel' : 'bg-cream-50'
                          }`}
                        >
                          {/* Header Pesanan */}
                          <div className="flex items-start justify-between gap-2 border-b border-espresso/15 pb-2.5">
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xl font-black text-caramel">
                                  {order.order_number}
                                </span>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border border-espresso ${
                                  isDelivery ? 'bg-caramel text-cream' : 'bg-sage text-espresso'
                                }`}>
                                  {isDelivery ? '🛵 Diantar ke Kelas' : '🚶 Ambil di Kasir'}
                                </span>
                                {order.payment_method === 'QRIS' && (
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-black border ${
                                    order.is_qris_validated
                                      ? 'bg-emerald-100 text-emerald-900 border-emerald-500'
                                      : 'bg-amber-100 text-amber-950 border-amber-500'
                                  }`}>
                                    {order.is_qris_validated ? 'QRIS Lunas ✓' : 'QRIS Belum Valid'}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-black text-espresso mt-1">
                                {order.customer_name} {order.customer_class ? `(${order.customer_class})` : ''}
                              </p>
                            </div>

                            {/* Live Badge Status */}
                            <div className="text-right">
                              {isCooking ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-caramel text-cream border border-espresso shadow-tactile-sm animate-pulse">
                                  <Utensils className="w-3.5 h-3.5" />
                                  <span>Sedang Diracik 👨‍🍳</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-100 text-amber-950 border border-amber-500 shadow-tactile-sm">
                                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                                  <span>Menunggu Kasir</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Rincian Menu */}
                          <div className="space-y-1 text-xs font-bold text-espresso/90">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center">
                                <span>{item.qty}× {item.name}</span>
                                <span>{formatRupiah(item.price * item.qty)}</span>
                              </div>
                            ))}
                          </div>

                          {/* Footer Total & Tombol Buka Tiket */}
                          <div className="pt-2 border-t border-espresso/15 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-espresso/60 uppercase font-black block">Total Bayar</span>
                              <span className="text-sm font-black text-caramel">
                                {formatRupiah(order.total_price)}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                onSelectOrder(order);
                              }}
                              className="btn-tactile-primary px-3 py-1.5 text-xs font-black flex items-center gap-1"
                            >
                              <span>Buka Tiket Live</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bagian 2: Riwayat Pesanan Terdahulu (Selesai / Dibatalkan) */}
              {pastOrders.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-espresso/60">
                    Riwayat Selesai ({pastOrders.length})
                  </h3>

                  <div className="space-y-2">
                    {pastOrders.map((order) => {
                      const isCompleted = order.status === 'completed';

                      return (
                        <div 
                          key={order.id}
                          className="p-3 bg-cream-100/70 border border-espresso/30 rounded-xl flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-espresso">{order.order_number}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                isCompleted 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-rose-100 text-rose-800'
                              }`}>
                                {isCompleted ? 'Selesai ✓' : 'Dibatalkan'}
                              </span>
                              <span className="text-[10px] text-espresso/50 font-bold">
                                {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-espresso/70 font-bold truncate mt-0.5">
                              {order.items.map(i => `${i.qty}× ${i.name}`).join(', ')}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-black text-caramel block">
                              {formatRupiah(order.total_price)}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                onSelectOrder(order);
                              }}
                              className="text-[10px] text-caramel hover:underline font-black mt-0.5"
                            >
                              Lihat Tiket
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

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
  </div>
);
}
