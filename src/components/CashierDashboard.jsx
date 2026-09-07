import React, { useState } from 'react';
import { 
  CheckCircle2, Utensils, Package, QrCode, 
  AlertCircle, Sparkles, Calculator,
  MessageCircle, Ban, Trash2, Bot, RefreshCw
} from 'lucide-react';
import { formatRupiah } from './MenuCard';
import { sound } from '../lib/audio';
import { sendPickupNotification, getFonnteToken } from '../lib/whatsapp';
import { markOrderWaNotified } from '../lib/storage';
import WaBotModal from './WaBotModal';

export default function CashierDashboard({
  orders,
  menus,
  onUpdateStatus,
  onValidatePayment,
  onOpenStockManager,
  onOpenMenuManager,
  onOpenQrModal,
  onOpenFinancial,
  onDeleteOrder,
  onClearAllOrders
}) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed' | 'cancelled' | 'all'
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [sendingWaId, setSendingWaId] = useState(null);
  const [hasFonnteToken, setHasFonnteToken] = useState(() => Boolean(getFonnteToken()));

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

  // Centang Selesai Dilayani (Sesuai permintaan Chandra: otomatis tersembunyi dari layar antrean aktif)
  const handleCompleteOrder = async (order) => {
    sound.playComplete();
    // Jika pesanan QRIS dan belum divalidasi, otomatis validasi saat diselesaikan
    if (order.payment_method === 'QRIS' && !order.is_qris_validated && onValidatePayment) {
      await onValidatePayment(order.id, true);
    }
    await onUpdateStatus(order.id, 'completed');
  };

  const handleStartCooking = async (orderId) => {
    sound.playClick();
    await onUpdateStatus(orderId, 'cooking');
  };

  // Notifikasi WhatsApp: Pesanan Siap Diambil
  const handleSendPickupWa = async (order) => {
    sound.playClick();
    setSendingWaId(order.id);
    try {
      const result = await sendPickupNotification(order);
      if (result.success) {
        sound.playComplete();
        await markOrderWaNotified(order.id);
        // Refresh local orders via status update broadcast
        await onUpdateStatus(order.id, order.status);
        setToastMsg(`Panggilan WhatsApp berhasil: ${order.customer_name} (${order.order_number}) 📢`);
      } else {
        sound.playRemove();
        setToastMsg(`Gagal kirim WA: ${result.reason || 'Cek nomor pembeli'}`);
      }
    } catch (err) {
      console.error('Gagal kirim notifikasi WA:', err);
      sound.playRemove();
      setToastMsg('Gagal mengirim panggilan WhatsApp.');
    } finally {
      setSendingWaId(null);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  // Batalkan Pesanan & Restorasi Stok Otomatis
  const handleCancelOrder = async (order) => {
    sound.playRemove();
    await onUpdateStatus(order.id, 'cancelled');
    setConfirmCancelId(null);
    setToastMsg(`Pesanan ${order.order_number} (${order.customer_name}) dibatalkan. Stok menu otomatis dikembalikan!`);
    setTimeout(() => setToastMsg(null), 5000);
  };

  // Hapus single pesanan testing
  const handleDeleteSingle = async (orderId) => {
    sound.playRemove();
    if (onDeleteOrder) {
      await onDeleteOrder(orderId);
    }
    setConfirmDeleteId(null);
    setToastMsg(`Pesanan telah dihapus dari database.`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Reset / Hapus semua riwayat pesanan
  const handleClearAll = async () => {
    sound.playRemove();
    if (onClearAllOrders) {
      await onClearAllOrders();
    }
    setConfirmClearAll(false);
    setToastMsg(`Semua riwayat pesanan berhasil dibersihkan! Antrean kembali ke #001.`);
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
          {/* Tombol Buku Kas & Modal */}
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenFinancial) onOpenFinancial();
            }}
            className="px-3 py-2 text-xs flex items-center gap-1.5 font-black bg-amber-400 text-espresso border-2 border-espresso rounded-xl shadow-tactile-sm hover:brightness-105 active:translate-y-0.5 transition-all"
            title="Buku Kas, Input Modal & Monitoring Keuangan Stand"
          >
            <Calculator className="w-4 h-4 text-espresso" />
            <span>💰 Buku Kas & Modal</span>
          </button>

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
              setIsWaModalOpen(true);
            }}
            className="px-3 py-2 text-xs flex items-center gap-1.5 font-black bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-espresso rounded-xl shadow-tactile-sm active:translate-y-0.5 transition-all"
            title="Pengaturan Bot WhatsApp Notifikasi Pesanan Siap"
          >
            <Bot className="w-4 h-4 text-white" />
            <span>Bot WA {hasFonnteToken ? '✓' : '⚙️'}</span>
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

      {/* Banner Tombol Reset Semua Pesanan Testing (Selesai & Batal) */}
      {(activeTab === 'completed' || activeTab === 'cancelled') && displayedOrders.length > 0 && (
        <div className="p-3.5 bg-rose-50 border-2 border-rose-500 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-tactile-sm animate-in fade-in">
          <div className="flex items-center gap-2.5 text-rose-900">
            <div className="w-8 h-8 rounded-xl bg-rose-200 border border-rose-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4 text-rose-800" />
            </div>
            <div>
              <h4 className="font-black text-xs sm:text-sm">Siap Mulai Bazar?</h4>
              <p className="text-[11px] font-bold text-rose-800/80">
                Hapus seluruh riwayat pesanan agar nomor antrean kembali ke <strong>#001</strong> dan omzet kembali ke <strong>Rp 0</strong>.
              </p>
            </div>
          </div>

          {confirmClearAll ? (
            <div className="flex items-center gap-2 shrink-0 bg-white p-1.5 rounded-xl border border-rose-400">
              <span className="text-[11px] font-black text-rose-700">Yakin hapus semua?</span>
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 rounded-lg bg-rose-700 text-cream text-xs font-black border border-espresso hover:bg-rose-800 shadow-tactile-sm"
              >
                Ya, Hapus Sekarang!
              </button>
              <button
                onClick={() => setConfirmClearAll(false)}
                className="px-2.5 py-1.5 rounded-lg bg-cream text-espresso text-xs font-bold border border-espresso hover:bg-cream-200"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClearAll(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-700 text-cream text-xs font-black border-2 border-espresso shadow-tactile-sm hover:bg-rose-800 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 shrink-0"
              title="Hapus seluruh riwayat pesanan agar antrean kembali ke #001"
            >
              <Trash2 className="w-3.5 h-3.5 text-cream" />
              <span>🗑️ Hapus Semua Riwayat</span>
            </button>
          )}
        </div>
      )}

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
                      <div className="flex flex-wrap items-center gap-1.5">
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

                        {/* Badge Validasi Khusus QRIS di Header */}
                        {order.payment_method === 'QRIS' && (
                          order.is_qris_validated ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-500 flex items-center gap-1 shadow-tactile-sm">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Lunas ✓</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-950 border border-amber-500 flex items-center gap-1 animate-pulse shadow-tactile-sm">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              <span>Belum Valid</span>
                            </span>
                          )
                        )}

                        {(order.delivery_type === 'delivery' || (order.notes && order.notes.includes('🛵 Diantar'))) ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-caramel text-cream border border-espresso shadow-tactile-sm">
                            🛵 Diantar ke Kelas
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-sage text-espresso border border-espresso shadow-tactile-sm">
                            🚶 Ambil di Kasir
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-black text-espresso mt-1">
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
                  {(() => {
                    const cleanNote = (order.display_notes || order.notes || '')
                      .replace(/\[\s*(🛵|🚶)?[^\]]*\]/g, '')
                      .trim();
                    if (!cleanNote) return null;
                    return (
                      <div className="my-2 p-2 bg-cream-100 rounded-lg border border-espresso/20 text-xs font-bold text-espresso/90 flex items-center gap-1.5">
                        <span className="text-caramel font-black">Catatan:</span> {cleanNote}
                      </div>
                    );
                  })()}

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

                  {/* Tombol & Status Validasi Pembayaran Khusus QRIS */}
                  {order.payment_method === 'QRIS' && (
                    <div className="mt-3">
                      {order.is_qris_validated ? (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border-2 border-emerald-600 flex items-center justify-between shadow-tactile-sm">
                          <div className="flex items-center gap-2 text-emerald-900 font-black text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Pembayaran QRIS Valid (Lunas ✓)</span>
                          </div>
                          {!isCompleted && !isCancelled && onValidatePayment && (
                            <button
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                onValidatePayment(order.id, false);
                              }}
                              className="text-[10px] text-espresso/60 hover:text-rose-600 font-bold underline shrink-0 ml-2"
                              title="Batalkan validasi jika salah klik"
                            >
                              Batal
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-amber-50 border-2 border-amber-500 space-y-2 shadow-tactile-sm">
                          <div className="flex items-center justify-between text-xs font-black text-amber-900">
                            <span className="flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>Cek Mutasi / Bukti Transfer</span>
                            </span>
                            <span className="text-[10px] bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded font-black">
                              Menunggu Validasi
                            </span>
                          </div>
                          {!isCompleted && !isCancelled && onValidatePayment && (
                            <button
                              type="button"
                              onClick={() => {
                                sound.playComplete();
                                onValidatePayment(order.id, true);
                              }}
                              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 border-2 border-espresso shadow-tactile transition-all"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Validasi Pembayaran (Sudah Bayar ✓)</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Tombol Aksi Kasir */}
                <div className="mt-4 pt-3 border-t-2 border-espresso">
                  {!isCompleted && !isCancelled ? (
                    <div className="space-y-2">
                      {/* Opsi Panggilan WhatsApp: Pesanan Siap Diambil (Opsional) */}
                      {order.customer_phone && (
                        <div>
                          {order.is_wa_notified ? (
                            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-500 flex items-center justify-between shadow-tactile-sm">
                              <span className="text-[11px] font-black text-emerald-900 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Sudah Dipanggil via WA ✓</span>
                              </span>
                              <button
                                type="button"
                                disabled={sendingWaId === order.id}
                                onClick={() => handleSendPickupWa(order)}
                                className="text-[10px] font-black text-emerald-700 hover:text-emerald-950 underline flex items-center gap-1 disabled:opacity-50"
                                title="Kirim ulang chat panggil jika pembeli belum datang ke meja stand"
                              >
                                <RefreshCw className={`w-3 h-3 ${sendingWaId === order.id ? 'animate-spin' : ''}`} />
                                <span>Panggil Lagi</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={sendingWaId === order.id}
                              onClick={() => handleSendPickupWa(order)}
                              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:translate-y-0.5 text-white font-black text-xs flex items-center justify-center gap-2 border-2 border-espresso shadow-tactile transition-all disabled:opacity-50"
                              title="Kirim pesan WhatsApp: pesanan sudah siap diambil!"
                            >
                              {sendingWaId === order.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                              ) : (
                                <MessageCircle className="w-3.5 h-3.5 text-white" />
                              )}
                              <span>📢 Pesanan Siap Diambil (Chat WA)</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Tombol Utama Racik & Selesai Dilayani */}
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

                        {/* Tombol Centang Selesai Dilayani (Bebas diklik langsung tanpa wajib kirim WA!) */}
                        <button
                          onClick={() => handleCompleteOrder(order)}
                          className="btn-tactile-success flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5 font-black text-white shadow-tactile"
                          title="Tandai selesai dilayani & sembunyikan dari antrean"
                        >
                          <CheckCircle2 className="w-4 h-4 text-white" />
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
                    <div className="space-y-2">
                      <div className="w-full text-center py-1.5 text-xs font-black text-sage-800 bg-sage-100 rounded-xl border border-sage-600 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-sage-700" />
                        <span>Pesanan Sudah Selesai Dilayani</span>
                      </div>
                      
                      {/* Tombol Hapus Single Order (Testing) */}
                      <div className="flex justify-end pt-1">
                        {confirmDeleteId === order.id ? (
                          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-rose-300">
                            <span className="text-[10px] font-black text-rose-700">Hapus pesanan ini?</span>
                            <button
                              onClick={() => handleDeleteSingle(order.id)}
                              className="px-2 py-0.5 rounded bg-rose-700 text-cream text-[10px] font-black hover:bg-rose-800"
                            >
                              Ya
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-0.5 rounded bg-cream text-espresso text-[10px] font-bold border border-espresso"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(order.id)}
                            className="text-[11px] font-bold text-rose-700/70 hover:text-rose-900 flex items-center gap-1 hover:underline"
                            title="Hapus riwayat pesanan testing ini"
                          >
                            <Trash2 className="w-3 h-3" /> Hapus Transaksi Ini
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-full text-center py-1.5 text-xs font-black text-rose-800 bg-rose-100 rounded-xl border border-rose-400 flex items-center justify-center gap-1.5">
                        <Ban className="w-4 h-4 text-rose-700" />
                        <span>Pesanan Dibatalkan (Stok Dikembalikan)</span>
                      </div>

                      {/* Tombol Hapus Single Order (Testing) */}
                      <div className="flex justify-end pt-1">
                        {confirmDeleteId === order.id ? (
                          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-rose-300">
                            <span className="text-[10px] font-black text-rose-700">Hapus pesanan ini?</span>
                            <button
                              onClick={() => handleDeleteSingle(order.id)}
                              className="px-2 py-0.5 rounded bg-rose-700 text-cream text-[10px] font-black hover:bg-rose-800"
                            >
                              Ya
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-0.5 rounded bg-cream text-espresso text-[10px] font-bold border border-espresso"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(order.id)}
                            className="text-[11px] font-bold text-rose-700/70 hover:text-rose-900 flex items-center gap-1 hover:underline"
                            title="Hapus riwayat pesanan testing ini"
                          >
                            <Trash2 className="w-3 h-3" /> Hapus Transaksi Ini
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal Pengaturan Bot WhatsApp */}
      <WaBotModal
        isOpen={isWaModalOpen}
        onClose={() => setIsWaModalOpen(false)}
        onTokenUpdated={() => setHasFonnteToken(Boolean(getFonnteToken()))}
      />

    </div>
  );
}
