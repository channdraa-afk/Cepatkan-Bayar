import React, { useState, useRef } from 'react';
import { ShoppingBag, Coffee, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { sound } from '../lib/audio';

export default function Header({
  cartCount,
  onOpenCart,
  isCashier,
  onOpenCashierPin,
  onExitCashier,
  onOpenCashierSettings
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
    <header className="sticky top-0 z-30 bg-cream/95 backdrop-blur-md border-b-2 border-espresso px-4 py-3 shadow-tactile-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        
        {/* Logo & Secret Cashier Gate */}
        <div 
          onClick={handleLogoTap}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
          title="Ketuk 5x berturut-turut untuk akses kasir rahasia"
        >
          <div className="w-10 h-10 rounded-xl bg-caramel border-2 border-espresso flex items-center justify-center text-cream shadow-tactile-sm group-active:translate-y-0.5 group-active:shadow-tactile-pressed transition-all">
            <Coffee className="w-5 h-5 text-cream" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold text-espresso tracking-tight">CepatkanBayar</span>
              {isCashier && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-sage text-espresso border border-espresso">
                  <ShieldCheck className="w-3 h-3 text-espresso" /> Kasir
                </span>
              )}
            </div>
            <p className="text-[11px] font-bold text-caramel tracking-wide flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Stand Bazar & Kasir Kilat
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {isCashier ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  onExitCashier();
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-lg border border-espresso bg-cream-50 text-espresso hover:bg-white shadow-tactile-sm active:translate-y-0.5 active:shadow-tactile-pressed transition-all"
              >
                Lihat Menu Pembeli
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                sound.playClick();
                onOpenCart();
              }}
              className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-caramel text-cream font-extrabold border-2 border-espresso shadow-tactile hover:brightness-105 active:translate-y-1 active:shadow-tactile-pressed transition-all"
            >
              <ShoppingBag className="w-4 h-4 text-cream" />
              <span className="text-sm">Keranjang</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-cream text-espresso text-xs font-black flex items-center justify-center border border-espresso ml-0.5">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Quick hidden lock button for easier access without 5-tap */}
          {!isCashier && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenCashierPin();
              }}
              className="p-2 rounded-xl border border-espresso/20 hover:border-espresso hover:bg-cream-200/50 text-espresso/40 hover:text-espresso transition-all"
              title="Akses Kasir Tersembunyi (PIN: 1234)"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
