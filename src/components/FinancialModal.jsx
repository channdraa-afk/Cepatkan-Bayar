import React, { useState } from 'react';
import { 
  X, TrendingUp, Plus, Trash2, Receipt, 
  Sparkles, CheckCircle2, AlertCircle, 
  Wallet, Calculator, Copy, Check
} from 'lucide-react';
import { formatRupiah } from './MenuCard';
import { sound } from '../lib/audio';

const EXPENSE_CATEGORIES = [
  'Bahan Baku',
  'Minuman & Es',
  'Kemasan & Wadah',
  'Operasional & Gas',
  'Lain-lain'
];

const PRESETS = [
  { title: 'Es Batu Kristal (2 Bal)', category: 'Minuman & Es', amount: 16000 },
  { title: 'Cup Minuman 16oz + Sedotan (1 Slop)', category: 'Kemasan & Wadah', amount: 30000 },
  { title: 'Kantong Plastik Kresek Stand', category: 'Kemasan & Wadah', amount: 10000 },
  { title: 'Gas LPG 3kg', category: 'Operasional & Gas', amount: 23000 }
];

export default function FinancialModal({
  isOpen,
  onClose,
  expenses = [],
  orders = [],
  onCreateExpense,
  onDeleteExpense,
  onClearAllExpenses
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Bahan Baku');
  const [amountRaw, setAmountRaw] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('Semua');
  const [confirmClear, setConfirmClear] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  if (!isOpen) return null;

  // Rekapitulasi Keuangan
  const completedOrders = orders.filter(o => o.status === 'completed');
  const totalOmzet = completedOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
  const totalTunai = completedOrders
    .filter(o => o.payment_method === 'Tunai')
    .reduce((sum, o) => sum + (o.total_price || 0), 0);
  const totalQris = completedOrders
    .filter(o => o.payment_method === 'QRIS')
    .reduce((sum, o) => sum + (o.total_price || 0), 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalOmzet - totalExpenses;
  const isBEP = totalExpenses > 0 ? totalOmzet >= totalExpenses : totalOmzet > 0;
  const bepProgress = totalExpenses > 0 
    ? Math.min(100, Math.round((totalOmzet / totalExpenses) * 100)) 
    : (totalOmzet > 0 ? 100 : 0);

  // Format input nominal dengan titik ribuan
  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setAmountRaw(raw);
  };

  const getFormattedInputAmount = () => {
    if (!amountRaw) return '';
    return new Intl.NumberFormat('id-ID').format(amountRaw);
  };

  const handleAddPreset = (preset) => {
    sound.playAdd();
    setTitle(preset.title);
    setCategory(preset.category);
    setAmountRaw(preset.amount.toString());
  };

  const handleAddChipAmount = (addValue) => {
    sound.playClick();
    const current = parseInt(amountRaw, 10) || 0;
    setAmountRaw((current + addValue).toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nominal = parseInt(amountRaw, 10);
    if (!title.trim()) {
      alert('Silakan tulis keterangan pengeluaran / modal.');
      return;
    }
    if (!nominal || nominal <= 0) {
      alert('Silakan masukkan nominal pengeluaran yang valid.');
      return;
    }

    sound.playAdd();
    await onCreateExpense({
      title: title.trim(),
      category,
      amount: nominal,
      notes: notes.trim()
    });

    // Reset form
    setTitle('');
    setAmountRaw('');
    setNotes('');
  };

  const handleDelete = async (id) => {
    sound.playRemove();
    await onDeleteExpense(id);
  };

  const handleResetAll = async () => {
    sound.playRemove();
    await onClearAllExpenses();
    setConfirmClear(false);
  };

  // Salin ringkasan ke clipboard untuk laporan WhatsApp kelompok
  const handleCopySummary = () => {
    sound.playClick();
    const text = `📊 *LAPORAN KEUANGAN STAND BAZAR*\n` +
      `📅 Tanggal: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n` +
      `--------------------------------\n` +
      `💰 *Total Modal (Pengeluaran)*: ${formatRupiah(totalExpenses)}\n` +
      `💵 *Total Omzet (Penjualan)*: ${formatRupiah(totalOmzet)}\n` +
      `   • Tunai (Cash): ${formatRupiah(totalTunai)}\n` +
      `   • QRIS Digital: ${formatRupiah(totalQris)}\n` +
      `--------------------------------\n` +
      `📈 *Laba Bersih*: ${netProfit >= 0 ? '+' : ''}${formatRupiah(netProfit)}\n` +
      `🎯 *Status BEP (Balik Modal)*: ${isBEP ? '✅ SUDAH BALIK MODAL (Untung Bersih)' : `⚡ Belum (Kurang ${formatRupiah(Math.abs(netProfit))})`}\n` +
      `--------------------------------\n` +
      `Dikelola via CepatkanBayar`;

    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 3000);
  };

  // Filter daftar pengeluaran
  const filteredExpenses = selectedFilterCategory === 'Semua'
    ? expenses
    : expenses.filter(e => e.category === selectedFilterCategory);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-espresso/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-cream border-2 border-espresso rounded-3xl shadow-tactile-lg overflow-hidden my-6">
        
        {/* Header Vintage */}
        <div className="p-4 sm:p-5 border-b-2 border-espresso bg-cream-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-caramel border-2 border-espresso flex items-center justify-center shadow-tactile-sm">
              <Calculator className="w-5 h-5 text-cream" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-espresso">Buku Kas & Modal Stand</h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sage border border-espresso text-espresso">
                  Monitoring Keuangan
                </span>
              </div>
              <p className="text-xs font-bold text-espresso/70">
                Catat modal bahan, pantau omzet penjualan, dan hitung laba bersih otomatis.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-cream border border-espresso flex items-center justify-center hover:bg-cream-200 active:translate-y-0.5 text-espresso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-5 max-h-[78vh] overflow-y-auto">
          
          {/* 3 KARTU KPI KEUANGAN (MODAL, OMZET, LABA BERSIH) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total Modal */}
            <div className="p-3.5 bg-rose-50 border-2 border-rose-600 rounded-2xl shadow-tactile-sm">
              <div className="flex items-center justify-between text-rose-800 mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider">Total Modal</span>
                <Wallet className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-xl font-black text-rose-900">
                {formatRupiah(totalExpenses)}
              </div>
              <p className="text-[11px] font-bold text-rose-700/80 mt-0.5">
                {expenses.length} pos belanja modal
              </p>
            </div>

            {/* Total Omzet */}
            <div className="p-3.5 bg-cream-50 border-2 border-espresso rounded-2xl shadow-tactile-sm">
              <div className="flex items-center justify-between text-espresso mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider">Total Omzet</span>
                <TrendingUp className="w-4 h-4 text-caramel" />
              </div>
              <div className="text-xl font-black text-caramel">
                {formatRupiah(totalOmzet)}
              </div>
              <p className="text-[11px] font-bold text-espresso/60 mt-0.5">
                {completedOrders.length} pesanan berhasil
              </p>
            </div>

            {/* Laba Bersih & BEP */}
            <div className={`p-3.5 border-2 border-espresso rounded-2xl shadow-tactile-sm transition-all ${
              isBEP ? 'bg-sage-100 text-espresso' : 'bg-amber-50 text-amber-900'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider">Laba Bersih</span>
                {isBEP ? (
                  <CheckCircle2 className="w-4 h-4 text-sage-800" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                )}
              </div>
              <div className={`text-xl font-black ${netProfit >= 0 ? 'text-sage-800' : 'text-rose-700'}`}>
                {netProfit >= 0 ? `+${formatRupiah(netProfit)}` : `-${formatRupiah(Math.abs(netProfit))}`}
              </div>
              <p className="text-[10px] font-extrabold mt-0.5 leading-tight">
                {isBEP ? (
                  <span className="text-sage-800 font-black">🎉 SUDAH BALIK MODAL!</span>
                ) : (
                  <span className="text-amber-800">⚡ Kurang {formatRupiah(Math.abs(netProfit))} menuju BEP</span>
                )}
              </p>
            </div>
          </div>

          {/* Progress Bar BEP (Break-Even Point) */}
          <div className="p-3.5 bg-cream-100 border-2 border-espresso rounded-2xl shadow-tactile-sm">
            <div className="flex items-center justify-between text-xs font-black text-espresso mb-1.5">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-caramel" />
                Target Balik Modal (BEP)
              </span>
              <span>{bepProgress}% Tercapai</span>
            </div>
            <div className="w-full bg-cream-200 border border-espresso rounded-full h-3 overflow-hidden p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isBEP ? 'bg-sage-700' : 'bg-caramel'
                }`}
                style={{ width: `${Math.min(100, bepProgress)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-espresso/60 mt-1">
              <span>Modal: {formatRupiah(totalExpenses)}</span>
              <span>Omzet: {formatRupiah(totalOmzet)}</span>
            </div>
          </div>

          {/* FORM TAMBAH PENGELUARAN / MODAL */}
          <div className="card-tactile bg-cream-50 p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-xs sm:text-sm text-espresso uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-caramel" /> + Catat Modal / Pengeluaran Baru
              </h3>
            </div>

            {/* Preset Cepat */}
            <div>
              <span className="text-[10px] font-black uppercase text-espresso/60 block mb-1">Preset Cepat:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddPreset(p)}
                    className="px-2.5 py-1 rounded-lg bg-cream border border-espresso text-[11px] font-extrabold text-espresso hover:bg-cream-200 active:translate-y-0.5 transition-all shadow-tactile-sm"
                  >
                    + {p.title}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Keterangan */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black text-espresso uppercase mb-1">
                    Keterangan Belanja <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Es batu kristal 2 bal / Cup 16oz"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-espresso bg-white text-espresso font-bold text-xs shadow-tactile-sm placeholder:text-espresso/40 focus:outline-none focus:ring-2 focus:ring-caramel"
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="block text-[11px] font-black text-espresso uppercase mb-1">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-espresso bg-white text-espresso font-black text-xs shadow-tactile-sm focus:outline-none focus:ring-2 focus:ring-caramel"
                  >
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Nominal Biaya */}
              <div>
                <label className="block text-[11px] font-black text-espresso uppercase mb-1">
                  Nominal Pengeluaran (Rp) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-espresso/60">
                    Rp
                  </span>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    placeholder="Contoh: 25.000"
                    value={getFormattedInputAmount()}
                    onChange={handleAmountChange}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-espresso bg-white text-espresso font-black text-sm shadow-tactile-sm placeholder:text-espresso/40 focus:outline-none focus:ring-2 focus:ring-caramel"
                  />
                </div>

                {/* Chip Tambah Nominal Cepat */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] font-bold text-espresso/60">Tambah cepat:</span>
                  {[5000, 10000, 20000, 50000, 100000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleAddChipAmount(val)}
                      className="px-2 py-0.5 rounded-md bg-cream-200 border border-espresso text-[10px] font-extrabold text-espresso hover:bg-cream-300"
                    >
                      +{new Intl.NumberFormat('id-ID').format(val)}
                    </button>
                  ))}
                  {amountRaw && (
                    <button
                      type="button"
                      onClick={() => setAmountRaw('')}
                      className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[10px] font-black hover:bg-rose-200"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="submit"
                  className="btn-tactile-primary px-4 py-2.5 text-xs font-black flex items-center gap-1.5 w-full sm:w-auto justify-center"
                >
                  <Receipt className="w-4 h-4" />
                  <span>+ Simpan Pengeluaran</span>
                </button>
              </div>
            </form>
          </div>

          {/* DAFTAR CATATAN PENGELUARAN */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-espresso pb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-xs sm:text-sm text-espresso uppercase tracking-wider">
                  Riwayat Pengeluaran ({filteredExpenses.length})
                </h3>
              </div>

              {/* Filter Kategori */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
                {['Semua', ...EXPENSE_CATEGORIES].map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      sound.playClick();
                      setSelectedFilterCategory(cat);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black border border-espresso transition-all whitespace-nowrap ${
                      selectedFilterCategory === cat
                        ? 'bg-caramel text-cream shadow-tactile-sm'
                        : 'bg-cream text-espresso hover:bg-cream-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="text-center py-8 px-4 bg-cream-50 border-2 border-dashed border-espresso/30 rounded-2xl">
                <Receipt className="w-8 h-8 text-espresso/30 mx-auto mb-1.5" />
                <p className="font-extrabold text-xs text-espresso">Belum ada pos modal / pengeluaran dicatat</p>
                <p className="text-[11px] text-espresso/60 font-bold">
                  Masukkan belanja bahan baku, cup, atau es batu untuk menghitung laba bersih stand bazar.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredExpenses.map((item) => (
                  <div 
                    key={item.id}
                    className="p-3 bg-cream-50 border-2 border-espresso rounded-xl shadow-tactile-sm flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="px-2 py-0.5 rounded-md bg-cream-200 border border-espresso text-[10px] font-black text-espresso">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-bold text-espresso/40">
                          {new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-espresso truncate">{item.title}</h4>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-black text-rose-700">
                        -{formatRupiah(item.amount)}
                      </span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="w-7 h-7 rounded-lg bg-rose-100 border border-rose-400 text-rose-700 flex items-center justify-center hover:bg-rose-200 active:translate-y-0.5"
                        title="Hapus pengeluaran ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Bar Bawah: Salin Laporan WA & Reset Semua Modal */}
          <div className="pt-3 border-t-2 border-espresso flex flex-col sm:flex-row items-center justify-between gap-2">
            <button
              onClick={handleCopySummary}
              className="btn-tactile-cream w-full sm:w-auto px-3.5 py-2 text-xs font-black flex items-center justify-center gap-1.5"
            >
              {copiedReport ? (
                <>
                  <Check className="w-3.5 h-3.5 text-sage-800" />
                  <span className="text-sage-800">Laporan Disalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Laporan WhatsApp</span>
                </>
              )}
            </button>

            {/* Tombol Bersihkan Semua Dinonaktifkan selama Bazar Live demi Keamanan Data */}
          </div>

        </div>

      </div>
    </div>
  );
}
