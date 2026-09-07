import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import Header from './components/Header';
import MenuCard from './components/MenuCard';
import CartDrawer from './components/CartDrawer';
import OrderTrackerModal from './components/OrderTrackerModal';
import SecretPinModal from './components/SecretPinModal';
import CashierDashboard from './components/CashierDashboard';
import StockManagerModal from './components/StockManagerModal';
import MenuManagerModal from './components/MenuManagerModal';
import QrCodeModal from './components/QrCodeModal';
import FinancialModal from './components/FinancialModal';
import CustomerOrdersModal from './components/CustomerOrdersModal';

import { 
  fetchMenus, fetchOrders, createOrder, updateMenuStock, 
  quickAddStock, updateOrderStatus, subscribeToData,
  createMenu, updateMenu, deleteMenu, clearAllMenus,
  deleteOrder, clearAllOrders, toggleQrisValidation,
  fetchExpenses, createExpense, deleteExpense, clearAllExpenses,
  getCustomerOrderIds, saveCustomerOrderId
} from './lib/storage';
import { formatRupiah } from './components/MenuCard';
import { sound } from './lib/audio';
import { 
  Coffee, Sparkles, Search, ShieldCheck, Plus, ChevronRight, ClipboardList, Clock, Utensils
} from 'lucide-react';

