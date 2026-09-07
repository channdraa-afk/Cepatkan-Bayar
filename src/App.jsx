import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import Header from './components/Header';
import MenuCard from './components/MenuCard';
import CartDrawer from './components/CartDrawer';
import OrderTrackerModal from './components/OrderTrackerModal';
import SecretPinModal from './components/SecretPinModal';
import CashierDashboard from './components/CashierDashboard';
import StockManagerModal from './components/StockManagerModal';
import QrCodeModal from './components/QrCodeModal';
import SupabaseConfigModal from './components/SupabaseConfigModal';

import { 
  fetchMenus, fetchOrders, createOrder, updateMenuStock, 
  quickAddStock, updateOrderStatus, subscribeToData 
} from './lib/storage';
import { CATEGORIES } from './data/initialMenu';
import { sound } from './lib/audio';
import { Utensils, Coffee, Sparkles, AlertCircle, ShoppingBag, ShieldCheck } from 'lucide-react';

export default function App() {
  const [menus, setMenus] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Modals & Views
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCashier, setIsCashier] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeCustomerOrder, setActiveCustomerOrder] = useState(null);

  // Audio enable flag on first user interaction
  const hasInteractedRef = useRef(false);

  // Load Initial Data
  const loadData = async () => {
    const loadedMenus = await fetchMenus();
    const loadedOrders = await fetchOrders();
    setMenus(loadedMenus);
    setOrders(loadedOrders);
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates
    const unsubscribe = subscribeToData(
      // On Order Change
      (payload) => {
        loadData();
        // If cashier is active, alert with bell kaching!
        if (isCashier) {
          sound.playCashRegister();
        }
      },
      // On Menu / Stock Change
      (payload) => {
        loadData();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isCashier]);

  // Keep customer tracked order in sync if status changes
  useEffect(() => {
    if (activeCustomerOrder) {
      const updated = orders.find(o => o.id === activeCustomerOrder.id);
      if (updated && updated.status !== activeCustomerOrder.status) {
        setActiveCustomerOrder(updated);
        if (updated.status === 'completed') {
          sound.playComplete();
        }
      }
    }
  }, [orders, activeCustomerOrder]);

  // Cart operations
  const handleAddToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (existing.qty >= item.stock) return prev;
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const handleRemoveFromCart = (item) => {
    setCart((prev) => {
      const existing = prev.find(i => i.id === item.id);
      if (!existing) return prev;
      if (existing.qty <= 1) {
        return prev.filter(i => i.id !== item.id);
      }
      return prev.map(i => i.id === item.id ? { ...i, qty: i.qty - 1 } : i);
    });
  };

  const handleUpdateQty = (itemId, newQty) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter(i => i.id !== itemId));
    } else {
      const liveMenu = menus.find(m => m.id === itemId);
      const safeQty = liveMenu ? Math.min(newQty, liveMenu.stock) : newQty;
      setCart(prev => prev.map(i => i.id === itemId ? { ...i, qty: safeQty } : i));
    }
  };

  // Submit Order (Customer)
  const handleSubmitOrder = async (orderPayload) => {
    const created = await createOrder(orderPayload);
    setCart([]);
    setActiveCustomerOrder(created);
    await loadData();

    // Sound and celebratory confetti
    sound.playOrderSuccess();
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#9D6638', '#B0BA99', '#4E220F', '#F7F1DE']
      });
    } catch (e) {}
  };

  // Cashier Stock operations
  const handleUpdateStock = async (id, newStock) => {
    await updateMenuStock(id, newStock);
    await loadData();
  };

  const handleQuickAddStock = async (id, amount) => {
    await quickAddStock(id, amount);
    await loadData();
  };

  // Cashier Order Status operations
  const handleUpdateOrderStatus = async (orderId, newStatus, extraData) => {
    await updateOrderStatus(orderId, newStatus, extraData);
    await loadData();
  };

  // Filtered menus for customer view
  const filteredMenus = menus.filter(m => {
    if (selectedCategory === 'Semua') return true;
    return m.category === selectedCategory;
  });

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="min-h-screen flex flex-col bg-cream font-nunito text-espresso selection:bg-caramel selection:text-white">
      
      {/* Header with Secret Cashier Door */}
      <Header
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        isCashier={isCashier}
        onOpenCashierPin={() => setIsPinModalOpen(true)}
        onExitCashier={() => setIsCashier(false)}
        onOpenCashierSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {isCashier ? (
          /* ================= MODE KASIR (ADMIN) ================= */
          <CashierDashboard
            orders={orders}
            menus={menus}
            onUpdateStatus={handleUpdateOrderStatus}
            onOpenStockManager={() => setIsStockModalOpen(true)}
            onOpenQrModal={() => setIsQrModalOpen(true)}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
            onExitCashier={() => setIsCashier(false)}
          />
        ) : (
          /* ================= MODE PEMBELI (PUBLIC) ================= */
          <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
            
            {/* Banner Stand Bazar */}
            <div className="card-tactile bg-cream-100 p-5 sm:p-6 text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-sage/20 pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-caramel/15 pointer-events-none" />
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage text-espresso border border-espresso text-xs font-black mb-2 shadow-tactile-sm">
                <Sparkles className="w-3.5 h-3.5" /> Selamat Datang di Stand Bazar
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-espresso tracking-tight mb-2">
                Pesan Mandiri & Cepatkan Bayar
              </h1>
              <p className="text-xs sm:text-sm text-espresso/80 font-bold max-w-md mx-auto leading-relaxed">
                Pilih menu favoritmu, cek ketersediaan stok secara *realtime*, dan ambil pesananmu saat nomor antrean dipanggil!
              </p>
            </div>

            {/* Filter Kategori */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
              <div className="flex items-center gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      sound.playClick();
                      setSelectedCategory(cat);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black border-2 border-espresso transition-all select-none ${
                      selectedCategory === cat
                        ? 'bg-caramel text-cream shadow-tactile'
                        : 'bg-cream-50 text-espresso shadow-tactile-sm hover:bg-cream-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <span className="text-xs font-bold text-espresso/60 shrink-0">
                {filteredMenus.length} Menu
              </span>
            </div>

            {/* Grid Katalog Menu */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredMenus.map((item) => {
                const cartItem = cart.find(i => i.id === item.id);
                return (
                  <MenuCard
                    key={item.id}
                    item={item}
                    cartQty={cartItem ? cartItem.qty : 0}
                    onAddToCart={handleAddToCart}
                    onRemoveFromCart={handleRemoveFromCart}
                  />
                );
              })}
            </div>

            {/* Floating Checkout Bar for Mobile (jika keranjang terisi) */}
            {cartCount > 0 && (
              <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-20 animate-in slide-in-from-bottom-4">
                <button
                  onClick={() => {
                    sound.playClick();
                    setIsCartOpen(true);
                  }}
                  className="btn-tactile-primary w-full py-3.5 px-5 flex items-center justify-between text-sm shadow-tactile-lg"
                >
                  <div className="flex items-center gap-2 font-black">
                    <span className="w-6 h-6 rounded-full bg-cream text-espresso text-xs flex items-center justify-center border border-espresso">
                      {cartCount}
                    </span>
                    <span>Lihat Pesanan</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-black">
                    <span>Lanjut ke Kasir</span>
                    <span>➔</span>
                  </div>
                </button>
              </div>
            )}

          </div>
        )}
      </main>

      {/* Footer Vintage */}
      <footer className="border-t-2 border-espresso bg-cream-100 py-6 px-4 text-center text-xs font-bold text-espresso/60 space-y-2">
        <p>© 2026 CepatkanBayar • Stand Bazar Modern by Chandra (RPL) & Violet</p>
        <p className="text-[11px] text-espresso/40">
          Ditenagai oleh Supabase Realtime & Web Audio API
        </p>
      </footer>

      {/* MODALS */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        menus={menus}
        onUpdateQty={handleUpdateQty}
        onClearCart={() => setCart([])}
        onSubmitOrder={handleSubmitOrder}
      />

      <OrderTrackerModal
        order={activeCustomerOrder}
        onClose={() => setActiveCustomerOrder(null)}
        onNewOrder={() => {
          setActiveCustomerOrder(null);
          setIsCartOpen(false);
        }}
      />

      <SecretPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => {
          setIsPinModalOpen(false);
          setIsCashier(true);
        }}
      />

      <StockManagerModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        menus={menus}
        onUpdateStock={handleUpdateStock}
        onQuickAddStock={handleQuickAddStock}
      />

      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />

      <SupabaseConfigModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onConfigSaved={() => loadData()}
      />

    </div>
  );
}
