import React, { useState, useEffect } from 'react';
import { Lock, X, Delete, Utensils } from 'lucide-react';
import { sound } from '../lib/audio';

export default function SecretPinModal({ isOpen, onClose, onSuccess }) {
  const [role, setRole] = useState('cashier'); // 'cashier' | 'chef'
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  // Secure SHA-256 Hash of default cashier PIN
  const DEFAULT_PIN_HASH = '5a85661182e1459ac1c4cf36692329f0ba2c3b5ddcb90b37d5cfe7fb07ca6a27';
  // PIN Khusus Chef Dapur
  const CHEF_PIN = '29012010';

  const sha256 = async (str) => {
    try {
      const utf8 = new TextEncoder().encode(str);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', utf8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return '';
    }
  };

  const verifyPin = async (candidate) => {
    // 1. Cek apakah PIN Chef (29012010)
    if (candidate === CHEF_PIN) {
      sound.playComplete();
      setPin('');
      setError(false);
      onSuccess('chef');
      return;
    }

    // 2. Cek apakah PIN Kasir
    const customPin = import.meta.env.VITE_CASHIER_PIN;
    const candidateHash = await sha256(candidate);
    const isCashierValid = (customPin && candidate === customPin) || (candidateHash === DEFAULT_PIN_HASH);

    if (isCashierValid) {
      sound.playComplete();
      setPin('');
      setError(false);
      onSuccess('cashier');
      return;
    }

    sound.playRemove();
    setError(true);
    setTimeout(() => {
      setPin('');
    }, 700);
  };

  const handleKeyPress = (num) => {
    sound.playClick();
    setPin((prev) => {
      if (prev.length < 8) {
        const nextPin = prev + num;
        setError(false);

        // Auto submit if 8 digits
        if (nextPin.length === 8) {
          verifyPin(nextPin);
        }
        return nextPin;
      }
      return prev;
    });
  };

  const handleDelete = () => {
    sound.playRemove();
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    sound.playClick();
    setPin('');
    setError(false);
  };

  // Keyboard navigation support for laptop / PC
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-espresso/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`relative w-full max-w-xs bg-cream border-2 border-espresso rounded-2xl shadow-tactile-lg p-5 text-center transition-all ${
        error ? 'animate-shake border-rose-600' : ''
      }`}>
        
        {/* Close */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute right-3 top-3 w-7 h-7 rounded-lg bg-cream border border-espresso flex items-center justify-center text-espresso hover:bg-cream-100"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Pilihan Opsi Login: Kasir vs Chef */}
        <div className="flex bg-cream-100 border-2 border-espresso rounded-xl p-1 gap-1 mb-4 mt-2">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setRole('cashier');
              setPin('');
              setError(false);
            }}
            className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              role === 'cashier'
                ? 'bg-caramel text-cream shadow-tactile-sm'
                : 'text-espresso/70 hover:text-espresso'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Kasir Stand
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setRole('chef');
              setPin('');
              setError(false);
            }}
            className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              role === 'chef'
                ? 'bg-caramel text-cream shadow-tactile-sm'
                : 'text-espresso/70 hover:text-espresso'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" /> Dapur / Chef
          </button>
        </div>

        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl bg-caramel border-2 border-espresso flex items-center justify-center mx-auto mb-2 text-cream shadow-tactile-sm">
          {role === 'chef' ? <Utensils className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
        </div>

        <h3 className="text-lg font-black text-espresso">
          {role === 'chef' ? 'Akses Dapur & Chef' : 'Akses Kasir Stand'}
        </h3>
        <p className="text-xs text-espresso/70 mb-4 font-bold">
          {role === 'chef' ? 'Masukkan PIN rahasia chef dapur' : 'Masukkan PIN rahasia kasir'}
        </p>

        {/* 8 PIN Indicators */}
        <div className="flex justify-center gap-2 mb-5">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border-2 border-espresso transition-all ${
                pin.length > idx
                  ? 'bg-caramel scale-110'
                  : 'bg-cream-200'
              } ${error ? 'bg-rose-500 border-rose-700' : ''}`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs font-black text-rose-600 mb-3 animate-pulse">
            PIN Salah! Silakan coba lagi.
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => handleKeyPress(n.toString())}
              className="w-16 h-12 rounded-xl bg-cream-50 border-2 border-espresso text-espresso font-black text-lg shadow-tactile-sm hover:bg-white active:translate-y-1 active:shadow-tactile-pressed transition-all"
            >
              {n}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="w-16 h-12 rounded-xl bg-cream-200 border-2 border-espresso text-espresso/70 font-black text-xs shadow-tactile-sm hover:bg-cream-300 active:translate-y-1 active:shadow-tactile-pressed transition-all"
          >
            C
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            className="w-16 h-12 rounded-xl bg-cream-50 border-2 border-espresso text-espresso font-black text-lg shadow-tactile-sm hover:bg-white active:translate-y-1 active:shadow-tactile-pressed transition-all"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-16 h-12 rounded-xl bg-cream-200 border-2 border-espresso text-espresso font-black flex items-center justify-center shadow-tactile-sm hover:bg-cream-300 active:translate-y-1 active:shadow-tactile-pressed transition-all"
          >
            <Delete className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
