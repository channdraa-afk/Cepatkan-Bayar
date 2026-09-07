import { createClient } from '@supabase/supabase-js';

// Ambil kredensial dari environment variable (.env) atau dari LocalStorage (jika disetel lewat UI Kasir)
const getCredentials = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const savedUrl = typeof window !== 'undefined' ? localStorage.getItem('cepatkanbayar_supabase_url') : null;
  const savedKey = typeof window !== 'undefined' ? localStorage.getItem('cepatkanbayar_supabase_key') : null;

  return {
    url: (savedUrl && savedUrl.trim()) || (envUrl && envUrl.trim()) || '',
    key: (savedKey && savedKey.trim()) || (envKey && envKey.trim()) || '',
  };
};

let supabaseClient = null;

export const getSupabase = () => {
  const { url, key } = getCredentials();
  if (url && key && url.startsWith('http')) {
    if (!supabaseClient) {
      supabaseClient = createClient(url, key);
    }
    return supabaseClient;
  }
  return null;
};

export const isSupabaseConfigured = () => {
  const { url, key } = getCredentials();
  return Boolean(url && key && url.startsWith('http'));
};

export const saveSupabaseConfig = (url, key) => {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem('cepatkanbayar_supabase_url', url.trim());
    else localStorage.removeItem('cepatkanbayar_supabase_url');

    if (key) localStorage.setItem('cepatkanbayar_supabase_key', key.trim());
    else localStorage.removeItem('cepatkanbayar_supabase_key');

    supabaseClient = null; // reset client
  }
};

export const getSavedSupabaseConfig = () => {
  return getCredentials();
};
