import React, { useState } from 'react';
import { Lock, X, Delete, Check } from 'lucide-react';
import { sound } from '../lib/audio';

export default function SecretPinModal({ isOpen, onClose, onSuccess }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleKeyPress = (num) => {
    sound.playClick();
    if (pin.length < 8) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError(false);

      // Auto submit if 8 digits
      if (nextPin.length === 8) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    sound.playRemove();
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    sound.playClick();
    setPin('');
    setError(false);
  };

  // SHA-256 Hash of default PIN '28012010':
  // 5a85661182e1459ac1c4cf36692329f0ba2c3b5ddcb90b37d5cfe7fb07ca6a27
  const DEFAULT_PIN_HASH = '5a85661182e1459ac1c4cf36692329f0ba2c3b5ddcb90b37d5cfe7fb07ca6a27';

  const sha256 = async (str) => {
    try {
      const utf8 = new TextEncoder().encode(str);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', utf8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      return '';
    }
  };

  const verifyPin = async (candidate) => {
    // Cek env variable custom jika ada, atau bandingkan hash SHA-256
    const customPin = import.meta.env.VITE_CASHIER_PIN;
    const candidateHash = await sha256(candidate);

    const isValid = (customPin && candidate === customPin) || (candidateHash === DEFAULT_PIN_HASH);

    if (isValid) {
      sound.playComplete();
      setPin('');
      setError(false);
      onSuccess();
    } else {
      sound.playRemove();
      setError(true);
      setTimeout(() => {
        setPin('');
      }, 700);
    }
  };

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

        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl bg-caramel border-2 border-espresso flex items-center justify-center mx-auto mb-2 text-cream shadow-tactile-sm">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-black text-espresso">Akses Kasir Bazar</h3>
        <p className="text-xs text-espresso/70 mb-4 font-bold">
          Masukkan PIN rahasia kasir
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
