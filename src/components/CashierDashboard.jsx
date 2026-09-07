import React, { useState } from 'react';
import { 
  CheckCircle2, Clock, Utensils, DollarSign, Package, QrCode, 
  Settings, Volume2, ArrowLeft, RefreshCw, AlertCircle, Banknote, Sparkles, Filter,
  X, MessageCircle, Ban
} from 'lucide-react';
import { formatRupiah } from './MenuCard';
import { sound } from '../lib/audio';

export default function CashierDashboard({
  orders,
  menus,
  onUpdateStatus,
  onOpenStockManager,
  onOpenMenuManager,
  onOpenQrModal,
  onOpenSettings,
  onExitCashier
}) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed' | 'cancelled' | 'all'
  const [cashInputs, setCashInputs] = useState({}); // { [orderId]: number }
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // Filter orders
  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'cooking');
  const completedOrders = orders.filter(o => o.status === 'completed');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');
  
  const displayedOrders = activeTab === 'active' 
    ? activeOrders 
    : activeTab === 'completed' 
    ? completedOrders 
    : activeTab === 'cancelled'
    ? cancelledOrders
    : orders;

  // Rekapitulasi Omzet
  const totalOmzet = completedOrders.reduce((sum, o) => sum + o.total_price, 0);
  const totalTunai = completedOrders
    .filter(o => o.payment_method === 'Tunai')
    .reduce((sum, o) => sum + o.total_price, 0);
  const totalQris = completedOrders
    .filter(o => o.payment_method === 'QRIS')
    .reduce((sum, o) => sum + o.total_price, 0);

  // Handle Quick Change
  const handleSetCash = (orderId, amount) => {
    sound.playClick();
    setCashInputs(prev => ({ ...prev, [orderId]: amount }));
  };

  // Centang Selesai Dilayani (Sesuai permintaan Chandra: otomatis tersembunyi dari layar antrean aktif)
  const handleCompleteOrder = async (order) => {
    sound.playComplete();
    const cashGiven = cashInputs[order.id] || null;
    const changeAmount = cashGiven ? Math.max(0, cashGiven - order.total_price) : null;
    
    await onUpdateStatus(order.id, 'completed', {
      cash_given: cashGiven,
      change_amount: changeAmount
    });
  };

  const handleStartCooking = async (orderId) => {
    sound.playClick();
    await onUpdateStatus(orderId, 'cooking');
  };

  // Batalkan Pesanan & Restorasi Stok Otomatis
  const handleCancelOrder = async (order) => {
    sound.playRemove();
    await onUpdateStatus(order.id, 'cancelled');
    setConfirmCancelId(null);
    setToastMsg(`Pesanan ${order.order_number} (${order.customer_name}) dibatalkan. Stok menu otomatis dikembalikan!`);
    setTimeout(() => setToastMsg(null), 5000);
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5">
      
      {/* Top Bar Kasir */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-cream-100 border-2 border-espresso rounded-2xl p-4 shadow-tactile">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-sage border border-espresso text-espresso">
              ● Mode Kasir Aktif
            </span>
            <span className="text-xs font-bold text-espresso/60">
              Antrean Masuk: <strong className="text-caramel">{activeOrders.length}</strong> pesanan
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-espresso">Dashboard Kasir Bazar</h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onOpenMenuManager();
            }}
            className="btn-tactile-primary px-3 py-2 text-xs flex items-center gap-1.5"
            title="Kelola, Tambah, Edit, atau Hapus Menu Stand"
          >
            <Sparkles className="w-4 h-4 text-cream" />
            <span>Kelola / + Menu</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenStockManager();
            }}
            className="btn-tactile-sage px-3 py-2 text-xs flex items-center gap-1.5"
            title="Kelola & Tambah Stok Dadakan"
          >
            <Package className="w-4 h-4 text-espresso" />
            <span>Tambah Stok</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenQrModal();
            }}
            className="btn-tactile-cream px-3 py-2 text-xs flex items-center gap-1.5"
            title="Tampilkan QR Code untuk Pelanggan"
          >
            <QrCode className="w-4 h-4 text-espresso" />
            <span>QR Stand</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenSettings();
            }}
            className="p-2 rounded-xl bg-cream-50 border-2 border-espresso text-espresso hover:bg-white shadow-tactile-sm"
            title="Pengaturan Database Supabase"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onExitCashier();
            }}
            className="btn-tactile-cream px-3 py-2 text-xs flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Menu Pembeli</span>
          </button>
        </div>
      </div>

      {/* Banner jika menu masih kosong */}
      {menus.length === 0 && (
        <div className="p-4 bg-amber-100 border-2 border-amber-600 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-tactile-sm">
          <div className="flex items-center gap-3 text-amber-900">
            <AlertCircle className="w-6 h-6 shrink-0 text-amber-700" />
            <div>
              <h4 className="font-black text-sm">Menu Stand Masih Kosong!</h4>
              <p className="text-xs font-bold text-amber-800">Yuk masukkan menu makanan/minuman yang akan kamu jual di bazar besok.</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onOpenMenuManager();
            }}
            className="btn-tactile-primary px-4 py-2 text-xs shrink-0"
          >
            + Tambah Menu Pertama
          </button>
        </div>
      )}

      {/* Rekap Omzet Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-cream-50 border-2 border-espresso rounded-xl shadow-tactile-sm">
          <span className="text-[11px] font-black uppercase tracking-wider text-espresso/60 block">Total Omzet Selesai</span>
          <div className="text-2xl font-black text-caramel mt-1">
            {formatRupiah(totalOmzet)}
          </div>
          <p className="text-xs font-bold text-sage-700 mt-0.5">
            Dari {completedOrders.length} pesanan berhasil
          </p>
        </div>

        <div className="p-4 bg-cream-50 border-2 border-espresso rounded-xl shadow-tactile-sm">
          <span className="text-[11px] font-black uppercase tracking-wider text-espresso/60 block">Uang Tunai (Cash)</span>
          <div className="text-xl font-black text-espresso mt-1">
            {formatRupiah(totalTunai)}
          </div>
          <p className="text-xs font-bold text-espresso/60 mt-0.5">
            Tersimpan di laci kasir
          </p>
        </div>

        <div className="p-4 bg-cream-50 border-2 border-espresso rounded-xl shadow-tactile-sm">
          <span className="text-[11px] font-black uppercase tracking-wider text-espresso/60 block">Pembayaran QRIS</span>
          <div className="text-xl font-black text-espresso mt-1">
            {formatRupiah(totalQris)}
          </div>
          <p className="text-xs font-bold text-espresso/60 mt-0.5">
            Transfer digital langsung
          </p>
        </div>
      </div>

      {/* Toast Notifikasi Aksi */}
      {toastMsg && (
        <div className="p-3 bg-amber-100 border-2 border-amber-600 rounded-xl text-amber-900 text-xs font-black shadow-tactile-sm flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span>🔔 {toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="text-amber-800 hover:text-amber-950 font-black">✕</button>
        </div>
      )}

      {/* Tabs Filter Pesanan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-espresso pb-2 gap-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('active');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black border-2 border-espresso transition-all flex items-center gap-1.5 ${
              activeTab === 'active'
                ? 'bg-caramel text-cream shadow-tactile'
                : 'bg-cream-100 text-espresso hover:bg-cream-200'
            }`}
          >
            <span>Perlu Dilayani</span>
            {activeOrders.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-cream text-espresso text-[11px] font-black flex items-center justify-center border border-espresso">
                {activeOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('completed');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black border-2 border-espresso transition-all flex items-center gap-1.5 ${
              activeTab === 'completed'
                ? 'bg-sage text-espresso shadow-tactile'
                : 'bg-cream-100 text-espresso hover:bg-cream-200'
            }`}
          >
            <span>Riwayat Selesai</span>
            <span className="text-[11px] font-bold text-espresso/70">
              ({completedOrders.length})
            </span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('cancelled');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-black border-2 border-espresso transition-all flex items-center gap-1.5 ${
              activeTab === 'cancelled'
                ? 'bg-rose-700 text-cream shadow-tactile'
                : 'bg-cream-100 text-espresso hover:bg-cream-200'
            }`}
          >
            <span>Dibatalkan</span>
            {cancelledOrders.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-200 text-rose-900 text-[10px] font-black">
                {cancelledOrders.length}
              </span>
            )}
          </button>
        </div>

        <div className="text-xs font-bold text-espresso/60 hidden sm:block">
          {activeTab === 'active' ? '⚡ Pesanan aktif otomatis tersembunyi setelah dicentang selesai' : activeTab === 'cancelled' ? 'Daftar pesanan batal & stok telah dikembalikan' : 'Arsip seluruh pesanan selesai'}
        </div>
      </div>

      {/* Daftar Pesanan */}
      {displayedOrders.length === 0 ? (
        <div className="text-center py-16 px-4 card-tactile bg-cream-50">
          <div className="w-16 h-16 rounded-2xl bg-cream-200 border-2 border-espresso flex items-center justify-center mx-auto mb-3 shadow-tactile-sm">
            <CheckCircle2 className="w-8 h-8 text-sage-700" />
          </div>
          <h3 className="text-lg font-black text-espresso mb-1">
            {activeTab === 'active' ? 'Semua Pesanan Sudah Dilayani!' : 'Belum Ada Riwayat Pesanan'}
          </h3>
          <p className="text-xs text-espresso/70 font-bold max-w-sm mx-auto">
            {activeTab === 'active'
              ? 'Santai sejenak sambil menunggu pesanan baru masuk dari pembeli bazar.'
              : 'Pesanan yang telah kamu centang selesai akan tersimpan rapi di tab ini.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedOrders.map((order) => {
            const isPending = order.status === 'pending';
            const isCooking = order.status === 'cooking';
            const isCompleted = order.status === 'completed';
            const isCancelled = order.status === 'cancelled';
            const currentCash = cashInputs[order.id] || 0;
            const change = currentCash > order.total_price ? currentCash - order.total_price : 0;

            return (
              <div
                key={order.id}
                className={`card-tactile p-4 flex flex-col justify-between transition-all ${
                  isCancelled
                    ? 'bg-rose-50/60 border-rose-400 opacity-75'
                    : isCompleted 
                    ? 'bg-cream-200/40 opacity-80' 
                    : isCooking 
                    ? 'bg-caramel-50/40 border-caramel' 
                    : 'bg-cream-50'
                }`}
              >
                <div>
                  {/* Header Order */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-espresso/20">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-caramel">
                          {order.order_number}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border border-espresso ${
                          order.payment_method === 'Tunai' 
                            ? 'bg-amber-100 text-amber-900' 
                            : 'bg-indigo-100 text-indigo-900'
                        }`}>
                          {order.payment_method}
                        </span>
                      </div>
                      <p className="text-sm font-black text-espresso mt-0.5">
                        {order.customer_name}
                      </p>
                      {order.customer_phone && (
                        <a
                          href={`https://wa.me/62${order.customer_phone.replace(/^0/, '').replace(/\D/g, '')}?text=${encodeURIComponent(`Halo kak ${order.customer_name}, kami dari stand bazar CepatkanBayar terkait pesanan ${order.order_number}...`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded-md border border-emerald-400 mt-1 transition-all"
                          title="Hubungi atau verifikasi pembeli via WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-700" />
                          <span>WA: {order.customer_phone}</span>
                        </a>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-espresso/50 block">
                        {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                        isPending ? 'bg-amber-200 text-amber-900' :
                        isCooking ? 'bg-caramel text-cream' :
                        isCompleted ? 'bg-sage text-espresso' :
                        'bg-rose-200 text-rose-900'
                      }`}>
                        {isPending ? 'Menunggu' : isCooking ? 'Sedang Diracik' : isCompleted ? 'Selesai' : 'Dibatalkan'}
                      </span>
                    </div>
                  </div>

                  {/* Catatan Meja / Khusus */}
                  {order.notes && (
                    <div className="my-2 p-2 bg-cream-100 rounded-lg border border-espresso/20 text-xs font-bold text-espresso/90 flex items-center gap-1.5">
                      <span className="text-caramel font-black">Catatan:</span> {order.notes}
                    </div>
                  )}

                  {/* List Item */}
                  <div className="py-2.5 space-y-1.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs font-bold text-espresso">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-cream-200 border border-espresso/40 flex items-center justify-center text-[11px] font-black text-espresso">
                            {item.qty}×
                          </span>
                          <span>{item.name}</span>
                        </div>
                        <span>{formatRupiah(item.price * item.qty)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Total Price */}
                  <div className="pt-2 border-t border-espresso/20 flex justify-between items-center">
                    <span className="text-xs font-bold text-espresso/60 uppercase">Total Tagihan</span>
                    <span className="text-lg font-black text-caramel">
                      {formatRupiah(order.total_price)}
                    </span>
                  </div>

                  {/* Quick Change Calculator (Hanya untuk pesanan aktif yang belum selesai) */}
                  {!isCompleted && !isCancelled && order.payment_method === 'Tunai' && (
                    <div className="mt-3 p-2.5 bg-cream-100 rounded-xl border border-espresso/30 text-xs space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-espresso/70">
                        <span>Hitung Kembalian Cepat:</span>
                        {change > 0 && (
                          <span className="font-black text-sage-800 bg-sage-100 px-1.5 py-0.5 rounded border border-sage-600">
                            Kembalian: {formatRupiah(change)}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => handleSetCash(order.id, order.total_price)}
                          className="px-2 py-1 rounded bg-cream border border-espresso text-[10px] font-bold hover:bg-cream-200"
                        >
                          Uang Pas
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetCash(order.id, 20000)}
                          className="px-2 py-1 rounded bg-cream border border-espresso text-[10px] font-bold hover:bg-cream-200"
                        >
                          20k
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetCash(order.id, 50000)}
                          className="px-2 py-1 rounded bg-cream border border-espresso text-[10px] font-bold hover:bg-cream-200"
                        >
                          50k
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetCash(order.id, 100000)}
                          className="px-2 py-1 rounded bg-cream border border-espresso text-[10px] font-bold hover:bg-cream-200"
                        >
                          100k
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tombol Aksi Kasir */}
                <div className="mt-4 pt-3 border-t-2 border-espresso">
                  {!isCompleted && !isCancelled ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {isPending && (
                          <button
                            onClick={() => handleStartCooking(order.id)}
                            className="btn-tactile-cream px-3 py-2.5 text-xs flex items-center justify-center gap-1.5 font-bold"
                            title="Tandai sedang diracik"
                          >
                            <Utensils className="w-3.5 h-3.5" />
                            <span>Racik</span>
                          </button>
                        )}

                        {/* Tombol Centang Selesai Dilayani */}
                        <button
                          onClick={() => handleCompleteOrder(order)}
                          className="btn-tactile-sage flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5 font-black text-espresso shadow-tactile"
                          title="Tandai selesai dilayani & sembunyikan dari antrean"
                        >
                          <CheckCircle2 className="w-4 h-4 text-espresso" />
                          <span>Selesai Dilayani ✓</span>
                        </button>

                        {/* Tombol Batalkan / Tolak Pesanan */}
                        <button
                          onClick={() => setConfirmCancelId(order.id)}
                          className="p-2.5 rounded-xl bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-400 text-xs font-bold shadow-tactile-sm"
                          title="Batalkan pesanan & kembalikan stok menu otomatis"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Modal Konfirmasi Pembatalan Inline */}
                      {confirmCancelId === order.id && (
                        <div className="p-2.5 bg-rose-50 border-2 border-rose-500 rounded-xl text-xs space-y-2 animate-in fade-in zoom-in-95">
                          <p className="font-black text-rose-900 leading-tight">
                            ⚠️ Batalkan pesanan #{order.order_number}? Stok seluruh menu yang dipesan akan otomatis dikembalikan ke etalase.
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCancelOrder(order)}
                              className="px-3 py-1.5 rounded-lg bg-rose-700 text-cream font-black text-xs border border-espresso shadow-tactile-sm hover:bg-rose-800"
                            >
                              Ya, Batalkan & Kembalikan Stok
                            </button>
                            <button
                              onClick={() => setConfirmCancelId(null)}
                              className="px-2.5 py-1.5 rounded-lg bg-cream text-espresso font-bold text-xs border border-espresso hover:bg-cream-100"
                            >
                              Jangan Batal
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : isCompleted ? (
                    <div className="w-full text-center py-1 text-xs font-bold text-sage-800 bg-sage-100 rounded-lg border border-sage-600 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pesanan Sudah Selesai
                    </div>
                  ) : (
                    <div className="w-full text-center py-1.5 text-xs font-black text-rose-800 bg-rose-100 rounded-lg border border-rose-400 flex items-center justify-center gap-1.5">
                      <Ban className="w-3.5 h-3.5 text-rose-700" />
                      <span>Pesanan Dibatalkan (Stok Dikembalikan)</span>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
