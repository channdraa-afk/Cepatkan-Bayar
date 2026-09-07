import React, { useState, useRef } from 'react';
import { ShoppingBag, Coffee, ShieldCheck, Sparkles, LogOut, Utensils, ClipboardList, Plus } from 'lucide-react';
import { sound } from '../lib/audio';

export default function Header({
  cartCount,
  onOpenCart,
  isCashier,
  onOpenCashierPin,
  cashierView,
  onToggleCashierView,
  onLogoutCashier,
  onOpenMenuManager,
  pendingOrdersCount
}) {
  const [tapCount, setTapCount] = useState(0);
  const timerRef = useRef(null);

  // Secret 5-tap trigger on the logo
  const handleLogoTap = () => {
    sound.playClick();
    const newCount = tapCount + 1;
    setTapCount(newCount);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (newCount >= 5) {
      setTapCount(0);
      onOpenCashierPin();
    } else {
      timerRef.current = setTimeout(() => {
        setTapCount(0);
      }, 2500);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur-md border-b-2 border-espresso px-3 sm:px-4 py-2.5 sm:py-3 shadow-tactile-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        
        {/* Logo & Secret Cashier Gate */}
        <div 
          onClick={handleLogoTap}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group"
          title="Ketuk 5x berturut-turut untuk akses kasir rahasia"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-caramel border-2 border-espresso flex items-center justify-center text-cream shadow-tactile-sm group-active:translate-y-0.5 group-active:shadow-tactile-pressed transition-all">
            <Coffee className="w-5 h-5 text-cream" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg sm:text-xl font-extrabold text-espresso tracking-tight">CepatkanBayar</span>
              {isCashier && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-sage text-espresso border border-espresso">
                  <ShieldCheck className="w-3 h-3 text-espresso" /> Kasir Aktif
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] font-bold text-caramel tracking-wide flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Stand Bazar & Kasir Kilat
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {isCashier ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Tombol Kelola / Tambah Menu Cepat */}
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenMenuManager();
                }}
                className="btn-tactile-primary px-2.5 sm:px-3 py-1.5 text-xs font-black flex items-center gap-1"
                title="Kelola, Tambah, Edit, atau Hapus Menu"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kelola / + Menu</span>
                <span className="sm:hidden">+ Menu</span>
              </button>

              {/* Toggle Antrean vs Katalog Menu */}
              <button
                onClick={() => {
                  sound.playClick();
                  onToggleCashierView();
                }}
                className="btn-tactile-cream px-2.5 sm:px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
              >
                {cashierView === 'dashboard' ? (
                  <>
                    <Utensils className="w-3.5 h-3.5" />
                    <span>Lihat Menu</span>
                  </>
                ) : (
                  <>
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Antrean</span>
                    {pendingOrdersCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-rose-600 text-cream text-[10px] font-black flex items-center justify-center">
                        {pendingOrdersCount}
                      </span>
                    )}
                  </>
                )}
              </button>

              {/* Logout Kasir */}
              <button
                onClick={() => {
                  sound.playRemove();
                  onLogoutCashier();
                }}
                className="p-1.5 rounded-lg border border-espresso/40 bg-cream hover:bg-rose-100 text-rose-700 transition-all"
                title="Keluar dari Mode Kasir"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                sound.playClick();
                onOpenCart();
              }}
              className="relative flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-caramel text-cream font-extrabold border-2 border-espresso shadow-tactile hover:brightness-105 active:translate-y-1 active:shadow-tactile-pressed transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-cream" />
              <span className="text-xs sm:text-sm">Keranjang</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-cream text-espresso text-xs font-black flex items-center justify-center border border-espresso ml-0.5">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
