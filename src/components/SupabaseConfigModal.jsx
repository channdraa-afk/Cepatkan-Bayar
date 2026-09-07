import React, { useState, useEffect } from 'react';
import { X, Database, Check, AlertCircle, RefreshCw, Key, Globe, Shield } from 'lucide-react';
import { getSavedSupabaseConfig, saveSupabaseConfig, isSupabaseConfigured } from '../lib/supabase';
import { sound } from '../lib/audio';

export default function SupabaseConfigModal({ isOpen, onClose, onConfigSaved }) {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getSavedSupabaseConfig();
      setUrl(current.url || '');
      setKey(current.key || '');
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    sound.playComplete();
    saveSupabaseConfig(url, key);
    setSavedSuccess(true);
    if (onConfigSaved) onConfigSaved();
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleResetToLocal = () => {
    sound.playRemove();
    saveSupabaseConfig('', '');
    setUrl('');
    setKey('');
    if (onConfigSaved) onConfigSaved();
  };

  const isConnected = isSupabaseConfigured();

  return (
    <div className="fixed inset-0 z-50 bg-espresso/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-cream border-2 border-espresso rounded-2xl shadow-tactile-lg p-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-espresso pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-caramel border border-espresso flex items-center justify-center text-cream">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-espresso">Konfigurasi Supabase</h3>
              <p className="text-[11px] font-bold text-espresso/60">Sinkronisasi pesanan multi-device realtime</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-7 h-7 rounded-lg bg-cream border border-espresso flex items-center justify-center text-espresso hover:bg-cream-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Mode */}
        <div className={`p-3 rounded-xl border-2 mb-4 text-xs font-bold flex items-center gap-2 ${
          isConnected
            ? 'bg-sage-100 border-sage-600 text-espresso'
            : 'bg-cream-100 border-espresso/40 text-espresso'
        }`}>
          {isConnected ? (
            <>
              <Check className="w-4 h-4 text-sage-700 shrink-0" />
              <span>Terhubung ke Supabase Cloud (Realtime Multi-Device Aktif)</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-caramel shrink-0" />
              <span>Mode Demo Lokal (Tersimpan di Browser Stand). Masukkan URL & Key untuk multi-device.</span>
            </>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div>
            <label className="block font-black text-espresso uppercase mb-1 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> Project URL Supabase
            </label>
            <input
              type="url"
              placeholder="https://abcdefghijklm.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-espresso bg-white font-mono text-xs text-espresso focus:outline-none focus:ring-2 focus:ring-caramel shadow-tactile-sm"
            />
          </div>

          <div>
            <label className="block font-black text-espresso uppercase mb-1 flex items-center gap-1">
              <Key className="w-3.5 h-3.5" /> Anon Public API Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-espresso bg-white font-mono text-xs text-espresso focus:outline-none focus:ring-2 focus:ring-caramel shadow-tactile-sm"
            />
          </div>

          <div className="p-2.5 bg-cream-100 rounded-xl border border-espresso/20 text-[11px] text-espresso/70 leading-relaxed font-bold">
            💡 <strong>Tips Cepat:</strong> Skema database sudah disiapkan di file <code className="bg-cream px-1 py-0.5 rounded border border-espresso/30">supabase-schema.sql</code>. Cukup copy & jalankan di SQL Editor Supabase!
          </div>

          {savedSuccess && (
            <div className="p-2 bg-sage-200 border border-sage-600 rounded-lg text-center font-black text-espresso">
              ✓ Konfigurasi Berhasil Disimpan!
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleResetToLocal}
              className="btn-tactile-cream flex-1 py-2 text-xs font-bold"
            >
              Gunakan Lokal
            </button>
            <button
              type="submit"
              className="btn-tactile-primary flex-1 py-2 text-xs font-black"
            >
              Simpan Koneksi
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
