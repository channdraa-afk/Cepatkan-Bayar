import { getSupabase } from './supabase';
import { INITIAL_MENUS } from '../data/initialMenu';

const LOCAL_STORAGE_MENUS_KEY = 'cepatkanbayar_menus_local';
const LOCAL_STORAGE_ORDERS_KEY = 'cepatkanbayar_orders_local';
const LOCAL_STORAGE_EXPENSES_KEY = 'cepatkanbayar_expenses_local';
const LOCAL_STORAGE_CUSTOMER_ORDERS_KEY = 'cepatkanbayar_my_order_ids';

// Helper riwayat pesanan milik perangkat pembeli ini
export const getCustomerOrderIds = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_CUSTOMER_ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const saveCustomerOrderId = (orderId) => {
  if (!orderId) return [];
  try {
    const existing = getCustomerOrderIds();
    if (!existing.includes(orderId)) {
      const updated = [orderId, ...existing].slice(0, 30);
      localStorage.setItem(LOCAL_STORAGE_CUSTOMER_ORDERS_KEY, JSON.stringify(updated));
      return updated;
    }
    return existing;
  } catch {
    return [];
  }
};

// Cross-tab broadcast channel for local development and offline mode
const channel = typeof window !== 'undefined' && window.BroadcastChannel 
  ? new BroadcastChannel('cepatkanbayar_sync') 
  : null;

// ==================== MENUS CRUD ====================
export const getLocalMenus = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_MENUS_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_MENUS_KEY, JSON.stringify(INITIAL_MENUS));
      return INITIAL_MENUS;
    }
    return JSON.parse(data);
  } catch {
    return INITIAL_MENUS;
  }
};

export const fetchMenus = async () => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('menus').select('*').order('created_at', { ascending: true });
      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('Gagal fetch Supabase menus, fallback ke lokal:', err);
    }
  }
  return getLocalMenus();
};

