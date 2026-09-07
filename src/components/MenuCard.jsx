import React from 'react';
import { Plus, Minus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { sound } from '../lib/audio';

export const formatRupiah = (number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(number);
};

export default function MenuCard({ item, cartQty, onAddToCart, onRemoveFromCart }) {
  const isOutOfStock = item.stock <= 0;
  const isLowStock = item.stock > 0 && item.stock <= 5;
  const canAddMore = !isOutOfStock && cartQty < item.stock;

  const handleAdd = () => {
    if (!canAddMore) return;
    sound.playAdd();
    onAddToCart(item);
  };

  const handleRemove = () => {
    sound.playRemove();
    onRemoveFromCart(item);
  };

  return (
    <div className={`card-tactile overflow-hidden flex flex-col justify-between transition-all duration-200 ${
      isOutOfStock ? 'opacity-75 bg-cream-200/50' : 'hover:-translate-y-1'
    }`}>
      <div>
        {/* Gambar Menu */}
        <div className="relative h-44 w-full bg-cream-200 border-b-2 border-espresso overflow-hidden group">
          <img
            src={item.image}
            alt={item.name}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              isOutOfStock ? 'grayscale contrast-75' : ''
            }`}
            loading="lazy"
          />

          {/* Badge Kategori & Sorotan */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1.5 z-10">
            {item.badge && (
              <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-cream border border-espresso text-espresso shadow-tactile-sm">
                {item.badge}
              </span>
            )}
          </div>

          {/* Stempel Habis jika Stok 0 */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-espresso/60 backdrop-blur-[2px] flex items-center justify-center p-3">
              <div className="rotate-[-8deg] border-4 border-rose-500 bg-cream px-4 py-1.5 rounded-xl shadow-tactile text-rose-700 font-black text-sm tracking-wider uppercase">
                HABIS (Sold Out)
              </div>
            </div>
          )}
        </div>

        {/* Konten Menu */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-base font-black text-espresso leading-snug">
              {item.name}
            </h3>
          </div>

          <p className="text-xs text-espresso/75 leading-relaxed mb-3 line-clamp-2">
            {item.description}
          </p>

          {/* Sisa Stok Indicator */}
          <div className="mb-3">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 border border-rose-400 px-2 py-0.5 rounded-md">
                <AlertCircle className="w-3 h-3" /> Stok Kosong
              </span>
            ) : isLowStock ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-caramel bg-caramel-100 border border-caramel/40 px-2 py-0.5 rounded-md animate-pulse">
                <AlertCircle className="w-3 h-3 text-caramel" /> Tersisa {item.stock} porsi lagi! 🔥
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sage-700 bg-sage-100 border border-sage-600/40 px-2 py-0.5 rounded-md">
                <CheckCircle2 className="w-3 h-3 text-sage-700" /> Tersedia: {item.stock} porsi
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Harga & Tombol Aksi Tactile */}
      <div className="p-4 pt-0 flex items-center justify-between gap-2">
        <div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-espresso/60 block">Harga</span>
          <span className="text-base font-black text-caramel">
            {formatRupiah(item.price)}
          </span>
        </div>

        {isOutOfStock ? (
          <button
            disabled
            className="px-3 py-1.5 rounded-xl bg-cream-200 border-2 border-espresso/40 text-espresso/40 font-bold text-xs cursor-not-allowed"
          >
            Habis
          </button>
        ) : cartQty > 0 ? (
          <div className="flex items-center gap-2 bg-cream-50 border-2 border-espresso rounded-xl p-1 shadow-tactile-sm">
            <button
              onClick={handleRemove}
              className="w-7 h-7 rounded-lg bg-cream border border-espresso flex items-center justify-center font-bold text-espresso hover:bg-cream-200 active:translate-y-0.5 transition-all"
              title="Kurangi"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-6 text-center font-black text-sm text-espresso">
              {cartQty}
            </span>
            <button
              onClick={handleAdd}
              disabled={!canAddMore}
              className={`w-7 h-7 rounded-lg bg-caramel border border-espresso flex items-center justify-center font-bold text-cream hover:brightness-105 active:translate-y-0.5 transition-all ${
                !canAddMore ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={canAddMore ? 'Tambah' : 'Maksimal stok tercapai'}
            >
              <Plus className="w-3.5 h-3.5 text-cream" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAdd}
            className="btn-tactile-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah
          </button>
        )}
      </div>
    </div>
  );
}
