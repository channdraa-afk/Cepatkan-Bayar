import { getSupabase, isSupabaseConfigured } from './supabase';
import { INITIAL_MENUS } from '../data/initialMenu';

const LOCAL_STORAGE_MENUS_KEY = 'cepatkanbayar_menus_local';
const LOCAL_STORAGE_ORDERS_KEY = 'cepatkanbayar_orders_local';

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
  } catch (e) {
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

// Helper untuk membaca dan mengekstrak nomor telepon jika tersimpan di catatan
const parseOrder = (order) => {
  if (!order) return order;
  let phone = order.customer_phone || '';
  let notes = order.notes || '';
  if (!phone && notes.includes('[WA:')) {
    const match = notes.match(/\[WA:\s*([^\]]+)\]/);
    if (match) {
      phone = match[1].trim();
    }
  }
  return {
    ...order,
    customer_phone: phone
  };
};

// ==================== ORDERS ====================
export const getLocalOrders = () => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    const parsed = data ? JSON.parse(data) : [];
    return parsed.map(parseOrder);
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
        return data.map(parseOrder);
      }
    } catch (err) {
      console.warn('Gagal fetch Supabase orders, fallback ke lokal:', err);
    }
  }
  return getLocalOrders();
};

export const createOrder = async ({ customerName, customerPhone, notes, items, totalPrice, paymentMethod }) => {
  // Hitung nomor antrean
  const currentOrders = await fetchOrders();
  const nextNum = currentOrders.length + 1;
  const orderNumber = `#${String(nextNum).padStart(3, '0')}`;

  const cleanPhone = (customerPhone || '').trim();
  let fullNotes = (notes || '').trim();
  if (cleanPhone) {
    fullNotes = `[WA: ${cleanPhone}] ${fullNotes}`.trim();
  }

  const newOrder = {
    id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    order_number: orderNumber,
    customer_name: customerName.trim(),
    customer_phone: cleanPhone,
    notes: fullNotes,
    items: items,
    total_price: totalPrice,
    payment_method: paymentMethod || 'Tunai',
    status: 'pending',
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
      // Payload yang sesuai dengan kolom tabel orders Supabase
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
      const { error } = await supabase.from('orders').insert([supabasePayload]);
      if (error) console.error('Supabase insert error:', error);
    } catch (err) {
      console.warn('Gagal insert order Supabase:', err);
    }
  }

  const localOrders = getLocalOrders();
  const updatedOrders = [newOrder, ...localOrders];
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
      await supabase
        .from('orders')
        .update({ status: newStatus, ...extraData })
        .eq('id', orderId);
    } catch (err) {
      console.warn('Gagal update status Supabase:', err);
    }
  }

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

  return () => {
    if (supabaseSub && supabase) {
      supabase.removeChannel(supabaseSub);
    }
    if (channel) {
      channel.removeEventListener('message', handleBroadcast);
    }
  };
};