export const createMenu = async (menuData) => {
  const id = `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newMenu = {
    id,
    name: menuData.name.trim(),
    category: menuData.category || 'Makanan',
    price: parseInt(menuData.price) || 0,
    stock: parseInt(menuData.stock) || 0,
    description: (menuData.description || '').trim(),
    image: menuData.image || 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=400&q=80',
    badge: menuData.badge || '',
    created_at: new Date().toISOString()
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('menus').insert([newMenu]);
    } catch (err) {
      console.warn('Gagal create menu Supabase:', err);
    }
  }

  const local = getLocalMenus();
  const updated = [...local, newMenu];
  localStorage.setItem(LOCAL_STORAGE_MENUS_KEY, JSON.stringify(updated));
  if (channel) channel.postMessage({ type: 'MENU_UPDATE' });
  return newMenu;
};

export const updateMenu = async (id, updatedFields) => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('menus').update(updatedFields).eq('id', id);
    } catch (err) {
      console.warn('Gagal update menu Supabase:', err);
    }
  }

  const local = getLocalMenus();
  const updated = local.map(m => m.id === id ? { ...m, ...updatedFields } : m);
  localStorage.setItem(LOCAL_STORAGE_MENUS_KEY, JSON.stringify(updated));
  if (channel) channel.postMessage({ type: 'MENU_UPDATE' });
  return updated;
};

export const deleteMenu = async (id) => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('menus').delete().eq('id', id);
    } catch (err) {
      console.warn('Gagal delete menu Supabase:', err);
    }
  }

  const local = getLocalMenus();
  const updated = local.filter(m => m.id !== id);
  localStorage.setItem(LOCAL_STORAGE_MENUS_KEY, JSON.stringify(updated));
  if (channel) channel.postMessage({ type: 'MENU_UPDATE' });
  return updated;
};

export const clearAllMenus = async () => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('menus').delete().neq('id', 'placeholder');
    } catch (err) {
      console.warn('Gagal clear menus Supabase:', err);
    }
  }

  localStorage.setItem(LOCAL_STORAGE_MENUS_KEY, JSON.stringify([]));
  if (channel) channel.postMessage({ type: 'MENU_UPDATE' });
  return [];
};

export const updateMenuStock = async (id, newStock) => {
  const finalStock = Math.max(0, parseInt(newStock) || 0);
  return await updateMenu(id, { stock: finalStock });
};

export const quickAddStock = async (id, amount) => {
  const menus = await fetchMenus();
  const item = menus.find(m => m.id === id);
  const currentStock = item ? item.stock : 0;
  return await updateMenuStock(id, currentStock + amount);
};

// Helper untuk membaca dan mengekstrak nomor telepon, kelas, dan tipe pengantaran
const parseOrder = (order) => {
  if (!order) return order;
  let phone = order.customer_phone || '';
  let notes = order.notes || '';
  let deliveryType = order.delivery_type || (notes.includes('🛵 Diantar') ? 'delivery' : 'pickup');

  if (!phone && notes.includes('[WA:')) {
    const match = notes.match(/\[WA:\s*([^\]]+)\]/);
    if (match) {
      phone = match[1].trim();
    }
  }

  // Cek apakah pembayaran QRIS sudah divalidasi kasir
  const isQrisValidated = Boolean(
    order.qris_validated ||
    order.payment_status === 'paid' ||
    notes.includes('[QRIS_LUNAS]') ||
    (order.payment_method === 'QRIS' && order.status === 'completed')
  );

  // Cek apakah notifikasi WhatsApp pesanan siap sudah dikirim
  const isWaNotified = Boolean(
    order.is_wa_notified ||
    notes.includes('[WA_NOTIFIED]')
  );

  // Catatan bersih tanpa tag kurung siku
  const displayNotes = notes
    .replace(/\[🛵 Diantar ke Kelas\]/g, '')
    .replace(/\[🚶 Ambil di Kasir\]/g, '')
    .replace(/\[WA:\s*[^\]]+\]/g, '')
    .replace(/\[QRIS_LUNAS\]/g, '')
    .replace(/\[WA_NOTIFIED\]/g, '')
    .trim();

  return {
    ...order,
    customer_phone: phone,
    delivery_type: deliveryType,
    display_notes: displayNotes,
    is_qris_validated: isQrisValidated,
    is_wa_notified: isWaNotified
  };
};

// ==================== ORDERS ====================
export const getLocalOrders = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    const parsed = data ? JSON.parse(data) : [];
    return parsed.map(parseOrder);
  } catch {
    return [];
  }
};

export const fetchOrders = async () => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        const parsed = data.map(parseOrder);
        // Selalu perbarui cache lokal dengan data cloud Supabase yang valid
        // Ini otomatis membersihkan order hantu lokal dan mencegah kedip-kedip saat polling
        try {
          localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(parsed));
        } catch (e) {
          console.warn('Gagal simpan cache orders lokal:', e);
        }
        return parsed;
      }
    } catch (err) {
      console.warn('Gagal fetch Supabase orders, fallback ke lokal:', err);
    }
  }
  return getLocalOrders();
};

export const createOrder = async ({ customerName, customerClass, customerPhone, deliveryType, notes, items, totalPrice, paymentMethod }) => {
  const supabase = getSupabase();
  let maxExistingNum = 0;

  // 1. Cek langsung ke database cloud Supabase untuk nomor urut tertinggi
  if (supabase) {
    try {
      const { data: dbOrders, error } = await supabase
        .from('orders')
        .select('order_number');
      if (!error && Array.isArray(dbOrders)) {
        for (const o of dbOrders) {
          const raw = (o.order_number || '').replace(/[^0-9]/g, '');
          const num = parseInt(raw, 10);
          if (!isNaN(num) && num > maxExistingNum) maxExistingNum = num;
        }
      }
    } catch (err) {
      console.warn('Gagal query max order_number Supabase:', err);
    }
  }

  // 2. Periksa juga data lokal perangkat jika ada pesanan offline yang belum sinkron
  const localOrders = getLocalOrders();
  for (const o of localOrders) {
    const raw = (o.order_number || '').replace(/[^0-9]/g, '');
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num > maxExistingNum) maxExistingNum = num;
  }

  // 3. PENGAMAN NOMOR URUT (Safety Baseline):
  // Bazar sudah berjalan dan pesanan di database cloud sudah mencapai minimal #016 (Bu Anya).
  // Dengan pengaman ini, nomor antrean TIDAK AKAN PERNAH ter-reset kembali ke #001.
  if (maxExistingNum < 16) {
    maxExistingNum = 16;
  }

  const nextNum = maxExistingNum + 1;
  const orderNumber = `#${String(nextNum).padStart(3, '0')}`;

  const cleanName = (customerName || '').trim();
  const cleanClass = (customerClass || '').trim();
  const cleanPhone = (customerPhone || '').trim();
  const isDelivery = deliveryType === 'delivery';

  // Format Nama: misal "Chandra (XI RPL 2)"
  const formattedCustomerName = cleanClass ? `${cleanName} (${cleanClass})` : cleanName;

  // Format Catatan: "[🛵 Diantar ke Kelas] [WA: 081234567890] Catatan..."
  const deliveryBadgeText = isDelivery ? '[🛵 Diantar ke Kelas]' : '[🚶 Ambil di Kasir]';
  const waBadgeText = cleanPhone ? `[WA: ${cleanPhone}]` : '';
  const rawNotes = (notes || '').trim();
  const fullNotes = `${deliveryBadgeText} ${waBadgeText} ${rawNotes}`.trim();

  const newOrder = {
    id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    order_number: orderNumber,
    customer_name: formattedCustomerName,
    customer_class: cleanClass,
    customer_phone: cleanPhone,
    delivery_type: isDelivery ? 'delivery' : 'pickup',
    notes: fullNotes,
    display_notes: rawNotes,
    items: items,
    total_price: totalPrice,
    payment_method: paymentMethod || 'Tunai',
    status: 'pending',
    cash_given: null,
    change_amount: null,
    created_at: new Date().toISOString()
  };

  // Kurangi stok menu secara efisien (fetch menu cukup 1x saja, jangan loop fetch)
  try {
    const menus = await fetchMenus();
    for (const item of items) {
      const targetMenu = menus.find(m => m.id === item.id);
      if (targetMenu) {
        const remainingStock = Math.max(0, targetMenu.stock - item.qty);
        updateMenuStock(item.id, remainingStock).catch(e => console.warn('Stok update async warning:', e));
      }
    }
  } catch (err) {
    console.warn('Gagal sinkron stok menu:', err);
  }

  // Simpan ke Supabase Cloud dengan proteksi timeout agar tidak pernah stuck loading
  if (supabase) {
    try {
      const supabasePayload = {
        id: newOrder.id,
        order_number: newOrder.order_number,
        customer_name: newOrder.customer_name,
        notes: newOrder.notes,
        items: newOrder.items,
        total_price: newOrder.total_price,
        payment_method: newOrder.payment_method,
        status: newOrder.status,
        cash_given: newOrder.cash_given,
        change_amount: newOrder.change_amount,
        created_at: newOrder.created_at
      };
      
      const insertPromise = supabase.from('orders').insert([supabasePayload]);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Supabase insert timeout')), 4500));
      
      const { error } = await Promise.race([insertPromise, timeoutPromise]);
      if (error) {
        console.error('Supabase insert error:', error);
      }
    } catch (err) {
      console.warn('Gagal insert order Supabase (fallback ke lokal):', err);
    }
  }

  // Simpan ke localStorage lokal agar offline tetap aman
  const currentLocal = getLocalOrders();
  const updatedOrders = [newOrder, ...currentLocal.filter(o => o.id !== newOrder.id)];
  localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updatedOrders));

  if (channel) {
    channel.postMessage({ type: 'NEW_ORDER', order: newOrder });
  }

  return newOrder;
};

