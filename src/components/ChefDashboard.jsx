import React, { useState } from 'react';
import { 
  Utensils, CheckCircle2, Clock, Flame, 
  Sparkles, CheckSquare, Square, LogOut, RefreshCw, AlertCircle
} from 'lucide-react';
import { sound } from '../lib/audio';

export default function ChefDashboard({
  orders = [],
  onUpdateStatus,
  onUpdateChefDelivery,
  onExitChef
}) {
  const [activeTab, setActiveTab] = useState('cooking'); // 'cooking' | 'history'
  const [checkedItems, setCheckedItems] = useState({}); // { `${orderId}-${itemIdx}`: boolean }
  const [toastMsg, setToastMsg] = useState(null);
  const [completingId, setCompletingId] = useState(null);

  // Filter pesanan yang sedang diracik/dimasak (status 'cooking')
  const cookingOrders = orders
    .filter(o => o.status === 'cooking')
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // FIFO: yang masuk duluan dimasak duluan

  // Filter pesanan yang sudah selesai dimasak oleh chef ('ready' atau 'completed')
  const completedOrders = orders
    .filter(o => o.status === 'ready' || o.status === 'completed')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Hitung total porsi yang sedang antre masak
  const totalPortionsCooking = cookingOrders.reduce((total, order) => {
    return total + (order.items ? order.items.reduce((sum, item) => sum + (item.qty || 1), 0) : 0);
  }, 0);

  // Hitung total porsi yang sudah berhasil diselesaikan hari ini
  const totalPortionsCompleted = completedOrders.reduce((total, order) => {
    return total + (order.items ? order.items.reduce((sum, item) => sum + (item.qty || 1), 0) : 0);
  }, 0);

  // Toggle checklist item masak
  const handleToggleItem = (orderId, idx) => {
    sound.playClick();
    const key = `${orderId}-${idx}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Update Status Pengantaran oleh Chef (Bisa dilakukan kapan saja secara realtime)
  const handleUpdateDelivery = async (orderId, isDelivered, note) => {
    sound.playClick();
    try {
      if (onUpdateChefDelivery) {
        await onUpdateChefDelivery(orderId, isDelivered, note);
      }
      setToastMsg(isDelivered 
        ? '🛵 Laporan dikirim ke kasir: Pesanan ditandai SUDAH DIANTAR oleh Chef!' 
        : '🏠 Laporan dikirim ke kasir: Pesanan ditandai ADA DI MEJA STAND (Belum Diantar).');
    } catch {
      setToastMsg('Gagal mengirim update status.');
    } finally {
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  // Tombol Selesai Dibuat oleh Chef dengan Pilihan Antar
  const handleChefComplete = async (order, isDeliveredDirectly) => {
    sound.playComplete();
    setCompletingId(order.id);
    try {
      if (onUpdateChefDelivery) {
        await onUpdateChefDelivery(
          order.id, 
          isDeliveredDirectly, 
          order.chef_note || (isDeliveredDirectly ? 'Sudah diantar langsung oleh Chef' : '')
        );
      }
      if (onUpdateStatus) {
        await onUpdateStatus(order.id, 'ready');
      }
      setToastMsg(isDeliveredDirectly
        ? `🛵 Pesanan #${order.order_number} selesai & dilaporkan SUDAH DIANTAR ke kasir!`
        : `✅ Pesanan #${order.order_number} selesai dimasak & ada di MEJA STAND!`);
    } catch {
      setToastMsg('Gagal mengupdate status pesanan.');
    } finally {
      setCompletingId(null);
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  // Format durasi waktu berlalu
  const getTimeElapsed = (dateString) => {
    if (!dateString) return '';
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'Baru saja';
    if (diffMinutes === 1) return '1 menit lalu';
    return `${diffMinutes} menit lalu`;
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5">
      
      {/* Toast Notifikasi Realtime */}
      {toastMsg && (
        <div className="fixed top-16 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-md z-50 p-3.5 rounded-2xl bg-emerald-100 border-2 border-emerald-600 text-emerald-950 font-black text-xs shadow-tactile-lg flex items-center justify-between gap-2 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="truncate">{toastMsg}</span>
          </div>
          <button 
            onClick={() => setToastMsg(null)}
            className="w-6 h-6 rounded-lg bg-cream border border-espresso flex items-center justify-center text-espresso/70 hover:text-espresso shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Bar Dapur / Chef */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-caramel/10 border-2 border-espresso rounded-2xl p-4 shadow-tactile">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-caramel text-cream border border-espresso flex items-center gap-1 shadow-tactile-sm">
              <Utensils className="w-3.5 h-3.5" /> Mode Dapur / Chef Aktif
            </span>
            <span className="text-xs font-bold text-espresso/70 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Antrean</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-espresso">Kitchen Display System (Dapur)</h1>
          <p className="text-xs text-espresso/70 font-bold">
            Pesanan yang divalidasi kasir dan siap dimasak akan otomatis muncul di sini.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              sound.playClick();
              if (onExitChef) onExitChef();
            }}
            className="btn-tactile-cream px-3 py-2 text-xs font-black flex items-center gap-1.5"
            title="Keluar dari mode chef dan kembali ke katalog pelanggan"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Dapur</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="card-tactile bg-amber-100 p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-200 border-2 border-espresso flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-amber-900 animate-pulse" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black text-espresso/60 uppercase block">Sedang Dimasak</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-espresso">{cookingOrders.length}</span>
              <span className="text-xs font-bold text-espresso/70">pesanan</span>
            </div>
          </div>
        </div>

        <div className="card-tactile bg-cream-100 p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cream-200 border-2 border-espresso flex items-center justify-center shrink-0">
            <Utensils className="w-5 h-5 text-caramel" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black text-espresso/60 uppercase block">Total Porsi Diracik</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-caramel">{totalPortionsCooking}</span>
              <span className="text-xs font-bold text-espresso/70">porsi</span>
            </div>
          </div>
        </div>

        <div className="card-tactile bg-sage-100 p-3 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-sage border-2 border-espresso flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-900" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black text-espresso/60 uppercase block">Selesai Hari Ini</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-900">{totalPortionsCompleted}</span>
              <span className="text-xs font-bold text-espresso/70">porsi terlayani</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu Dapur */}
      <div className="flex items-center gap-2 border-b-2 border-espresso/20 pb-2">
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('cooking');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-black border-2 border-espresso transition-all flex items-center gap-1.5 ${
            activeTab === 'cooking'
              ? 'bg-caramel text-cream shadow-tactile'
              : 'bg-cream-50 text-espresso shadow-tactile-sm hover:bg-cream-100'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Antrean Dimasak ({cookingOrders.length})</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('history');
          }}
          className={`px-4 py-2 rounded-xl text-xs font-black border-2 border-espresso transition-all flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'bg-sage text-espresso shadow-tactile'
              : 'bg-cream-50 text-espresso shadow-tactile-sm hover:bg-cream-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Riwayat Selesai ({completedOrders.length})</span>
        </button>
      </div>

      {/* Main Order Cards Grid */}
      {activeTab === 'cooking' ? (
        cookingOrders.length === 0 ? (
          /* Empty State Dapur Bersih */
          <div className="text-center py-16 px-4 card-tactile bg-cream-50">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 border-2 border-espresso flex items-center justify-center mx-auto mb-3 shadow-tactile-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-700" />
            </div>
            <h3 className="text-lg font-black text-espresso mb-1">
              Dapur Bersih & Siap!
            </h3>
            <p className="text-xs text-espresso/70 font-bold max-w-sm mx-auto leading-relaxed">
              Belum ada pesanan yang perlu diracik saat ini. Begitu kasir mengklik tombol <strong>"Racik"</strong>, pesanan akan langsung muncul di sini secara otomatis disertai nada bel. 👨‍🍳✨
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cookingOrders.map((order) => {
              const isDelivery = order.delivery_type === 'delivery' || 
                (order.notes && order.notes.includes('🛵 Diantar'));
              
              const cleanNotes = (order.display_notes || order.notes || '')
                .replace(/\[\s*(🛵|🚶)?[^\]]*\]/g, '')
                .trim();

              return (
                <div
                  key={order.id}
                  className="card-tactile bg-cream-50 p-4 sm:p-5 flex flex-col justify-between border-2 border-caramel shadow-tactile-lg transition-all animate-in zoom-in-95"
                >
                  <div>
                    {/* Header Tiket Masak */}
                    <div className="flex items-start justify-between gap-2 pb-3 border-b-2 border-espresso/20">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-black text-caramel tracking-tight">
                            {order.order_number}
                          </span>
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black border border-espresso shadow-tactile-sm ${
                            isDelivery ? 'bg-caramel text-cream' : 'bg-sage text-espresso'
                          }`}>
                            {isDelivery ? '🛵 Diantar ke Kelas' : '🚶 Ambil di Stand'}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-espresso mt-1">
                          {order.customer_name}
                        </h3>
                        {order.customer_class && (
                          <p className="text-xs font-bold text-espresso/70">
                            Kelas: <strong className="text-espresso">{order.customer_class}</strong>
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-espresso/60 bg-cream-200 px-2 py-0.5 rounded-md border border-espresso/20">
                          <Clock className="w-3 h-3" />
                          <span>{getTimeElapsed(order.created_at)}</span>
                        </span>
                        <span className="block text-[10px] font-bold text-caramel mt-1 animate-pulse">
                          🔥 Sedang Dimasak
                        </span>
                      </div>
                    </div>

                    {/* Catatan Khusus dari Pembeli (Highlight Tebal) */}
                    {cleanNotes && (
                      <div className="my-3 p-2.5 bg-amber-100 border-2 border-caramel rounded-xl text-xs font-bold text-amber-950 flex items-start gap-2 shadow-tactile-sm">
                        <AlertCircle className="w-4 h-4 text-caramel shrink-0 mt-0.5" />
                        <div>
                          <span className="font-black text-caramel uppercase text-[10px] block">Catatan Khusus:</span>
                          <p className="text-sm font-extrabold">{cleanNotes}</p>
                        </div>
                      </div>
                    )}

                    {/* Checklist Rincian Menu Dapur */}
                    <div className="py-3 space-y-2">
                      <span className="text-[11px] font-black text-espresso/60 uppercase tracking-wider block">
                        Daftar Menu yang Harus Dibuat:
                      </span>
                      {order.items && order.items.map((item, idx) => {
                        const isChecked = Boolean(checkedItems[`${order.id}-${idx}`]);
                        return (
                          <div
                            key={idx}
                            onClick={() => handleToggleItem(order.id, idx)}
                            className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer select-none flex items-center justify-between gap-3 ${
                              isChecked
                                ? 'bg-sage-100 border-sage-600 text-espresso opacity-70 line-through'
                                : 'bg-cream-100 border-espresso text-espresso hover:bg-cream-200 shadow-tactile-sm'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {isChecked ? (
                                <CheckSquare className="w-5 h-5 text-emerald-700 shrink-0" />
                              ) : (
                                <Square className="w-5 h-5 text-espresso/40 shrink-0" />
                              )}
                              <span className="text-sm font-black truncate">
                                {item.name}
                              </span>
                            </div>

                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black border border-espresso shrink-0 ${
                              isChecked ? 'bg-cream text-espresso/50' : 'bg-caramel text-cream'
                            }`}>
                              {item.qty} Porsi
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Laporan Status Pengantaran Chef ke Kasir */}
                    <div className="my-2.5 p-3 rounded-2xl border-2 border-espresso bg-cream-100/90 shadow-tactile-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-espresso flex items-center gap-1.5">
                          <span>🛵</span>
                          <span>Laporan Pengantaran ke Kasir:</span>
                        </span>
                        {order.is_chef_delivered ? (
                          <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-md border border-espresso shadow-tactile-sm animate-pulse">
                            Sudah Diantar ✓
                          </span>
                        ) : (
                          <span className="text-[10px] font-black bg-amber-200 text-amber-950 px-2 py-0.5 rounded-md border border-espresso">
                            Belum Diantar (Di Meja Stand)
                          </span>
                        )}
                      </div>

                      {/* Tombol Opsi Status Antar */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateDelivery(order.id, false, order.chef_note || '')}
                          className={`py-2 px-2.5 rounded-xl text-xs font-black border-2 transition-all flex items-center justify-center gap-1.5 ${
                            !order.is_chef_delivered
                              ? 'bg-amber-300 text-amber-950 border-espresso shadow-tactile-sm'
                              : 'bg-cream text-espresso/60 border-espresso/30 hover:bg-cream-200'
                          }`}
                        >
                          <span>🏠 Di Meja Stand</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateDelivery(order.id, true, order.chef_note || 'Sudah diantar langsung oleh Chef')}
                          className={`py-2 px-2.5 rounded-xl text-xs font-black border-2 transition-all flex items-center justify-center gap-1.5 ${
                            order.is_chef_delivered
                              ? 'bg-emerald-600 text-white border-espresso shadow-tactile-sm'
                              : 'bg-cream text-espresso/60 border-espresso/30 hover:bg-cream-200'
                          }`}
                        >
                          <span>🛵 Sudah Diantar</span>
                        </button>
                      </div>

                      {/* Input Catatan Bebas Chef */}
                      <div className="pt-0.5">
                        <input
                          type="text"
                          placeholder="Tulis catatan (misal: 'Sudah diantar ke RPL 2' / 'Diambil Dani')..."
                          defaultValue={order.chef_note || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (order.chef_note || '')) {
                              handleUpdateDelivery(order.id, order.is_chef_delivered, e.target.value);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.target.blur();
                          }}
                          className="w-full px-3 py-1.5 rounded-lg border-2 border-espresso bg-cream text-espresso font-bold text-xs focus:outline-none focus:ring-1 focus:ring-caramel placeholder:text-espresso/40 shadow-tactile-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tombol Aksi Utama Chef (2 Opsi: Taruh di Meja Stand vs Sudah Diantar) */}
                  <div className="pt-3 border-t-2 border-espresso mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={completingId === order.id}
                      onClick={() => handleChefComplete(order, false)}
                      className="py-3 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-espresso shadow-tactile hover:brightness-105 active:translate-y-0.5 transition-all disabled:opacity-50"
                      title="Selesai masak dan taruh di meja stand (belum diantar)"
                    >
                      {completingId === order.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>🍲 Selesai (Di Meja Stand)</span>
                    </button>

                    <button
                      type="button"
                      disabled={completingId === order.id}
                      onClick={() => handleChefComplete(order, true)}
                      className="py-3 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 bg-caramel hover:brightness-110 text-cream border-2 border-espresso shadow-tactile hover:brightness-105 active:translate-y-0.5 transition-all disabled:opacity-50"
                      title="Selesai masak dan pesanan sudah diantar langsung ke pembeli"
                    >
                      {completingId === order.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>🛵</span>
                      )}
                      <span>Selesai & SUDAH Diantar ✓</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Tab Riwayat Pesanan Selesai Hari Ini */
        completedOrders.length === 0 ? (
          <div className="text-center py-12 px-4 card-tactile bg-cream-50">
            <p className="text-sm font-black text-espresso mb-1">Belum ada pesanan yang selesai</p>
            <p className="text-xs text-espresso/60 font-bold">Semua pesanan yang selesai dimasak akan tercatat di sini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {completedOrders.map((order) => (
              <div
                key={order.id}
                className="card-tactile bg-cream-100/90 p-3.5 border-2 border-espresso flex flex-col justify-between gap-2 shadow-tactile-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-caramel">
                        {order.order_number}
                      </span>
                      <span className="text-xs font-black text-espresso">
                        {order.customer_name}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                        order.is_chef_delivered
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-500'
                          : 'bg-amber-100 text-amber-950 border-amber-500'
                      }`}>
                        {order.is_chef_delivered ? '🛵 Sudah Diantar' : '🏠 Di Meja Stand'}
                      </span>
                    </div>
                    <p className="text-xs text-espresso/70 font-bold truncate mt-0.5">
                      {order.items && order.items.map(i => `${i.qty}× ${i.name}`).join(', ')}
                    </p>
                    {order.chef_note && (
                      <p className="text-[11px] font-extrabold text-sky-800 mt-1">
                        📝 Catatan Chef: "{order.chef_note}"
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-900 bg-emerald-100 border border-emerald-500 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Selesai
                    </span>
                  </div>
                </div>

                {/* Tombol Cepat Ubah Status Antar di Riwayat */}
                <div className="pt-2 border-t border-espresso/20 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-espresso/60">Ubah laporan antar:</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateDelivery(order.id, !order.is_chef_delivered, order.chef_note || '')}
                    className="text-[11px] font-black text-caramel hover:underline"
                  >
                    {order.is_chef_delivered ? 'Ubah jadi 🏠 Di Meja Stand' : 'Tandai jadi 🛵 Sudah Diantar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

    </div>
  );
}
