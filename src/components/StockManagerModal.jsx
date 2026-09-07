import React, { useState } from 'react';
import { X, Package, CheckCircle } from 'lucide-react';
import { formatRupiah } from './MenuCard';
import { sound } from '../lib/audio';

export default function StockManagerModal({
  isOpen,
  onClose,
  menus,
  onUpdateStock,
  onQuickAddStock
}) {
  const [editingId, setEditingId] = useState(null);
  const [customValue, setCustomValue] = useState('');

  if (!isOpen) return null;

  const handleQuickAdd = async (id, amount) => {
    sound.playAdd();
    await onQuickAddStock(id, amount);
  };

  const handleSetZero = async (id) => {
    sound.playRemove();
    await onUpdateStock(id, 0);
  };

  const handleSaveCustom = async (id) => {
    const val = parseInt(customValue);
    if (!isNaN(val) && val >= 0) {
      sound.playComplete();
      await onUpdateStock(id, val);
    }
    setEditingId(null);
    setCustomValue('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-espresso/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-cream border-2 border-espresso rounded-2xl shadow-tactile-lg flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b-2 border-espresso bg-cream-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sage border-2 border-espresso flex items-center justify-center text-espresso shadow-tactile-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-espresso">Kelola Stok Stand Bazar</h2>
              <p className="text-xs text-espresso/70 font-bold">Pantau & tambah stok dadakan dalam 1-klik</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-cream border border-espresso flex items-center justify-center text-espresso hover:bg-cream-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Menu Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {menus.map((item) => {
            const isZero = item.stock <= 0;
            const isLow = item.stock > 0 && item.stock <= 5;

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border-2 border-espresso shadow-tactile-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  isZero ? 'bg-rose-50/70 border-rose-800' : 'bg-cream-50'
                }`}
              >
                {/* Info Menu */}
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=400&q=80';
                    }}
                    className="w-12 h-12 rounded-lg object-cover border border-espresso shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-espresso truncate">{item.name}</h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cream-200 border border-espresso text-espresso">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-caramel">
                      {formatRupiah(item.price)}
                    </p>
                  </div>
                </div>

                {/* Stock Controls */}
                <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                  
                  {/* Stock Display Badge */}
                  <div className="text-center px-3 py-1 rounded-xl bg-cream border border-espresso">
                    <span className="text-[10px] font-bold uppercase text-espresso/60 block">Sisa Stok</span>
                    <span className={`text-base font-black ${
                      isZero ? 'text-rose-700' : isLow ? 'text-caramel' : 'text-sage-700'
                    }`}>
                      {item.stock} porsi
                    </span>
                  </div>

                  {/* Quick Add Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleQuickAdd(item.id, 5)}
                      className="px-2 py-1.5 rounded-lg bg-sage text-espresso font-black text-xs border border-espresso hover:brightness-105 active:translate-y-0.5 shadow-tactile-sm"
                      title="Tambah 5 porsi"
                    >
                      +5
                    </button>
                    <button
                      onClick={() => handleQuickAdd(item.id, 10)}
                      className="px-2 py-1.5 rounded-lg bg-caramel text-cream font-black text-xs border border-espresso hover:brightness-105 active:translate-y-0.5 shadow-tactile-sm"
                      title="Tambah 10 porsi"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => handleQuickAdd(item.id, 20)}
                      className="px-2 py-1.5 rounded-lg bg-cream-200 text-espresso font-black text-xs border border-espresso hover:bg-cream-300 active:translate-y-0.5 shadow-tactile-sm"
                      title="Tambah 20 porsi"
                    >
                      +20
                    </button>

                    {/* Set Habis */}
                    <button
                      onClick={() => handleSetZero(item.id)}
                      disabled={isZero}
                      className="px-2 py-1.5 rounded-lg bg-rose-100 text-rose-800 font-black text-xs border border-rose-600 hover:bg-rose-200 active:translate-y-0.5 disabled:opacity-40"
                      title="Set Habis (0)"
                    >
                      Habis
                    </button>

                    {/* Custom Input */}
                    {editingId === item.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          autoFocus
                          value={customValue}
                          onChange={(e) => setCustomValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveCustom(item.id)}
                          placeholder="Jml"
                          className="w-14 px-1.5 py-1 text-xs font-black border border-espresso rounded bg-white text-espresso"
                        />
                        <button
                          onClick={() => handleSaveCustom(item.id)}
                          className="p-1 rounded bg-sage border border-espresso text-espresso"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(item.id);
                          setCustomValue(item.stock.toString());
                        }}
                        className="px-2 py-1.5 rounded-lg bg-cream-50 text-espresso/70 font-bold text-xs border border-espresso/40 hover:bg-cream-100 hover:text-espresso"
                        title="Ketik angka bebas"
                      >
                        Ubah
                      </button>
                    )}
                  </div>

                </div>

              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 border-t-2 border-espresso bg-cream-100 flex items-center justify-between text-xs font-bold text-espresso/70">
          <span>Perubahan stok langsung tersinkronisasi ke seluruh layar pembeli.</span>
          <button
            onClick={onClose}
            className="btn-tactile-primary px-4 py-2 text-xs"
          >
            Selesai
          </button>
        </div>

      </div>
    </div>
  );
}
