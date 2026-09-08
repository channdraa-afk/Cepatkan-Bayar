import React, { useState, useEffect } from 'react';
import { 
  X, Printer, Share2, Copy, Check, FileText, 
  TrendingUp, Banknote, QrCode, Award, 
  Search, Coffee, CheckCircle2, Download
} from 'lucide-react';
import { formatRupiah } from './MenuCard';
import { sound } from '../lib/audio';

export default function SalesReportModal({
  isOpen,
  onClose,
  orders = [],
  menus = [],
  expenses = []
}) {
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'Tunai' | 'QRIS'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedWa, setCopiedWa] = useState(false);

  // Lock body scroll saat modal aktif
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter seluruh transaksi yang telah 'completed'
  const completedOrders = orders.filter(o => o.status === 'completed');
  const tunaiOrders = completedOrders.filter(o => o.payment_method === 'Tunai');
  const qrisOrders = completedOrders.filter(o => o.payment_method === 'QRIS');

  const totalOmzet = completedOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
  const totalTunai = tunaiOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
  const totalQris = qrisOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalOmzet - totalExpenses;

  // Total porsi item terjual
  const totalPortions = completedOrders.reduce((sum, o) => {
    const p = (o.items || []).reduce((s, it) => s + (it.qty || it.quantity || 1), 0);
    return sum + p;
  }, 0);

  // Leaderboard Menu Terlaris
  const menuStatsMap = {};
  completedOrders.forEach(o => {
    (o.items || []).forEach(it => {
      const key = it.name || it.id;
      if (!menuStatsMap[key]) {
        menuStatsMap[key] = {
          name: it.name,
          quantity: 0,
          revenue: 0,
          price: it.price || 0
        };
      }
      const qty = it.qty || it.quantity || 1;
      menuStatsMap[key].quantity += qty;
      menuStatsMap[key].revenue += ((it.price || 0) * qty);
    });
  });
  const topMenus = Object.values(menuStatsMap).sort((a, b) => b.quantity - a.quantity);

  // Urutkan seluruh transaksi selesai dari nomor order terbawah (dimulai dari 1 / #001 ke atas)
  const sortedCompletedOrders = [...completedOrders].sort((a, b) => {
    const numA = parseInt((a.order_number || '').replace(/[^0-9]/g, ''), 10);
    const numB = parseInt((b.order_number || '').replace(/[^0-9]/g, ''), 10);
    if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
      return numA - numB; // Ascending: nomor 1, 2, 3...
    }
    return new Date(a.created_at || 0) - new Date(b.created_at || 0);
  });

  // Filter list transaksi yang ditampilkan (dari nomor 1 dst)
  const filteredOrders = sortedCompletedOrders.filter(o => {
    // Filter pembayaran
    if (paymentFilter === 'Tunai' && o.payment_method !== 'Tunai') return false;
    if (paymentFilter === 'QRIS' && o.payment_method !== 'QRIS') return false;

    // Filter pencarian
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (o.customer_name || '').toLowerCase().includes(q);
      const matchClass = (o.customer_class || '').toLowerCase().includes(q);
      const matchNumber = (o.order_number || '').toLowerCase().includes(q);
      const matchItems = (o.items || []).some(it => (it.name || '').toLowerCase().includes(q));
      return matchName || matchClass || matchNumber || matchItems;
    }
    return true;
  });

  const currentDateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const currentTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Generate Teks Laporan WhatsApp
  const generateWhatsAppReport = () => {
    let text = `*📊 LAPORAN REKAPITULASI PENJUALAN - LUNAR CAFE*\n`;
    text += `📅 *Tanggal:* ${currentDateStr}\n`;
    text += `⏰ *Waktu Rekap:* ${currentTimeStr} WIB\n`;
    text += `--------------------------------------------------\n`;
    text += `*💰 RINGKASAN OMZET PENJUALAN:*\n`;
    text += `• Total Transaksi Selesai : *${completedOrders.length} Pesanan*\n`;
    text += `• Total Porsi Terjual      : *${totalPortions} Porsi*\n`;
    text += `• Total Omzet Bersih       : *${formatRupiah(totalOmzet)}*\n`;
    text += `   - Pembayaran Tunai (Cash): ${formatRupiah(totalTunai)} (${tunaiOrders.length} transaksi)\n`;
    text += `   - Pembayaran QRIS Digital: ${formatRupiah(totalQris)} (${qrisOrders.length} transaksi)\n`;
    
    if (totalExpenses > 0) {
      text += `• Total Modal / Belanja    : ${formatRupiah(totalExpenses)}\n`;
      text += `• Estimasi Laba Bersih    : *${netProfit >= 0 ? '+' : ''}${formatRupiah(netProfit)}*\n`;
    }
    text += `--------------------------------------------------\n`;

    if (topMenus.length > 0) {
      text += `*🏆 MENU TERLARIS (TOP SALES):*\n`;
      topMenus.slice(0, 5).forEach((m, idx) => {
        text += `${idx + 1}. ${m.name}: *${m.quantity} porsi* (${formatRupiah(m.revenue)})\n`;
      });
      text += `--------------------------------------------------\n`;
    }

    text += `*📝 DAFTAR TRANSAKSI SELESAI (${filteredOrders.length} Pesanan):*\n`;
    if (filteredOrders.length === 0) {
      text += `_Tidak ada transaksi sesuai filter._\n`;
    } else {
      filteredOrders.forEach((o, idx) => {
        const orderTime = new Date(o.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const itemsSummary = (o.items || []).map(it => `${it.qty || it.quantity || 1}x ${it.name}`).join(', ');
        text += `${idx + 1}. *${o.order_number}* [${orderTime}] - *${o.customer_name}* (${o.customer_class || '-'})\n`;
        text += `   └ Item: ${itemsSummary}\n`;
        text += `   └ Bayar: *${o.payment_method}* | Total: *${formatRupiah(o.total_price)}*\n`;
      });
    }

    text += `--------------------------------------------------\n`;
    text += `_Dokumen laporan resmi otomatis digenerate oleh Sistem Kasir Lunar Cafe._`;
    return text;
  };

  // Salin ke Clipboard
  const handleCopyWa = () => {
    sound.playClick();
    const text = generateWhatsAppReport();
    navigator.clipboard.writeText(text);
    setCopiedWa(true);
    setTimeout(() => setCopiedWa(false), 3000);
  };

  // Buka WhatsApp
  const handleShareWa = () => {
    sound.playClick();
    const text = generateWhatsAppReport();
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Cetak / Simpan PDF
  const handlePrint = () => {
    sound.playClick();
    window.print();
  };

  // Unduh Cadangan Lengkap Format JSON (Offline Backup sebelum Supabase dimatikan)
  const handleExportJson = () => {
    sound.playAdd();
    const backupData = {
      app: 'Lunar Cafe',
      event: 'Bazar Stand Lunar Cafe',
      exported_at: new Date().toISOString(),
      summary: {
        total_omzet: totalOmzet,
        total_tunai: totalTunai,
        total_qris: totalQris,
        total_expenses: totalExpenses,
        net_profit: netProfit,
        total_completed_orders: completedOrders.length,
        total_portions: totalPortions
      },
      top_menus: topMenus,
      completed_orders: sortedCompletedOrders,
      all_orders: orders,
      expenses: expenses,
      menus: menus
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lunar_Cafe_Arsip_Penjualan_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-espresso/70 backdrop-blur-sm overflow-y-auto modal-overlay-report">
      
      {/* Modal Card Window */}
      <div className="relative w-full max-w-4xl bg-cream border-2 border-espresso rounded-3xl shadow-tactile-lg flex flex-col max-h-[92vh] overflow-hidden my-auto modal-window-report">
        
        {/* Header UI (Non-Print) */}
        <div className="p-4 sm:p-5 border-b-2 border-espresso bg-cream-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-caramel border-2 border-espresso flex items-center justify-center shadow-tactile-sm shrink-0">
              <FileText className="w-5 h-5 text-cream" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-espresso">Rekap Laporan Transaksi Selesai</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-600">
                  {completedOrders.length} Sukses
                </span>
              </div>
              <p className="text-xs font-bold text-espresso/70">
                Lunar Cafe • Siap Cetak PDF (A4) & Laporan WhatsApp
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 text-xs font-black bg-blue-600 hover:bg-blue-500 text-white border-2 border-espresso rounded-xl shadow-tactile-sm flex items-center gap-1.5 active:translate-y-0.5 transition-all"
              title="Cetak langsung ke printer atau Simpan sebagai PDF"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Cetak / PDF</span>
            </button>

            <button
              onClick={handleCopyWa}
              className="btn-tactile-cream px-3 py-2 text-xs font-bold flex items-center gap-1.5"
              title="Salin teks laporan untuk dikirim ke grup WhatsApp"
            >
              {copiedWa ? (
                <>
                  <Check className="w-4 h-4 text-emerald-700" />
                  <span className="text-emerald-700 font-black">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Salin WA</span>
                </>
              )}
            </button>

            <button
              onClick={handleShareWa}
              className="px-3 py-2 text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-espresso rounded-xl shadow-tactile-sm flex items-center gap-1.5 active:translate-y-0.5 transition-all"
              title="Buka WhatsApp & bagikan laporan ke grup"
            >
              <Share2 className="w-4 h-4" />
              <span>Buka WA</span>
            </button>

            <button
              onClick={handleExportJson}
              className="btn-tactile-sage px-3 py-2 text-xs font-black flex items-center gap-1.5"
              title="Unduh seluruh data penjualan, menu, dan pengeluaran ke file JSON sebelum Supabase dimatikan"
            >
              <Download className="w-4 h-4 text-espresso" />
              <span>Unduh Data JSON</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-9 h-9 rounded-xl bg-cream border-2 border-espresso flex items-center justify-center text-espresso hover:bg-cream-200 active:translate-y-0.5 transition-all ml-1"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Kontainer Khusus Cetak & Tampilan Pratinjau Dokumen */}
          <div className="printable-report-content bg-white p-4 sm:p-6 rounded-2xl border-2 border-espresso/30 sm:border-espresso shadow-sm space-y-6">
            
            {/* KOP RESMI LAPORAN */}
            <div className="border-b-2 border-espresso pb-4 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <div className="w-12 h-12 rounded-2xl bg-caramel border-2 border-espresso flex items-center justify-center text-cream font-black text-xl shadow-tactile-sm">
                  ☕
                </div>
                <div>
                  <h1 className="text-2xl font-black text-espresso tracking-tight">LUNAR CAFE</h1>
                  <p className="text-xs font-bold text-espresso/70 uppercase tracking-widest">
                    Stand Bazar Kuliner & Minuman
                  </p>
                </div>
              </div>

              <div className="text-center sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-espresso/20">
                <div className="inline-block px-3 py-1 bg-cream-100 border border-espresso rounded-lg text-xs font-black text-espresso mb-1">
                  LAPORAN REKAPITULASI PENJUALAN
                </div>
                <div className="text-xs text-espresso/80 font-bold space-y-0.5">
                  <div>📅 {currentDateStr}</div>
                  <div>⏰ Pukul {currentTimeStr} WIB</div>
                </div>
              </div>
            </div>

            {/* RINGKASAN FINANSIAL (SUMMARY CARDS) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Total Omzet */}
              <div className="p-3 bg-cream-50 border-2 border-espresso rounded-xl print-border">
                <div className="text-[10px] font-black text-espresso/70 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Total Omzet</span>
                  <TrendingUp className="w-3.5 h-3.5 text-caramel no-print" />
                </div>
                <div className="text-lg sm:text-xl font-black text-caramel">
                  {formatRupiah(totalOmzet)}
                </div>
                <div className="text-[10px] font-bold text-espresso/60 mt-0.5">
                  {completedOrders.length} transaksi selesai
                </div>
              </div>

              {/* Pembayaran Tunai */}
              <div className="p-3 bg-amber-50/70 border-2 border-espresso rounded-xl print-border">
                <div className="text-[10px] font-black text-amber-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Tunai (Cash)</span>
                  <Banknote className="w-3.5 h-3.5 text-amber-700 no-print" />
                </div>
                <div className="text-lg sm:text-xl font-black text-amber-900">
                  {formatRupiah(totalTunai)}
                </div>
                <div className="text-[10px] font-bold text-amber-800/80 mt-0.5">
                  {tunaiOrders.length} transaksi tunai
                </div>
              </div>

              {/* Pembayaran QRIS */}
              <div className="p-3 bg-blue-50/70 border-2 border-espresso rounded-xl print-border">
                <div className="text-[10px] font-black text-blue-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>QRIS Digital</span>
                  <QrCode className="w-3.5 h-3.5 text-blue-700 no-print" />
                </div>
                <div className="text-lg sm:text-xl font-black text-blue-900">
                  {formatRupiah(totalQris)}
                </div>
                <div className="text-[10px] font-bold text-blue-800/80 mt-0.5">
                  {qrisOrders.length} transaksi QRIS
                </div>
              </div>

              {/* Total Porsi & Laba Bersih */}
              <div className="p-3 bg-emerald-50/70 border-2 border-espresso rounded-xl print-border">
                <div className="text-[10px] font-black text-emerald-900 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Porsi Terjual</span>
                  <Coffee className="w-3.5 h-3.5 text-emerald-700 no-print" />
                </div>
                <div className="text-lg sm:text-xl font-black text-emerald-900">
                  {totalPortions} Porsi
                </div>
                <div className="text-[10px] font-bold text-emerald-800/80 mt-0.5">
                  {totalExpenses > 0 ? `Laba: ${netProfit >= 0 ? '+' : ''}${formatRupiah(netProfit)}` : 'Dari semua pesanan'}
                </div>
              </div>
            </div>

            {/* LEADERBOARD MENU TERLARIS */}
            {topMenus.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 border-b border-espresso/20 pb-1.5">
                  <Award className="w-4 h-4 text-caramel" />
                  <h3 className="text-xs sm:text-sm font-black text-espresso uppercase tracking-wider">
                    Menu Terlaris (Leaderboard Penjualan)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {topMenus.slice(0, 3).map((item, idx) => (
                    <div 
                      key={idx}
                      className="p-2.5 bg-cream-50 border border-espresso rounded-xl flex items-center justify-between gap-2 print-border"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                          idx === 0 ? 'bg-amber-400 text-espresso' :
                          idx === 1 ? 'bg-slate-300 text-espresso' :
                          'bg-amber-700 text-cream'
                        }`}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-espresso truncate">{item.name}</p>
                          <p className="text-[10px] font-bold text-espresso/60">{item.quantity} porsi terjual</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-caramel">
                          {formatRupiah(item.revenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FILTER & PENCARIAN DIALOG (HANYA MUNCUL DI LAYAR, TERSEMBUNYI SAAT CETAK) */}
            <div className="no-print pt-2 border-t border-espresso/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-xs font-black text-espresso/70 shrink-0">Filter Bayar:</span>
                <div className="flex items-center gap-1">
                  {[
                    { id: 'all', label: `Semua (${completedOrders.length})` },
                    { id: 'Tunai', label: `Tunai (${tunaiOrders.length})` },
                    { id: 'QRIS', label: `QRIS (${qrisOrders.length})` }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        sound.playClick();
                        setPaymentFilter(tab.id);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-black border transition-all ${
                        paymentFilter === tab.id
                          ? 'bg-espresso text-cream border-espresso shadow-tactile-sm'
                          : 'bg-cream text-espresso border-espresso/40 hover:bg-cream-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-espresso/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, kelas, #order..."
                  className="w-full pl-8 pr-3 py-1.5 bg-cream text-xs font-bold text-espresso border border-espresso rounded-xl focus:outline-none focus:ring-2 focus:ring-caramel"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-espresso/40 hover:text-espresso"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* TABEL RINCIAN SELURUH TRANSAKSI SELESAI */}
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-xs sm:text-sm font-black text-espresso uppercase tracking-wider">
                  Rincian Transaksi Selesai ({filteredOrders.length} Data)
                </h3>
                {searchQuery && (
                  <span className="text-[11px] font-bold text-espresso/60 no-print">
                    Menampilkan hasil cari "{searchQuery}"
                  </span>
                )}
              </div>

              {filteredOrders.length === 0 ? (
                <div className="text-center py-10 px-4 bg-cream-50 border-2 border-dashed border-espresso/30 rounded-xl">
                  <CheckCircle2 className="w-8 h-8 text-espresso/30 mx-auto mb-1.5" />
                  <p className="text-xs font-black text-espresso">Tidak ada transaksi yang cocok</p>
                  <p className="text-[11px] font-bold text-espresso/60">
                    {searchQuery ? 'Coba ubah kata kunci pencarian kamu.' : 'Belum ada pesanan dengan status selesai.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto border-2 border-espresso rounded-xl print-border">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-cream-200/90 text-espresso font-black border-b-2 border-espresso">
                        <th className="py-2.5 px-3 w-10 text-center">No</th>
                        <th className="py-2.5 px-3 w-20">No. Order</th>
                        <th className="py-2.5 px-3 w-20">Waktu</th>
                        <th className="py-2.5 px-3">Pelanggan & Kelas</th>
                        <th className="py-2.5 px-3">Menu Dipesan</th>
                        <th className="py-2.5 px-3 w-24 text-center">Metode</th>
                        <th className="py-2.5 px-3 w-28 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-espresso/20 font-bold text-espresso">
                      {filteredOrders.map((order, idx) => {
                        const orderTime = new Date(order.created_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        const isEven = idx % 2 === 0;

                        return (
                          <tr 
                            key={order.id} 
                            className={`hover:bg-cream-100/50 transition-colors ${
                              isEven ? 'bg-white' : 'bg-cream-50/60'
                            }`}
                          >
                            <td className="py-2 px-3 text-center text-espresso/60 font-mono">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 font-mono font-black text-caramel">
                              {order.order_number}
                            </td>
                            <td className="py-2 px-3 text-espresso/70 text-[11px]">
                              {orderTime}
                            </td>
                            <td className="py-2 px-3">
                              <div className="font-extrabold text-espresso">{order.customer_name}</div>
                              <div className="text-[10px] text-espresso/60">
                                {order.customer_class || 'Meja / Stand'}
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <div className="space-y-0.5">
                                {(order.items || []).map((it, itIdx) => (
                                  <div key={itIdx} className="text-[11px] leading-tight">
                                    <span className="font-black text-espresso/80">
                                      {it.qty || it.quantity || 1}×
                                    </span>{' '}
                                    <span>{it.name}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black border ${
                                order.payment_method === 'Tunai'
                                  ? 'bg-amber-100 text-amber-900 border-amber-500'
                                  : 'bg-blue-100 text-blue-900 border-blue-500'
                              }`}>
                                {order.payment_method}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-black text-espresso">
                              {formatRupiah(order.total_price)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-cream-200/90 font-black text-espresso border-t-2 border-espresso">
                        <td colSpan={6} className="py-2.5 px-3 text-right uppercase tracking-wider text-[11px]">
                          Total Transaksi Selesai:
                        </td>
                        <td className="py-2.5 px-3 text-right text-sm text-caramel font-black">
                          {formatRupiah(
                            filteredOrders.reduce((sum, o) => sum + (o.total_price || 0), 0)
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Catatan Kaki Dokumen Resmi */}
            <div className="text-center pt-4 text-[10px] text-espresso/50 border-t border-espresso/20">
              Dicetak otomatis melalui Aplikasi Kasir Lunar Cafe • {currentDateStr} pukul {currentTimeStr} WIB
            </div>

          </div>

        </div>

        {/* Footer Bar Dialog (Non-Print) */}
        <div className="p-3 sm:p-4 border-t-2 border-espresso bg-cream-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 no-print">
          <div className="text-xs font-bold text-espresso/70 text-center sm:text-left">
            💡 <strong>Tips Laporan:</strong> Klik <strong>Cetak / PDF</strong> lalu pilih <em>"Save as PDF"</em> di browser kamu untuk menyimpan file PDF A4 resmi.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="btn-tactile-primary px-4 py-2 text-xs flex items-center justify-center gap-1.5 font-black w-full sm:w-auto"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF Sekarang</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
