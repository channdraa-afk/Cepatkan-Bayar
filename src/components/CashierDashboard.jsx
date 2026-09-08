import React, { useState } from 'react';
import { 
  CheckCircle2, Utensils, Package, QrCode, 
  AlertCircle, Sparkles, Calculator,
  MessageCircle, Ban, Trash2, Bot, RefreshCw,
  Banknote, Clock
} from 'lucide-react';
import { formatRupiah } from './MenuCard';
import { sound } from '../lib/audio';
import { sendPickupNotification, sendCompletedNotification, getFonnteToken } from '../lib/whatsapp';
import { markOrderWaNotified } from '../lib/storage';
import WaBotModal from './WaBotModal';

export default function CashierDashboard({
  orders,
  menus,
  onUpdateStatus,
  onValidatePayment,
  onUpdateChefDelivery,
  onOpenStockManager,
  onOpenMenuManager,
  onOpenQrModal,
  onOpenFinancial,
  onDeleteOrder,
  onClearAllOrders
}) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed' | 'cancelled' | 'all'
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [sendingWaId, setSendingWaId] = useState(null);
  const [hasFonnteToken, setHasFonnteToken] = useState(() => Boolean(getFonnteToken()));

  // Filter Orders
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const cookingOrders = orders.filter(o => o.status === 'cooking');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const completedOrders = orders.filter(o => o.status === 'completed');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');
  // Antrean aktif mencakup pending (menunggu), cooking (dimasak), dan ready (selesai dimasak chef tapi belum lunas/diantar kasir)
  const activeOrders = orders.filter(o => o.status === 'pending' || o.status === 'cooking' || o.status === 'ready');

  // Urutan Cerdas: 'ready' (sudah matang dari chef) paling atas agar kasir segera mengantar/memanggil! Lalu 'pending', lalu 'cooking'.
  const sortedActiveOrders = [...activeOrders].sort((a, b) => {
    if (a.status === 'ready' && b.status !== 'ready') return -1;
    if (b.status === 'ready' && a.status !== 'ready') return 1;
    if (a.status === 'pending' && b.status === 'cooking') return -1;
    if (a.status === 'cooking' && b.status === 'pending') return 1;
    return new Date(a.created_at) - new Date(b.created_at);
  });

  const displayedOrders = 
    activeTab === 'pending'
      ? pendingOrders
      : activeTab === 'cooking'
      ? cookingOrders
      : activeTab === 'ready'
      ? readyOrders
      : activeTab === 'completed'
      ? completedOrders 
      : activeTab === 'cancelled'
      ? cancelledOrders
      : sortedActiveOrders;

  const totalOmzet = completedOrders.reduce((sum, o) => sum + o.total_price, 0);
  const totalTunai = completedOrders
    .filter(o => o.payment_method === 'Tunai')
    .reduce((sum, o) => sum + o.total_price, 0);
  const totalQris = completedOrders
    .filter(o => o.payment_method === 'QRIS')
    .reduce((sum, o) => sum + o.total_price, 0);

  // Centang Selesai Dilayani & Kirim Notifikasi WA "Selamat Menikmati"
  const handleCompleteOrder = async (order) => {
    sound.playComplete();
    // Jika pesanan (QRIS / Tunai) belum divalidasi, otomatis validasi saat diselesaikan
    if (!order.is_paid && onValidatePayment) {
      await onValidatePayment(order.id, true);
    }
    await onUpdateStatus(order.id, 'completed');

    // Otomatis kirim WhatsApp "Pesanan Selesai & Selamat Menikmati" ke pembeli
    if (order.customer_phone) {
      setSendingWaId(order.id);
      try {
        const result = await sendCompletedNotification(order);
        if (result.success) {
          setToastMsg(`✅ Pesanan ${order.order_number} selesai & WA "Selamat Menikmati" terkirim ke ${order.customer_name}!`);
        } else {
          setToastMsg(`Pesanan ${order.order_number} selesai dilayani.`);
        }
      } catch (err) {
        console.warn('Gagal kirim WA selesai otomatis:', err);
      } finally {
        setSendingWaId(null);
        setTimeout(() => setToastMsg(null), 5000);
      }
    } else {
      setToastMsg(`Pesanan ${order.order_number} selesai dilayani.`);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  // Kirim manual pesan WA "Selamat Menikmati" dari tab Riwayat Pesanan
  const handleSendCompletedWaManual = async (order) => {
    sound.playClick();
    setSendingWaId(order.id);
    try {
      const result = await sendCompletedNotification(order);
      if (result.success) {
        sound.playComplete();
        setToastMsg(`✅ Pesan "Selamat Menikmati" terkirim ke ${order.customer_name}!`);
      } else {
        sound.playRemove();
        setToastMsg(`Gagal kirim WA: ${result.reason}`);
      }
    } catch {
      sound.playRemove();
      setToastMsg('Gagal mengirim WhatsApp.');
    } finally {
      setSendingWaId(null);
      setTimeout(() => setToastMsg(null), 5000);
    }
  };

  const handleStartCooking = async (orderId) => {
    sound.playClick();
    await onUpdateStatus(orderId, 'cooking');
  };

  // Notifikasi WhatsApp: Pesanan Siap Diambil / Sedang Diantar
  const handleSendPickupWa = async (order) => {
    sound.playClick();
    setSendingWaId(order.id);
    const isDelivery = order.delivery_type === 'delivery' || 
      (order.notes && order.notes.includes('🛵 Diantar'));
    try {
      const result = await sendPickupNotification(order);
      if (result.success) {
        sound.playComplete();
        await markOrderWaNotified(order.id);
        // Refresh local orders via status update broadcast
        await onUpdateStatus(order.id, order.status);
        const actionLabel = isDelivery ? '🛵 Info pesanan sedang diantar' : '📢 Panggilan pesanan siap';
        setToastMsg(`${actionLabel} berhasil dikirim ke ${order.customer_name} (${order.order_number})!`);
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

  // Batalkan / Tolak Pesanan Fiktif & Restorasi Stok Otomatis
  const handleCancelOrder = async (order) => {
    sound.playRemove();
    await onUpdateStatus(order.id, 'cancelled');
    setConfirmCancelId(null);
    setToastMsg(`🚫 Pesanan ${order.order_number} (${order.customer_name}) ditolak sebagai pesanan fiktif. Stok menu otomatis dikembalikan!`);
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
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-sage border border-espresso text-espresso">
              ● Mode Kasir Aktif
            </span>
            <span className="text-xs font-bold text-espresso/60 flex items-center gap-1.5 flex-wrap">
              <span>Total Antrean: <strong className="text-caramel">{activeOrders.length}</strong></span>
              <span>•</span>
              <span className="text-amber-800 font-black">⏳ {pendingOrders.length} Belum Racik</span>
              <span>•</span>
              <span className="text-caramel font-black">🔥 {cookingOrders.length} Dimasak</span>
              <span>•</span>
              <span className="text-emerald-700 font-black">🍲 {readyOrders.length} Siap Saji</span>
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

      {/* Tabs Filter Pesanan: 3 Tahapan Utama Dapur/Kasir + Riwayat */}
      <div className="flex flex-col gap-2 border-b-2 border-espresso pb-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab 1: Belum Diracik */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('pending');
            }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black border-2 border-espresso transition-all flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-amber-400 text-espresso shadow-tactile'
                : 'bg-cream-100 text-espresso hover:bg-cream-200'
            }`}
          >
            <span>⏳ Belum Diracik</span>
            {pendingOrders.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-950 text-[10px] font-black border border-espresso">
                {pendingOrders.length}
              </span>
            )}
          </button>

          {/* Tab 2: Sedang Diracik */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('cooking');
            }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black border-2 border-espresso transition-all flex items-center gap-1.5 ${
              activeTab === 'cooking'
                ? 'bg-caramel text-cream shadow-tactile'
                : 'bg-cream-100 text-espresso hover:bg-cream-200'
            }`}
          >
            <span>🔥 Sedang Diracik</span>
            {cookingOrders.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-cream text-espresso text-[10px] font-black border border-espresso">
                {cookingOrders.length}
              </span>
            )}
          </button>

          {/* Tab 3: Sudah Dimasak Chef (Highlight Menonjol) */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('ready');
            }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black border-2 border-espresso transition-all flex items-center gap-1.5 ${
              activeTab === 'ready'
                ? 'bg-emerald-600 text-white shadow-tactile'
                : readyOrders.length > 0
                ? 'bg-emerald-100 text-emerald-950 border-emerald-600 hover:bg-emerald-200 animate-pulse'
                : 'bg-cream-100 text-espresso hover:bg-cream-200'
            }`}
          >
            <span>🍲 Sudah Dimasak Chef</span>
            {readyOrders.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black border border-espresso animate-bounce">
                {readyOrders.length}
              </span>
            )}
          </button>

          {/* Tab 4: Semua Antrean */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('active');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-black border-2 border-espresso transition-all flex items-center gap-1.5 ${
              activeTab === 'active'
                ? 'bg-espresso text-cream shadow-tactile'
                : 'bg-cream-100 text-espresso/70 hover:bg-cream-200'
            }`}
          >
            <span>📋 Semua Antrean ({activeOrders.length})</span>
          </button>

          <span className="hidden sm:inline-block w-px h-6 bg-espresso/20 mx-1" />

          {/* Tab 5: Riwayat Selesai */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('completed');
            }}
            className={`px-3 py-2 rounded-xl text-xs font-black border-2 border-espresso transition-all flex items-center gap-1.5 ${
              activeTab === 'completed'
                ? 'bg-sage text-espresso shadow-tactile'
                : 'bg-cream-100 text-espresso/70 hover:bg-cream-200'
            }`}
          >
            <span>✓ Selesai ({completedOrders.length})</span>
          </button>

          {/* Tab 6: Dibatalkan */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('cancelled');
            }}
            className={`px-2.5 py-2 rounded-xl text-xs font-black border-2 border-espresso transition-all flex items-center gap-1.5 ${
              activeTab === 'cancelled'
                ? 'bg-rose-700 text-cream shadow-tactile'
                : 'bg-cream-100 text-espresso/70 hover:bg-cream-200'
            }`}
          >
            <span>🚫 Batal ({cancelledOrders.length})</span>
          </button>
        </div>

        <div className="text-xs font-bold text-espresso/60">
          {activeTab === 'pending'
            ? '⏳ Pesanan baru masuk yang menunggu divalidasi kasir dan dikirim ke dapur chef'
            : activeTab === 'cooking'
            ? '🔥 Pesanan yang sedang dimasak dan diracik di dapur oleh chef'
            : activeTab === 'ready'
            ? '🍲 Pesanan yang SUDAH selesai dimasak chef! Siap diserahkan/diantar dan diselesaikan'
            : activeTab === 'active'
            ? '📋 Menampilkan seluruh antrean aktif (siap saji, baru, & diracik)'
            : activeTab === 'cancelled'
            ? '🚫 Daftar pesanan yang ditolak/dibatalkan & stok telah dikembalikan'
            : '✓ Arsip seluruh transaksi pesanan yang telah selesai dilayani'}
        </div>
      </div>

      {/* Daftar Pesanan */}
      {displayedOrders.length === 0 ? (
        <div className="text-center py-16 px-4 card-tactile bg-cream-50">
          <div className="w-16 h-16 rounded-2xl bg-cream-200 border-2 border-espresso flex items-center justify-center mx-auto mb-3 shadow-tactile-sm">
            {activeTab === 'ready' ? (
              <Utensils className="w-8 h-8 text-emerald-700" />
            ) : activeTab === 'cooking' ? (
              <Flame className="w-8 h-8 text-caramel" />
            ) : activeTab === 'pending' ? (
              <Clock className="w-8 h-8 text-amber-800" />
            ) : (
              <CheckCircle2 className="w-8 h-8 text-sage-700" />
            )}
          </div>
          <h3 className="text-lg font-black text-espresso mb-1">
            {activeTab === 'pending'
              ? 'Tidak Ada Pesanan Belum Diracik'
              : activeTab === 'cooking'
              ? 'Dapur Sedang Lengang'
              : activeTab === 'ready'
              ? 'Belum Ada Masakan Jadi dari Chef'
              : activeTab === 'completed'
              ? 'Belum Ada Riwayat Pesanan Selesai'
              : activeTab === 'cancelled'
              ? 'Tidak Ada Pesanan Dibatalkan'
              : 'Semua Pesanan Sudah Dilayani!'}
          </h3>
          <p className="text-xs text-espresso/70 font-bold max-w-sm mx-auto">
            {activeTab === 'pending'
              ? 'Semua pesanan baru sudah divalidasi kasir dan dikirim ke dapur.'
              : activeTab === 'cooking'
              ? 'Tidak ada pesanan yang sedang dimasak chef saat ini.'
              : activeTab === 'ready'
              ? 'Begitu chef menekan selesai di dapur, pesanan matang akan langsung muncul di sini!'
              : activeTab === 'completed'
              ? 'Pesanan yang telah kamu centang selesai akan tersimpan rapi di tab ini.'
              : activeTab === 'cancelled'
              ? 'Pesanan yang ditolak fiktif akan tercatat di tab ini.'
              : 'Santai sejenak sambil menunggu pesanan baru masuk dari pembeli bazar.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedOrders.map((order) => {
            const isPending = order.status === 'pending';
            const isCooking = order.status === 'cooking';
            const isReady = order.status === 'ready';
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
                    : isReady
                    ? 'bg-emerald-50/90 border-2 border-emerald-600 shadow-tactile-lg'
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

                        {/* Badge Validasi QRIS di Header */}
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

                        {/* Badge Validasi & Timing Tunai di Header */}
                        {order.payment_method === 'Tunai' && (
                          order.is_cash_paid ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-500 flex items-center gap-1 shadow-tactile-sm">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Lunas ✓</span>
                            </span>
                          ) : order.cash_timing === 'upfront' ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-200 text-amber-950 border border-amber-600 flex items-center gap-1 animate-pulse shadow-tactile-sm">
                              <AlertCircle className="w-3 h-3 text-amber-700" />
                              <span>Bayar di Meja Kasir</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-orange-100 text-orange-950 border border-orange-500 flex items-center gap-1 shadow-tactile-sm">
                              <Clock className="w-3 h-3 text-orange-600" />
                              <span>Bayar Pas Ambil (COD)</span>
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

                        {/* Status Laporan Pengantaran (HANYA jika sudah menandai sudah diantar) */}
                        {order.is_chef_delivered && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-600 text-white border border-espresso shadow-tactile-sm flex items-center gap-1 animate-pulse">
                            <span>🛵</span>
                            <span>Sudah Diantar Team Pengantar</span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-black text-espresso mt-1">
                        {order.customer_name}
                      </p>
                      {order.customer_phone && (
                        <a
                          href={`https://wa.me/62${order.customer_phone.replace(/^0/, '').replace(/\D/g, '')}?text=${encodeURIComponent(`Halo kak ${order.customer_name}, kami dari Lunar Cafe terkait pesanan ${order.order_number}...`)}`}
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
                        isReady ? 'bg-emerald-600 text-white animate-pulse shadow-tactile-sm' :
                        isPending ? 'bg-amber-200 text-amber-900' :
                        isCooking ? 'bg-caramel text-cream' :
                        isCompleted ? 'bg-sage text-espresso' :
                        'bg-rose-200 text-rose-900'
                      }`}>
                        {isReady ? '🍲 Selesai Dimasak Chef' :
                         isPending ? 'Menunggu' :
                         isCooking ? 'Sedang Diracik' :
                         isCompleted ? 'Selesai' :
                         'Dibatalkan'}
                      </span>
                    </div>
                  </div>

                  {/* Banner Notifikasi jika Pesanan Sudah Selesai Dimasak Chef */}
                  {isReady && (
                    <div className={`mt-2 p-2.5 rounded-xl border flex flex-col gap-2 shadow-tactile-sm ${
                      order.payment_method === 'Tunai' && !order.is_cash_paid
                        ? 'bg-amber-100 border-2 border-amber-600 animate-pulse'
                        : order.is_chef_delivered
                        ? 'bg-purple-100 border-2 border-purple-600'
                        : 'bg-emerald-100 border border-emerald-500'
                    }`}>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-black text-xs">
                          <span className="text-base">{order.is_chef_delivered ? '🛵' : '🍲'}</span>
                          <span className={order.payment_method === 'Tunai' && !order.is_cash_paid ? 'text-amber-950' : order.is_chef_delivered ? 'text-purple-950' : 'text-emerald-950'}>
                            {order.is_chef_delivered ? (
                              <>
                                <strong>SUDAH DIANTAR OLEH TEAM PENGANTAR!</strong>
                                {order.chef_note ? ` ("${order.chef_note}")` : ''}
                              </>
                            ) : (
                              <>Sudah Selesai Dimasak Chef! Siap diserahkan / diantar.</>
                            )}
                          </span>
                        </div>

                        {order.payment_method === 'Tunai' && !order.is_cash_paid && onValidatePayment && (
                          <button
                            type="button"
                            onClick={() => {
                              sound.playComplete();
                              onValidatePayment(order.id, true);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black border border-espresso shadow-tactile-sm shrink-0 active:translate-y-0.5"
                          >
                            Terima Uang ({formatRupiah(order.total_price)}) ✓
                          </button>
                        )}
                      </div>

                      {order.payment_method === 'Tunai' && !order.is_cash_paid && (
                        <div className="text-[11px] font-black text-amber-900 bg-amber-200/80 px-2 py-1 rounded-lg border border-amber-400">
                          ⚠️ {order.is_chef_delivered 
                            ? `Makanan sudah diantar tapi TUNAI BELUM DITERIMA! Jangan lupa tagih ${formatRupiah(order.total_price)}!`
                            : `TAGIH TUNAI ${formatRupiah(order.total_price)} saat menyerahkan makanan!`}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Laporan Catatan Pengantaran (HANYA tampil jika sudah diantar atau ada catatan khusus) */}
                  {(order.is_chef_delivered || order.chef_note) && (
                    <div className="my-2 p-2.5 rounded-xl border border-purple-300 bg-purple-50/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{order.is_chef_delivered ? '🛵' : '📝'}</span>
                        <div>
                          <span className="font-black text-purple-950">
                            {order.is_chef_delivered ? 'Laporan: Sudah Diantar Team Pengantar' : 'Catatan Pengantaran'}
                          </span>
                          {order.chef_note && (
                            <p className="text-[11px] font-bold text-purple-800">
                              "{order.chef_note}"
                            </p>
                          )}
                        </div>
                      </div>

                      {!isCompleted && !isCancelled && onUpdateChefDelivery && (
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            onUpdateChefDelivery(
                              order.id, 
                              !order.is_chef_delivered, 
                              order.chef_note || ''
                            );
                          }}
                          className="text-[10px] font-black text-purple-900 hover:underline shrink-0 bg-white px-2 py-1 rounded-md border border-purple-300 shadow-tactile-sm"
                        >
                          {order.is_chef_delivered ? 'Batal Tandai Antar' : 'Tandai Sudah Diantar Team'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Catatan Meja / Khusus */}
                  {(() => {
                    const cleanNote = (order.display_notes || order.notes || '')
                      .replace(/\[\s*(🛵|🚶)?[^\]]*\]/g, '')
                      .trim();
                    if (!cleanNote) return null;
                    return (
                      <div className="my-2 p-2 bg-cream-100 rounded-lg border border-espresso/20 text-xs font-bold text-espresso/90 flex items-center gap-1.5">
                        <span className="text-caramel font-black">Catatan Pembeli:</span> {cleanNote}
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

                  {/* Tombol & Status Validasi Pembayaran Tunai */}
                  {order.payment_method === 'Tunai' && (
                    <div className="mt-3">
                      {order.is_cash_paid ? (
                        <div className="p-2.5 rounded-xl bg-emerald-50 border-2 border-emerald-600 flex items-center justify-between shadow-tactile-sm">
                          <div className="flex items-center gap-2 text-emerald-900 font-black text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Uang Tunai Sudah Diterima (Lunas ✓)</span>
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
                              <Banknote className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>
                                {order.cash_timing === 'upfront' 
                                  ? 'Pelanggan Bayar di Meja Kasir' 
                                  : 'Tagih Uang Tunai Saat Pesanan Siap'}
                              </span>
                            </span>
                            <span className="text-[10px] bg-amber-200 text-amber-950 px-1.5 py-0.5 rounded font-black">
                              Belum Bayar
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
                              <span>Terima Uang Tunai ({formatRupiah(order.total_price)} - Lunas ✓)</span>
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
                      {/* Opsi Panggilan WhatsApp: Pesanan Siap Diambil / Sedang Diantar (Opsional) */}
                      {order.customer_phone && (() => {
                        const isDeliveryOrder = order.delivery_type === 'delivery' || 
                          (order.notes && order.notes.includes('🛵 Diantar'));

                        return (
                          <div>
                            {order.is_wa_notified ? (
                              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-500 flex items-center justify-between shadow-tactile-sm">
                                <span className="text-[11px] font-black text-emerald-900 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>
                                    {isDeliveryOrder ? 'Sudah Dikabari (Sedang Diantar) ✓' : 'Sudah Dipanggil via WA ✓'}
                                  </span>
                                </span>
                                <button
                                  type="button"
                                  disabled={sendingWaId === order.id}
                                  onClick={() => handleSendPickupWa(order)}
                                  className="text-[10px] font-black text-emerald-700 hover:text-emerald-950 underline flex items-center gap-1 disabled:opacity-50"
                                  title={isDeliveryOrder ? "Kirim ulang kabar pengantaran ke pembeli" : "Kirim ulang chat panggil jika pembeli belum datang ke meja stand"}
                                >
                                  <RefreshCw className={`w-3 h-3 ${sendingWaId === order.id ? 'animate-spin' : ''}`} />
                                  <span>{isDeliveryOrder ? 'Kabari Lagi' : 'Panggil Lagi'}</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={sendingWaId === order.id}
                                onClick={() => handleSendPickupWa(order)}
                                className={`w-full py-2 px-3 rounded-xl active:translate-y-0.5 text-white font-black text-xs flex items-center justify-center gap-2 border-2 border-espresso shadow-tactile transition-all disabled:opacity-50 ${
                                  isDeliveryOrder
                                    ? 'bg-amber-600 hover:bg-amber-500'
                                    : 'bg-emerald-600 hover:bg-emerald-500'
                                }`}
                                title={isDeliveryOrder 
                                  ? "Kirim pesan WhatsApp: pesanan selesai & sedang diantar ke kelas!" 
                                  : "Kirim pesan WhatsApp: pesanan sudah siap diambil di stand!"}
                              >
                                {sendingWaId === order.id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                                ) : isDeliveryOrder ? (
                                  <span className="text-sm">🛵</span>
                                ) : (
                                  <MessageCircle className="w-3.5 h-3.5 text-white" />
                                )}
                                <span>
                                  {isDeliveryOrder 
                                    ? '🛵 Pesanan Sedang Diantar (Chat WA)' 
                                    : '📢 Pesanan Siap Diambil (Chat WA)'}
                                </span>
                              </button>
                            )}
                          </div>
                        );
                      })()}

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

                        {isCooking && (
                          <span className="px-2.5 py-2 text-[11px] font-black bg-amber-100 text-amber-950 rounded-xl border border-amber-400 flex items-center gap-1 animate-pulse shadow-tactile-sm">
                            <Utensils className="w-3.5 h-3.5 text-amber-700" />
                            <span>Dimasak Chef 👨‍🍳</span>
                          </span>
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

                        {/* Tombol Tolak / Pesanan Fiktif */}
                        <button
                          onClick={() => setConfirmCancelId(order.id)}
                          className="px-2.5 py-2.5 rounded-xl bg-rose-100 text-rose-800 hover:bg-rose-200 border-2 border-rose-400 text-xs font-black shadow-tactile-sm flex items-center gap-1 shrink-0"
                          title="Tolak pesanan fiktif & otomatis kembalikan stok menu ke etalase"
                        >
                          <Ban className="w-4 h-4 text-rose-700" />
                          <span className="hidden sm:inline">Tolak / Fiktif</span>
                        </button>
                      </div>

                      {/* Modal Konfirmasi Pembatalan / Tolak Pesanan Fiktif Inline */}
                      {confirmCancelId === order.id && (
                        <div className="p-3 bg-rose-50 border-2 border-rose-500 rounded-xl text-xs space-y-2.5 animate-in fade-in zoom-in-95 mt-2">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-black text-rose-900 leading-tight">
                                Tolak pesanan #{order.order_number} ({order.customer_name})?
                              </p>
                              <p className="text-[11px] font-bold text-rose-700/90 mt-0.5">
                                Pesanan fiktif/iseng akan dibatalkan, langsung hilang dari antrean aktif, dan stok seluruh menu otomatis dikembalikan ke etalase.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleCancelOrder(order)}
                              className="px-3 py-2 rounded-xl bg-rose-700 text-cream font-black text-xs border-2 border-espresso shadow-tactile-sm hover:bg-rose-800 flex items-center gap-1.5"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Ya, Tolak Pesanan Fiktif</span>
                            </button>
                            <button
                              onClick={() => setConfirmCancelId(null)}
                              className="px-3 py-2 rounded-xl bg-cream text-espresso font-black text-xs border-2 border-espresso hover:bg-cream-100 shadow-tactile-sm"
                            >
                              Batal
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

                      {order.customer_phone && (
                        <button
                          type="button"
                          disabled={sendingWaId === order.id}
                          onClick={() => handleSendCompletedWaManual(order)}
                          className="w-full py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-500 text-emerald-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                          title="Kirim / ulangi notifikasi WA ucapan selamat menikmati ke pembeli"
                        >
                          {sendingWaId === order.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                          ) : (
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                          )}
                          <span>Kirim / Ulangi WA "Selamat Menikmati"</span>
                        </button>
                      )}
                      
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
