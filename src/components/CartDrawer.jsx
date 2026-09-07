import React, { useState } from 'react';
import { X, ShoppingBag, Trash2, ArrowRight, Banknote, QrCode, AlertCircle, Plus, Minus } from 'lucide-react';
import { formatRupiah } from './MenuCard';
import { sound } from '../lib/audio';

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  menus,
  onUpdateQty,
  onClearCart,
  onSubmitOrder
}) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg('Silakan tulis nama pemesan ya!');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMsg('Silakan isi nomor WhatsApp/HP aktif untuk verifikasi pesanan!');
      return;
    }
    if (cartItems.length === 0) {
      setErrorMsg('Keranjangmu masih kosong!');
      return;
    }

    // Proteksi anti-iseng: Cek jeda pemesanan dari perangkat yang sama (cooldown 30 detik)
    try {
      const lastOrderTs = localStorage.getItem('cepatkanbayar_last_order_ts');
      if (lastOrderTs && Date.now() - parseInt(lastOrderTs) < 30000) {
        const remaining = Math.ceil((30000 - (Date.now() - parseInt(lastOrderTs))) / 1000);
        setErrorMsg(`Mohon tunggu ${remaining} detik lagi sebelum mengirim pesanan berikutnya (anti-spam stand).`);
        return;
      }
    } catch (err) {}

    // Periksa apakah ada item yang melebihi stok terbaru
    for (const item of cartItems) {
      const liveMenu = menus.find(m => m.id === item.id);
      if (liveMenu && item.qty > liveMenu.stock) {
        setErrorMsg(`Maaf, stok ${item.name} sisa ${liveMenu.stock}. Mohon kurangi jumlahnya.`);
        return;
      }
    }

    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await onSubmitOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        notes: notes.trim(),
        paymentMethod,
        items: cartItems.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          qty: i.qty
        })),
        totalPrice
      });
      // Set timestamp anti-spam
      try {
        localStorage.setItem('cepatkanbayar_last_order_ts', Date.now().toString());
      } catch (err) {}

      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      onClose();
    } catch (err) {
      setErrorMsg('Gagal mengirim pesanan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col justify-end sm:flex-row sm:justify-end">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-espresso/50 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer / Mobile Bottom Sheet Body */}
      <div className="relative z-10 w-full sm:max-w-md bg-cream border-t-2 sm:border-t-0 sm:border-l-2 border-espresso rounded-t-3xl sm:rounded-none max-h-[90vh] sm:max-h-full sm:h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-right duration-200">
        
        {/* Mobile handle indicator */}
        <div className="sm:hidden pt-2 pb-1 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-espresso/25" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b-2 border-espresso bg-cream-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-caramel" />
            <h2 className="text-base sm:text-lg font-black text-espresso">Keranjang Pesanan</h2>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-caramel/20 text-espresso border border-espresso">
              {cartItems.length} menu
            </span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-cream border border-espresso flex items-center justify-center hover:bg-cream-200 active:translate-y-0.5 transition-all text-espresso"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Items & Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 rounded-2xl bg-cream-200 border-2 border-espresso flex items-center justify-center mx-auto mb-3 shadow-tactile-sm">
                <ShoppingBag className="w-8 h-8 text-espresso/40" />
              </div>
              <p className="font-extrabold text-espresso text-base mb-1">Keranjang masih kosong</p>
              <p className="text-xs text-espresso/60 font-bold">Yuk pilih menu lezat bazar di katalog!</p>
            </div>
          ) : (
            <>
              {/* Item List */}
              <div className="space-y-2.5">
                {cartItems.map((item) => (
                  <div 
                    key={item.id}
                    className="p-3 bg-cream-50 border-2 border-espresso rounded-xl shadow-tactile-sm flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-sm text-espresso truncate">{item.name}</h4>
                      <p className="text-xs font-bold text-caramel">
                        {formatRupiah(item.price)} × {item.qty} = <span className="font-extrabold">{formatRupiah(item.price * item.qty)}</span>
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1.5 bg-cream border border-espresso rounded-lg p-0.5">
                      <button
                        onClick={() => {
                          sound.playRemove();
                          onUpdateQty(item.id, item.qty - 1);
                        }}
                        className="w-7 h-7 rounded bg-cream-100 flex items-center justify-center text-espresso hover:bg-cream-200 active:translate-y-0.5"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-black text-espresso">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => {
                          const live = menus.find(m => m.id === item.id);
                          if (live && item.qty >= live.stock) return;
                          sound.playAdd();
                          onUpdateQty(item.id, item.qty + 1);
                        }}
                        className="w-7 h-7 rounded bg-caramel text-cream flex items-center justify-center hover:brightness-105 active:translate-y-0.5"
                      >
                        <Plus className="w-3.5 h-3.5 text-cream" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Form Data Pemesan */}
              <form id="orderForm" onSubmit={handleSubmit} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-black text-espresso uppercase tracking-wider mb-1">
                    Nama Pemesan <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Chandra / Meja 3"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-espresso bg-cream-50 text-espresso font-bold text-sm focus:outline-none focus:ring-2 focus:ring-caramel shadow-tactile-sm placeholder:text-espresso/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-espresso uppercase tracking-wider mb-1">
                    No. WhatsApp / HP Aktif <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 08123456789"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-espresso bg-cream-50 text-espresso font-bold text-sm focus:outline-none focus:ring-2 focus:ring-caramel shadow-tactile-sm placeholder:text-espresso/40"
                  />
                  <p className="text-[10px] text-espresso/60 font-bold mt-1">
                    🔒 Untuk verifikasi pesanan & panggilan antrean oleh kasir stand
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black text-espresso uppercase tracking-wider mb-1">
                    Nomor Meja / Catatan Khusus (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: Meja 4 / Tanpa es / Jangan terlalu pedas"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border-2 border-espresso bg-cream-50 text-espresso font-bold text-sm focus:outline-none focus:ring-2 focus:ring-caramel shadow-tactile-sm placeholder:text-espresso/40"
                  />
                </div>

                {/* Pilihan Metode Bayar */}
                <div>
                  <label className="block text-xs font-black text-espresso uppercase tracking-wider mb-1.5">
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setPaymentMethod('Tunai');
                      }}
                      className={`p-3 rounded-xl border-2 border-espresso font-black text-xs flex items-center justify-center gap-2 transition-all ${
                        paymentMethod === 'Tunai'
                          ? 'bg-caramel text-cream shadow-tactile'
                          : 'bg-cream-50 text-espresso shadow-tactile-sm hover:bg-cream-100'
                      }`}
                    >
                      <Banknote className="w-4 h-4" /> Bayar Tunai
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setPaymentMethod('QRIS');
                      }}
                      className={`p-3 rounded-xl border-2 border-espresso font-black text-xs flex items-center justify-center gap-2 transition-all ${
                        paymentMethod === 'QRIS'
                          ? 'bg-caramel text-cream shadow-tactile'
                          : 'bg-cream-50 text-espresso shadow-tactile-sm hover:bg-cream-100'
                      }`}
                    >
                      <QrCode className="w-4 h-4" /> QRIS Stand
                    </button>
                  </div>

                  {paymentMethod === 'QRIS' && (
                    <div className="mt-3 p-3 bg-white border-2 border-espresso rounded-2xl text-center shadow-tactile-sm">
                      <p className="text-xs font-black text-espresso mb-1.5 flex items-center justify-center gap-1">
                        <QrCode className="w-4 h-4 text-caramel" /> Scan QRIS Stand di Bawah
                      </p>
                      <img 
                        src="/qris.png" 
                        alt="QRIS Pembayaran Stand" 
                        className="max-h-52 w-auto mx-auto rounded-xl border border-espresso/20 object-contain shadow-sm"
                      />
                      <p className="text-[10px] text-espresso/70 mt-2 font-bold leading-tight">
                        Dapat di-scan menggunakan BCA, GoPay, OVO, ShopeePay, DANA, dll. Tunjukkan bukti transfer ke kasir ya!
                      </p>
                    </div>
                  )}
                </div>

                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-500 text-rose-800 text-xs font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {errorMsg}
                  </div>
                )}
              </form>
            </>
          )}
        </div>

        {/* Footer Checkout */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t-2 border-espresso bg-cream-100 space-y-3 pb-6 sm:pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-extrabold text-espresso/70">Total Bayar:</span>
              <span className="text-xl font-black text-caramel">
                {formatRupiah(totalPrice)}
              </span>
            </div>

            <button
              type="submit"
              form="orderForm"
              disabled={isSubmitting}
              className="btn-tactile-primary w-full py-3.5 text-sm flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Memproses Pesanan...</span>
              ) : (
                <>
                  <span>Pesan Sekarang ({paymentMethod})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