export default function App() {
  const [menus, setMenus] = useState([]);
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Views
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCashier, setIsCashier] = useState(() => {
    try {
      return localStorage.getItem('cepatkanbayar_cashier_active') === 'true';
    } catch {
      return false;
    }
  });
  const [cashierView, setCashierView] = useState(() => {
    try {
      return localStorage.getItem('cepatkanbayar_cashier_view') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isMenuManagerOpen, setIsMenuManagerOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [activeCustomerOrder, setActiveCustomerOrder] = useState(null);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);
  const [myOrderIds, setMyOrderIds] = useState(() => getCustomerOrderIds());
  const [toastAlert, setToastAlert] = useState(null);

  const prevOrderStatusesRef = useRef({});
  const isOrderCreatingRef = useRef(false);
  const knownOrderIdsRef = useRef(new Set());

  // Handle State Kasir yang Awet & Anti-Logout saat Refresh Browser
  const handleLoginCashier = () => {
    setIsCashier(true);
    setCashierView('dashboard');
    try {
      localStorage.setItem('cepatkanbayar_cashier_active', 'true');
      localStorage.setItem('cepatkanbayar_cashier_view', 'dashboard');
    } catch {}
  };

  const handleLogoutCashier = () => {
    setIsCashier(false);
    setCashierView('dashboard');
    try {
      localStorage.removeItem('cepatkanbayar_cashier_active');
      localStorage.removeItem('cepatkanbayar_cashier_view');
    } catch {}
  };

  const handleSetCashierView = (view) => {
    setCashierView(view);
    try {
      localStorage.setItem('cepatkanbayar_cashier_view', view);
    } catch {}
  };

  const handleToggleCashierView = () => {
    setCashierView(prev => {
      const next = prev === 'dashboard' ? 'catalog' : 'dashboard';
      try {
        localStorage.setItem('cepatkanbayar_cashier_view', next);
      } catch {}
      return next;
    });
  };

  // Load Initial Data
  const loadData = async () => {
    const loadedMenus = await fetchMenus();
    const loadedOrders = await fetchOrders();
    const loadedExpenses = await fetchExpenses();
    setMenus(loadedMenus);
    setOrders(loadedOrders);
    setExpenses(loadedExpenses);
    // Catat ID order awal agar tidak memicu bel kasir palsu saat kasir baru dibuka/refresh
    knownOrderIdsRef.current = new Set(loadedOrders.map(o => o.id));
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates
    const unsubscribe = subscribeToData(
      () => {
        loadData();
        if (isCashier) {
          sound.playCashRegister();
        }
      },
      () => {
        loadData();
      },
      () => {
        loadData();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isCashier]);

  // Helper data pesanan milik pelanggan di perangkat ini
  const myOrders = orders.filter(o => myOrderIds.includes(o.id));
  const activeMyOrders = myOrders.filter(o => o.status === 'pending' || o.status === 'cooking');
  const latestActiveOrder = activeMyOrders[0] || null;
  const hasCookingOrder = activeMyOrders.some(o => o.status === 'cooking');

  // Auto-dismiss toast alert
  useEffect(() => {
    if (toastAlert) {
      const timer = setTimeout(() => setToastAlert(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toastAlert]);

  // Background Auto-Polling Cerdas:
  // 1. Laptop Kasir: Polling senyap tiap 3 detik agar pesanan baru dari HP langsung muncul & bel klining berbunyi otomatis
  // 2. HP Pembeli: Polling senyap tiap 4 detik jika ada pesanan aktif agar status racik & selesai auto-update tanpa refresh
  useEffect(() => {
    const shouldPoll = isCashier || activeMyOrders.length > 0;
    if (!shouldPoll) return;

    const pollInterval = isCashier ? 3000 : 4000;

    const intervalId = setInterval(async () => {
      try {
        const freshOrders = await fetchOrders();

        if (isCashier) {
          const hasNewPending = freshOrders.some(
            o => o.status === 'pending' && !knownOrderIdsRef.current.has(o.id)
          );
          if (hasNewPending) {
            sound.playCashRegister();
          }
          knownOrderIdsRef.current = new Set(freshOrders.map(o => o.id));
        }

        setOrders(freshOrders);
      } catch (err) {
        console.warn('Auto-polling orders warning:', err);
      }
    }, pollInterval);

    return () => clearInterval(intervalId);
  }, [isCashier, activeMyOrders.length]);

  // Keep customer tracked order in sync if status changes & notify customer on "Racik" or "Selesai"
  useEffect(() => {
    if (activeCustomerOrder) {
      const updated = orders.find(o => o.id === activeCustomerOrder.id);
      if (updated && updated.status !== activeCustomerOrder.status) {
        setActiveCustomerOrder(updated);
        if (updated.status === 'completed') {
          sound.playComplete();
        } else if (updated.status === 'cooking') {
          sound.playOrderSuccess();
        }
      }
    }

    // Monitor all customer active orders for realtime audio/toast alerts
    if (!isCashier && myOrders.length > 0) {
      for (const order of myOrders) {
        const prevStatus = prevOrderStatusesRef.current[order.id];
        if (prevStatus && prevStatus !== order.status) {
          if (order.status === 'cooking') {
            sound.playOrderSuccess();
            setToastAlert(`👨‍🍳 Pesanan #${order.order_number} sedang diracik oleh tim stand!`);
          } else if (order.status === 'completed') {
            sound.playComplete();
            try {
              confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.65 }
              });
            } catch {}
            const isDelivery = order.delivery_type === 'delivery' || (order.notes && order.notes.includes('🛵 Diantar'));
            setToastAlert(isDelivery
              ? `🛵 Pesanan #${order.order_number} sudah selesai dan sedang diantar ke kelas!`
              : `🎉 Pesanan #${order.order_number} sudah siap diambil di meja stand!`);
          }
        }
        prevOrderStatusesRef.current[order.id] = order.status;
      }
    } else {
      myOrders.forEach(o => {
        prevOrderStatusesRef.current[o.id] = o.status;
      });
    }
  }, [orders, activeCustomerOrder, myOrders, isCashier]);

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

  // Submit Order (Customer) - Dilindungi Mutex Hardware Anti-Spam
  const handleSubmitOrder = async (orderPayload) => {
    if (isOrderCreatingRef.current) return;
    isOrderCreatingRef.current = true;
    try {
      const created = await createOrder(orderPayload);
      const updatedIds = saveCustomerOrderId(created.id);
      if (updatedIds) setMyOrderIds(updatedIds);
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
      } catch {
        // Confetti optional
      }
    } finally {
      isOrderCreatingRef.current = false;
    }
  };

  // Cashier Menu CRUD
  const handleCreateMenu = async (menuData) => {
    await createMenu(menuData);
    await loadData();
  };

  const handleUpdateMenu = async (id, updatedFields) => {
    await updateMenu(id, updatedFields);
    await loadData();
  };

  const handleDeleteMenu = async (id) => {
    await deleteMenu(id);
    await loadData();
  };

  const handleClearAllMenus = async () => {
    await clearAllMenus();
    await loadData();
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

  const handleValidatePayment = async (orderId, isValidated) => {
    await toggleQrisValidation(orderId, isValidated);
    await loadData();
  };

  // Cashier Order Deletion (Testing Data)
  const handleDeleteOrder = async (orderId) => {
    await deleteOrder(orderId);
    await loadData();
  };

  const handleClearAllOrders = async () => {
    await clearAllOrders();
    await loadData();
  };

  // Cashier Expenses operations (Buku Kas Stand)
  const handleCreateExpense = async (expenseData) => {
    await createExpense(expenseData);
    await loadData();
  };

  const handleDeleteExpense = async (id) => {
    await deleteExpense(id);
    await loadData();
  };

  const handleClearAllExpenses = async () => {
    await clearAllExpenses();
    await loadData();
  };

  // Dynamic categories
  const categoriesList = ['Semua', ...Array.from(new Set(menus.map(m => m.category || 'Makanan')))];

  // Filtered menus for customer view
  const filteredMenus = menus.filter(m => {
    const matchCategory = selectedCategory === 'Semua' || m.category === selectedCategory;
    const matchSearch = searchQuery.trim() === '' || 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'pending' || o.status === 'cooking').length;

  return (
    <div className="min-h-screen flex flex-col bg-cream font-nunito text-espresso selection:bg-caramel selection:text-white">
      
      {/* Header with Secret Cashier Door & View Toggle */}
      <Header
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        isCashier={isCashier}
        onOpenCashierPin={() => setIsPinModalOpen(true)}
        cashierView={cashierView}
        onToggleCashierView={handleToggleCashierView}
        onLogoutCashier={handleLogoutCashier}
        onOpenMenuManager={() => setIsMenuManagerOpen(true)}
        pendingOrdersCount={pendingOrdersCount}
        myOrdersCount={activeMyOrders.length}
        onOpenMyOrders={() => setIsMyOrdersOpen(true)}
        hasCookingOrder={hasCookingOrder}
      />

      {/* Toast Notifikasi Realtime untuk Pelanggan */}
      {toastAlert && (
        <div className="fixed top-16 left-3 right-3 sm:left-auto sm:right-4 sm:max-w-md z-50 p-3.5 rounded-2xl bg-amber-100 border-2 border-caramel text-espresso font-black text-xs shadow-tactile-lg flex items-center justify-between gap-2 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-caramel shrink-0" />
            <span className="truncate">{toastAlert}</span>
          </div>
          <button 
            onClick={() => setToastAlert(null)}
            className="w-6 h-6 rounded-lg bg-cream border border-espresso flex items-center justify-center text-espresso/70 hover:text-espresso shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-24">
        {isCashier && cashierView === 'dashboard' ? (
          /* ================= MODE KASIR (DASHBOARD ANTREAN) ================= */
          <CashierDashboard
            orders={orders}
            menus={menus}
            onUpdateStatus={handleUpdateOrderStatus}
            onValidatePayment={handleValidatePayment}
            onOpenStockManager={() => setIsStockModalOpen(true)}
            onOpenMenuManager={() => setIsMenuManagerOpen(true)}
            onOpenQrModal={() => setIsQrModalOpen(true)}
            onOpenFinancial={() => setIsFinancialModalOpen(true)}
            onDeleteOrder={handleDeleteOrder}
            onClearAllOrders={handleClearAllOrders}
            onExitCashier={() => handleSetCashierView('catalog')}
          />
        ) : (
          /* ================= KATALOG MENU (PEMBELI & KASIR IN-CATALOG) ================= */
          <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5">
            
            {/* Banner Khusus jika Kasir sedang di Mode Katalog */}
            {isCashier && (
              <div className="p-3.5 bg-sage-100 border-2 border-espresso rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-tactile-sm">
                <div className="flex items-center gap-2.5 text-espresso">
                  <div className="w-8 h-8 rounded-xl bg-sage border border-espresso flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-espresso" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs sm:text-sm">Mode Kasir Aktif di Katalog Menu</h4>
                    <p className="text-[11px] font-bold text-espresso/70">
                      Kamu bisa langsung klik tombol <span className="text-rose-700 font-black">[🗑️ Hapus]</span> di kartu menu untuk menghapusnya.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setIsMenuManagerOpen(true);
                    }}
                    className="btn-tactile-primary px-3 py-1.5 text-xs font-black flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Tambah Menu Baru
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      handleSetCashierView('dashboard');
                    }}
                    className="btn-tactile-sage px-3 py-1.5 text-xs font-black flex items-center gap-1"
                  >
                    <ClipboardList className="w-3.5 h-3.5" /> Antrean ({pendingOrdersCount})
                  </button>
                </div>
              </div>
            )}

            {/* Sticky Live Tracker Banner untuk Pesanan yang Sedang Aktif di HP Pembeli */}
            {!isCashier && latestActiveOrder && (
              <div 
                onClick={() => {
                  sound.playClick();
                  setActiveCustomerOrder(latestActiveOrder);
                }}
                className={`p-3.5 sm:p-4 rounded-2xl border-2 border-espresso shadow-tactile cursor-pointer transition-all hover:brightness-105 flex items-center justify-between gap-3 animate-in slide-in-from-top-2 ${
                  latestActiveOrder.status === 'cooking'
                    ? 'bg-amber-100/95 border-caramel shadow-tactile-lg'
                    : 'bg-cream-100/95'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl border-2 border-espresso flex items-center justify-center shrink-0 shadow-tactile-sm ${
                    latestActiveOrder.status === 'cooking' ? 'bg-caramel text-cream' : 'bg-amber-200 text-espresso'
                  }`}>
                    {latestActiveOrder.status === 'cooking' ? (
                      <Utensils className="w-5 h-5 animate-pulse" />
                    ) : (
                      <Clock className="w-5 h-5 text-amber-900" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-black text-espresso">
                        Antrean #{latestActiveOrder.order_number}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border border-espresso ${
                        latestActiveOrder.status === 'cooking' 
                          ? 'bg-caramel text-cream animate-pulse' 
                          : 'bg-amber-200 text-amber-950'
                      }`}>
                        {latestActiveOrder.status === 'cooking' ? 'Sedang Diracik 👨‍🍳' : 'Menunggu Kasir ⏳'}
                      </span>
                      <span className="text-[10px] font-bold text-espresso/60 hidden sm:inline">
                        • {latestActiveOrder.customer_name}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-espresso/80 truncate mt-0.5">
                      {latestActiveOrder.items.map(i => `${i.qty}× ${i.name}`).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    className="btn-tactile-primary px-3 py-1.5 text-xs font-black flex items-center gap-1"
                  >
                    <span>Pantau Live</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Banner Stand Bazar */}
            <div className="card-tactile bg-cream-100 p-4 sm:p-6 text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-sage/20 pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-caramel/15 pointer-events-none" />
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage text-espresso border border-espresso text-xs font-black mb-2 shadow-tactile-sm">
                <Sparkles className="w-3.5 h-3.5" /> Stand Bazar Siap Melayani
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-espresso tracking-tight mb-1.5">
                Pesan Mandiri & Cepatkan Bayar
              </h1>
              <p className="text-xs sm:text-sm text-espresso/80 font-bold max-w-md mx-auto leading-relaxed">
                Pilih menu favoritmu, cek sisa stok *realtime*, dan ambil pesananmu saat nomor antrean dipanggil!
              </p>
            </div>

            {/* Instant Search Bar & Filter Kategori */}
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso/40" />
                <input
                  type="text"
                  placeholder="Cari jajanan / minuman lezat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-espresso bg-cream-50 text-espresso font-bold text-xs sm:text-sm placeholder:text-espresso/40 shadow-tactile-sm focus:outline-none focus:ring-2 focus:ring-caramel"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-espresso/50 hover:text-espresso"
                  >
                    Hapus
                  </button>
                )}
              </div>

              {/* Kategori Pills */}
              {categoriesList.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {categoriesList.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        sound.playClick();
                        setSelectedCategory(cat);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-black border-2 border-espresso transition-all shrink-0 select-none ${
                        selectedCategory === cat
                          ? 'bg-caramel text-cream shadow-tactile'
                          : 'bg-cream-50 text-espresso shadow-tactile-sm hover:bg-cream-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grid Katalog Menu atau Empty State */}
            {menus.length === 0 ? (
              <div className="text-center py-16 px-4 card-tactile bg-cream-50">
                <div className="w-16 h-16 rounded-2xl bg-cream-200 border-2 border-espresso flex items-center justify-center mx-auto mb-3 shadow-tactile-sm">
                  <Coffee className="w-8 h-8 text-caramel" />
                </div>
                <h3 className="text-lg font-black text-espresso mb-1">
                  Stand Sedang Menyiapkan Menu
                </h3>
                <p className="text-xs text-espresso/70 font-bold max-w-sm mx-auto leading-relaxed mb-4">
                  Daftar menu lezat sedang diracik oleh kasir. Silakan tunggu sebentar atau buka kembali dalam beberapa saat ya! ✨
                </p>
                {isCashier && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      setIsMenuManagerOpen(true);
                    }}
                    className="btn-tactile-primary px-4 py-2.5 text-xs inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Tambah Menu Pertama Sekarang</span>
                  </button>
                )}
              </div>
            ) : filteredMenus.length === 0 ? (
              <div className="text-center py-12 px-4 card-tactile bg-cream-50">
                <p className="text-sm font-black text-espresso mb-1">Tidak ada menu yang cocok</p>
                <p className="text-xs text-espresso/60 font-bold">Coba kata kunci pencarian yang lain.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {filteredMenus.map((item) => {
                  const cartItem = cart.find(i => i.id === item.id);
                  return (
                    <MenuCard
                      key={item.id}
                      item={item}
                      cartQty={cartItem ? cartItem.qty : 0}
                      onAddToCart={handleAddToCart}
                      onRemoveFromCart={handleRemoveFromCart}
                      isCashier={isCashier}
                      onEditMenu={() => setIsMenuManagerOpen(true)}
                      onDeleteMenu={handleDeleteMenu}
                    />
                  );
                })}
              </div>
            )}

            {/* Sticky Mobile Bottom Bar (Ergonomic Thumb-Zone) */}
            {cartCount > 0 && (
              <div className="fixed bottom-3 left-3 right-3 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom-5 duration-200">
                <button
                  onClick={() => {
                    sound.playClick();
                    setIsCartOpen(true);
                  }}
                  className="btn-tactile-primary w-full py-3.5 px-4 flex items-center justify-between text-sm shadow-tactile-lg rounded-2xl"
                >
                  <div className="flex items-center gap-2 font-black">
                    <span className="w-6 h-6 rounded-full bg-cream text-espresso text-xs flex items-center justify-center border border-espresso">
                      {cartCount}
                    </span>
                    <span>Lihat Keranjang</span>
                  </div>
                  <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
                    <span>{formatRupiah(cartTotalPrice)}</span>
                    <span className="bg-cream/20 px-2 py-0.5 rounded-lg border border-cream/30 flex items-center gap-1">
                      Pesan <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              </div>
            )}

          </div>
        )}
      </main>

      {/* Footer Vintage */}
      <footer className="border-t-2 border-espresso bg-cream-100 py-6 px-4 text-center text-xs font-bold text-espresso/60 space-y-2">
        <p>© 2026 CepatkanBayar • Stand Bazar Modern by Chandra (RPL)</p>
        <p className="text-[11px] text-espresso/40">
          Made with ❤️ for Stand Bazar
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

      <CustomerOrdersModal
        isOpen={isMyOrdersOpen}
        onClose={() => setIsMyOrdersOpen(false)}
        myOrders={myOrders}
        onSelectOrder={(order) => {
          setActiveCustomerOrder(order);
          setIsMyOrdersOpen(false);
        }}
      />

      <SecretPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => {
          setIsPinModalOpen(false);
          handleLoginCashier();
        }}
      />

      <MenuManagerModal
        isOpen={isMenuManagerOpen}
        onClose={() => setIsMenuManagerOpen(false)}
        menus={menus}
        onCreateMenu={handleCreateMenu}
        onUpdateMenu={handleUpdateMenu}
        onDeleteMenu={handleDeleteMenu}
        onClearAllMenus={handleClearAllMenus}
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

      <FinancialModal
        isOpen={isFinancialModalOpen}
        onClose={() => setIsFinancialModalOpen(false)}
        expenses={expenses}
        orders={orders}
        onCreateExpense={handleCreateExpense}
        onDeleteExpense={handleDeleteExpense}
        onClearAllExpenses={handleClearAllExpenses}
      />

    </div>
  );
}
