/**
 * WhatsApp Notification & Chatbot Utility for Stand Bazar CepatkanBayar
 * Mendukung 2 mode:
 * 1. Mode Direct WhatsApp (1-klik wa.me, 100% gratis, tanpa backend, langsung terisi teks ramah)
 * 2. Mode Automated Background Bot (via Fonnte API Token opsional yang disimpan di browser kasir)
 */

import { formatRupiah } from '../components/MenuCard';

const FONNTE_TOKEN_STORAGE_KEY = 'cepatkanbayar_fonnte_token';
const STAND_NAME = 'Stand Bazar CepatkanBayar';

/**
 * Normalisasi nomor HP ke format WhatsApp internasional (awalan 62)
 * Contoh: '081234567890' -> '6281234567890'
 *         '+62 812-3456-7890' -> '6281234567890'
 *         '81234567890' -> '6281234567890'
 */
export function normalizeWaNumber(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Menghasilkan pesan notifikasi WhatsApp yang ramah, sopan, dan rapi
 */
export function createPickupMessage(order) {
  if (!order) return '';

  const customerName = order.customer_name || 'Kakak';
  const customerClass = order.customer_class ? ` (${order.customer_class})` : '';
  const orderNumber = order.order_number || '-';
  const totalPrice = formatRupiah(order.total_price || 0);
  const paymentMethod = order.payment_method || 'Tunai';

  const itemsList = Array.isArray(order.items) && order.items.length > 0
    ? order.items.map(item => `  • ${item.qty}× ${item.name}`).join('\n')
    : '  • (Detail menu pesanan)';

  const isDelivery = order.delivery_type === 'delivery' || 
    (order.notes && order.notes.includes('🛵 Diantar'));

  const instructions = isDelivery
    ? '🛵 *Tim kami sedang dalam perjalanan mengantar pesanan ke kelasmu yaa.*'
    : '🚶 *Yuk langsung menuju ke meja kasir stand untuk ambil pesananmu.*';

  return [
    `Halo kak *${customerName}*${customerClass}! 👋`,
    `Pesananmu di *${STAND_NAME}* sudah *SIAP DIAMBIL* nih! 🥤✨`,
    '',
    `📋 *Rincian Pesanan #${orderNumber}:*`,
    itemsList,
    '',
    `💰 *Total:* ${totalPrice} (${paymentMethod})`,
    '',
    instructions,
    '',
    'Ditunggu kedatangannya yaa kak, terima kasih banyak! 🙏😊'
  ].join('\n');
}

/**
 * Ambil token Fonnte dari LocalStorage
 */
export function getFonnteToken() {
  try {
    return localStorage.getItem(FONNTE_TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Simpan token Fonnte ke LocalStorage
 */
export function setFonnteToken(token) {
  try {
    if (!token || !token.trim()) {
      localStorage.removeItem(FONNTE_TOKEN_STORAGE_KEY);
    } else {
      localStorage.setItem(FONNTE_TOKEN_STORAGE_KEY, token.trim());
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Mengirim notifikasi WhatsApp "Pesanan Siap Diambil":
 * - Jika ada Token Fonnte tersimpan: Kirim via HTTP API background.
 * - Jika tidak ada / fetch gagal: Buka browser wa.me secara direct (1-klik pesan terisi otomatis).
 */
export async function sendPickupNotification(order) {
  const phone = order.customer_phone;
  const normalizedPhone = normalizeWaNumber(phone);

  if (!normalizedPhone || normalizedPhone.length < 9) {
    return {
      success: false,
      reason: 'Nomor WhatsApp pembeli tidak valid atau kosong.'
    };
  }

  const messageText = createPickupMessage(order);
  const token = getFonnteToken();

  // Mode 1: Jika ada Fonnte Token, kirim via background API
  if (token) {
    try {
      const formData = new FormData();
      formData.append('target', normalizedPhone);
      formData.append('message', messageText);
      formData.append('countryCode', '62');

      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: token
        },
        body: formData
      });

      const result = await response.json();
      if (result.status === true) {
        return {
          success: true,
          method: 'fonnte',
          message: 'Notifikasi otomatis terkirim via Bot WhatsApp di background!'
        };
      } else {
        console.warn('Fonnte API response error:', result);
        // Fallback jika API Fonnte gagal/kuota habis: buka wa.me
        window.open(`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(messageText)}`, '_blank');
        return {
          success: true,
          method: 'wa.me_fallback',
          message: `Fonnte: ${result.reason || 'dialihkan ke WhatsApp Web/App'}`
        };
      }
    } catch (err) {
      console.warn('Gagal koneksi ke Fonnte API, dialihkan ke WhatsApp langsung:', err);
      window.open(`https://wa.me/${normalizedPhone}?text=${encodeURIComponent(messageText)}`, '_blank');
      return {
        success: true,
        method: 'wa.me_fallback',
        message: 'Koneksi bot gagal, dialihkan ke WhatsApp langsung.'
      };
    }
  }

  // Mode 2 (Default): Direct 1-Click WhatsApp via wa.me
  const waUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(messageText)}`;
  window.open(waUrl, '_blank');

  return {
    success: true,
    method: 'wa.me',
    message: 'WhatsApp terbuka dengan teks siap kirim!'
  };
}

/**
 * Uji coba koneksi / token Fonnte
 */
export async function testFonnteToken(token, testPhone) {
  const normalized = normalizeWaNumber(testPhone);
  if (!normalized || normalized.length < 9) {
    return { success: false, reason: 'Masukkan nomor HP penerima uji coba yang valid (contoh: 08123456789).' };
  }

  if (!token || !token.trim()) {
    return { success: false, reason: 'Token Fonnte belum diisi.' };
  }

  try {
    const formData = new FormData();
    formData.append('target', normalized);
    formData.append('message', `Halo! Ini adalah pesan uji coba dari *${STAND_NAME}* 🚀✨\nBot WhatsApp berhasil terhubung!`);
    formData.append('countryCode', '62');

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: token.trim()
      },
      body: formData
    });

    const result = await response.json();
    if (result.status === true) {
      return { success: true, message: 'Berhasil! Pesan uji coba terkirim ke WhatsApp kamu.' };
    } else {
      return { success: false, reason: result.reason || 'Token tidak valid atau device Fonnte belum connect.' };
    }
  } catch (err) {
    return { success: false, reason: 'Gagal menghubungi server Fonnte: ' + err.message };
  }
}