export const updateOrderStatus = async (orderId, newStatus, extraData = {}) => {
  // Jika status dibatalkan (cancelled), kembalikan kuantiti stok setiap menu yang dipesan
  if (newStatus === 'cancelled') {
    const allOrders = await fetchOrders();
    const targetOrder = allOrders.find(o => o.id === orderId);

    // Pastikan order ditemukan dan sebelumnya belum cancelled (mencegah double refund)
    if (targetOrder && targetOrder.status !== 'cancelled' && Array.isArray(targetOrder.items)) {
      for (const item of targetOrder.items) {
        if (item.id && item.qty) {
          await quickAddStock(item.id, Number(item.qty));
        }
      }
    }
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const payload = { status: newStatus };
      if (extraData.notes !== undefined) payload.notes = extraData.notes;
      if (extraData.cash_given !== undefined) payload.cash_given = extraData.cash_given;
      if (extraData.change_amount !== undefined) payload.change_amount = extraData.change_amount;

      await supabase
        .from('orders')
        .update(payload)
        .eq('id', orderId);
    } catch (err) {
      console.warn('Gagal update status Supabase:', err);
    }
  }

  const local = getLocalOrders();
  const updated = local.map(o => o.id === orderId ? parseOrder({ ...o, status: newStatus, ...extraData }) : o);
  localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated));

  if (channel) {
    channel.postMessage({ type: 'ORDER_STATUS_CHANGED', orderId, status: newStatus, extraData });
  }

  return updated;
};

