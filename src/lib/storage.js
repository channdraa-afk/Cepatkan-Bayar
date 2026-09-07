import { getSupabase, isSupabaseConfigured } from './supabase';
import { INITIAL_MENUS } from '../data/initialMenu';

const LOCAL_STORAGE_MENUS_KEY = 'cepatkanbayar_menus_local';
const LOCAL_STORAGE_ORDERS_KEY = 'cepatkanbayar_orders_local';

// Cross-tab broadcast channel for local development and offline mode
const channel = typeof window !== 'undefined' && window.BroadcastChannel 
  ? new BroadcastChannel('cepatkanbayar_sync') 
  : null;

// ==================== MENUS ====================
export const getLocalMenus = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_MENUS_KEY);
    if (!data) {
      localStorage.setItem(LOCAL_STORAGE_MENUS_KEY, JSON.stringify(INITIAL_MENUS));
      return INITIAL_MENUS;
    }
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_MENUS;
  }
};

export const fetchMenus = async () => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('menus').select('*').order('id');
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('Gagal fetch Supabase menus, fallback ke lokal:', err);
    }
  }
  return getLocalMenus();
};

export const updateMenuStock = async (id, newStock) => {
  const finalStock = Math.max(0, parseInt(newStock) || 0);
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('menus').update({ stock: finalStock }).eq('id', id);
    } catch (err) {
      console.warn('Gagal update stock Supabase:', err);
    }
  }

  // Simpan juga ke local
  const local = getLocalMenus();
  const updated = local.map(m => m.id === id ? { ...m, stock: finalStock } : m);
  localStorage.setItem(LOCAL_STORAGE_MENUS_KEY, JSON.stringify(updated));
  if (channel) channel.postMessage({ type: 'MENU_UPDATE', id, stock: finalStock });
  return updated;
};

export const quickAddStock = async (id, amount) => {
  const local = getLocalMenus();
  const item = local.find(m => m.id === id);
  const currentStock = item ? item.stock : 0;
  return await updateMenuStock(id, currentStock + amount);
};

// ==================== ORDERS ====================
export const getLocalOrders = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
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
      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('Gagal fetch Supabase orders, fallback ke lokal:', err);
    }
  }
  return getLocalOrders();
};

export const createOrder = async ({ customerName, notes, items, totalPrice, paymentMethod }) => {
  // Hitung nomor antrean
  const currentOrders = await fetchOrders();
  const nextNum = currentOrders.length + 1;
  const orderNumber = `#${String(nextNum).padStart(3, '0')}`;

  const newOrder = {
    id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    order_number: orderNumber,
    customer_name: customerName.trim(),
    notes: (notes || '').trim(),
    items: items, // [{ id, name, price, qty }]
    total_price: totalPrice,
    payment_method: paymentMethod || 'Tunai',
    status: 'pending', // 'pending' | 'cooking' | 'completed' | 'cancelled'
    cash_given: null,
    change_amount: null,
    created_at: new Date().toISOString()
  };

  // Kurangi stok untuk tiap menu yang dipesan
  for (const item of items) {
    const menus = await fetchMenus();
    const targetMenu = menus.find(m => m.id === item.id);
    if (targetMenu) {
      const remainingStock = Math.max(0, targetMenu.stock - item.qty);
      await updateMenuStock(item.id, remainingStock);
    }
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from('orders').insert([newOrder]);
      if (error) console.error('Supabase insert error:', error);
    } catch (err) {
      console.warn('Gagal insert order Supabase:', err);
    }
  }

  // Simpan ke local storage
  const localOrders = getLocalOrders();
  const updatedOrders = [newOrder, ...localOrders];
  localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updatedOrders));

  if (channel) {
    channel.postMessage({ type: 'NEW_ORDER', order: newOrder });
  }

  return newOrder;
};

export const updateOrderStatus = async (orderId, newStatus, extraData = {}) => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase
        .from('orders')
        .update({ status: newStatus, ...extraData })
        .eq('id', orderId);
    } catch (err) {
      console.warn('Gagal update status Supabase:', err);
    }
  }

  // Update local
  const local = getLocalOrders();
  const updated = local.map(o => o.id === orderId ? { ...o, status: newStatus, ...extraData } : o);
  localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(updated));

  if (channel) {
    channel.postMessage({ type: 'ORDER_STATUS_CHANGED', orderId, status: newStatus, extraData });
  }

  return updated;
};

// ==================== REALTIME SUBSCRIPTIONS ====================
export const subscribeToData = (onOrderChange, onMenuChange) => {
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
        .subscribe();
    } catch (e) {
      console.warn('Error connecting Supabase realtime:', e);
    }
  }

  // Cross-tab broadcast channel listener for local testing
  const handleBroadcast = (event) => {
    const { data } = event;
    if (!data) return;
    if (data.type === 'NEW_ORDER' || data.type === 'ORDER_STATUS_CHANGED') {
      if (onOrderChange) onOrderChange(data);
    }
    if (data.type === 'MENU_UPDATE') {
      if (onMenuChange) onMenuChange(data);
    }
  };

  if (channel) {
    channel.addEventListener('message', handleBroadcast);
  }

  // Return cleanup function
  return () => {
    if (supabaseSub && supabase) {
      supabase.removeChannel(supabaseSub);
    }
    if (channel) {
      channel.removeEventListener('message', handleBroadcast);
    }
  };
};