export const toggleQrisValidation = async (orderId, isValidated) => {
  const allOrders = await fetchOrders();
  const target = allOrders.find(o => o.id === orderId);
  if (!target) return;

  let currentNotes = target.notes || '';
  if (isValidated) {
    if (!currentNotes.includes('[QRIS_LUNAS]')) {
      currentNotes = `${currentNotes} [QRIS_LUNAS]`.trim();
    }
  } else {
    currentNotes = currentNotes.replace(/\[QRIS_LUNAS\]/g, '').trim();
  }

  const extraData = {
    notes: currentNotes,
    qris_validated: isValidated,
    payment_status: isValidated ? 'paid' : 'pending'
  };

  return await updateOrderStatus(orderId, target.status, extraData);
};

export const markOrderWaNotified = async (orderId) => {
  const allOrders = await fetchOrders();
  const target = allOrders.find(o => o.id === orderId);
  if (!target) return;

  let currentNotes = target.notes || '';
  if (!currentNotes.includes('[WA_NOTIFIED]')) {
    currentNotes = `${currentNotes} [WA_NOTIFIED]`.trim();
  }

  const extraData = {
    notes: currentNotes,
    is_wa_notified: true
  };

  return await updateOrderStatus(orderId, target.status, extraData);
};

export const deleteOrder = async (orderId) => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('orders').delete().eq('id', orderId);
    } catch (err) {
      console.warn('Gagal delete order Supabase:', err);
    }
  }

  const local = getLocalOrders();
  const updated = local.filter(o => o.id !== orderId);
  localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated));

  if (channel) {
    channel.postMessage({ type: 'ORDER_DELETED', orderId });
  }

  return updated;
};

export const clearAllOrders = async () => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('orders').delete().neq('id', 'placeholder_keep_all');
    } catch (err) {
      console.warn('Gagal clear all orders Supabase:', err);
    }
  }

  localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify([]));

  if (channel) {
    channel.postMessage({ type: 'ALL_ORDERS_CLEARED' });
  }

  return [];
};

// ==================== EXPENSES / MODAL CRUD ====================
export const getLocalExpenses = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_EXPENSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const fetchExpenses = async () => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return data;
      }
    } catch {
      // Fallback ke localStorage jika tabel expenses belum dibuat di Supabase
    }
  }
  return getLocalExpenses();
};

export const createExpense = async ({ title, category, amount, notes }) => {
  const newExpense = {
    id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: (title || '').trim(),
    category: category || 'Bahan Baku',
    amount: Math.max(0, parseInt(amount) || 0),
    notes: (notes || '').trim(),
    created_at: new Date().toISOString()
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('expenses').insert([newExpense]);
    } catch {
      // Graceful fallback jika tabel belum ada
    }
  }

  const local = getLocalExpenses();
  const updated = [newExpense, ...local];
  localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(updated));

  if (channel) {
    channel.postMessage({ type: 'EXPENSES_UPDATE' });
  }

  return newExpense;
};

export const deleteExpense = async (id) => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('expenses').delete().eq('id', id);
    } catch {
      // Graceful fallback
    }
  }

  const local = getLocalExpenses();
  const updated = local.filter(e => e.id !== id);
  localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(updated));

  if (channel) {
    channel.postMessage({ type: 'EXPENSES_UPDATE' });
  }

  return updated;
};

export const clearAllExpenses = async () => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('expenses').delete().neq('id', 'placeholder_keep_all');
    } catch {
      // Graceful fallback
    }
  }

  localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify([]));

  if (channel) {
    channel.postMessage({ type: 'EXPENSES_UPDATE' });
  }

  return [];
};

// ==================== REALTIME SUBSCRIPTIONS ====================
export const subscribeToData = (onOrderChange, onMenuChange, onExpenseChange) => {
  const supabase = getSupabase();
  let supabaseSub = null;

  if (supabase) {
    try {
      supabaseSub = supabase
        .channel('cepatkanbayar_realtime_all')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            if (onOrderChange) onOrderChange(payload);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'menus' },
          (payload) => {
            if (onMenuChange) onMenuChange(payload);
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'expenses' },
          (payload) => {
            if (onExpenseChange) onExpenseChange(payload);
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('Error connecting Supabase realtime:', e);
    }
  }

  const handleBroadcast = (event) => {
    const { data } = event;
    if (!data) return;
    if (
      data.type === 'NEW_ORDER' || 
      data.type === 'ORDER_STATUS_CHANGED' ||
      data.type === 'ORDER_DELETED' ||
      data.type === 'ALL_ORDERS_CLEARED'
    ) {
      if (onOrderChange) onOrderChange(data);
    }
    if (data.type === 'MENU_UPDATE') {
      if (onMenuChange) onMenuChange(data);
    }
    if (data.type === 'EXPENSES_UPDATE') {
      if (onExpenseChange) onExpenseChange(data);
    }
  };

  if (channel) {
    channel.addEventListener('message', handleBroadcast);
  }

  return () => {
    if (supabaseSub && supabase) {
      supabase.removeChannel(supabaseSub);
    }
    if (channel) {
      channel.removeEventListener('message', handleBroadcast);
    }
  };
};

// ==================== VOTE STAND CONFIG ====================
const LOCAL_STORAGE_VOTE_URL_KEY = 'cepatkanbayar_vote_stand_url';
export const DEFAULT_VOTE_URL = 'https://evoting.smkn1pbg.sch.id/';

export const getVoteUrl = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_VOTE_URL_KEY);
    // Jika masih berisi link placeholder google form lama, migrasi otomatis ke URL E-Voting resmi sekolah
    if (!saved || saved.includes('forms.gle') || saved.includes('cepatkanbayar-vote')) {
      localStorage.setItem(LOCAL_STORAGE_VOTE_URL_KEY, DEFAULT_VOTE_URL);
      return DEFAULT_VOTE_URL;
    }
    return saved.trim() || DEFAULT_VOTE_URL;
  } catch {
    return DEFAULT_VOTE_URL;
  }
};

export const setVoteUrl = (url) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_VOTE_URL_KEY, url.trim());
  } catch {}
};
