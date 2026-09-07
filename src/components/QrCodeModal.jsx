import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, QrCode, Download, Printer, Copy, Check } from 'lucide-react';
import { sound } from '../lib/audio';

export default function QrCodeModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  
  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cepatkanbayar.vercel.app';

  const handleCopy = () => {
    sound.playClick();
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    sound.playClick();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-espresso/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-cream border-2 border-espresso rounded-2xl shadow-tactile-lg overflow-hidden text-center p-6">
        
        {/* Close button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute right-3 top-3 w-8 h-8 rounded-lg bg-cream border border-espresso flex items-center justify-center text-espresso hover:bg-cream-100"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-caramel/10 border border-espresso text-espresso text-xs font-black mb-2">
          <QrCode className="w-3.5 h-3.5 text-caramel" /> QR Code Stand Bazar
        </div>
        <h3 className="text-xl font-black text-espresso mb-1">Scan Untuk Memesan</h3>
        <p className="text-xs text-espresso/70 font-bold mb-4">
          Tunjukkan layar ini ke pembeli atau tempel di meja stand
        </p>

        {/* QR Code Container */}
        <div className="p-4 bg-white border-2 border-espresso rounded-2xl shadow-tactile inline-block mx-auto mb-4">
          <QRCodeSVG
            value={currentUrl}
            size={190}
            level="H"
            includeMargin={false}
            fgColor="#4E220F" // Deep espresso
            bgColor="#FFFFFF"
          />
        </div>

        <p className="text-xs font-mono font-bold text-espresso/80 truncate mb-4 bg-cream-100 p-2 rounded-lg border border-espresso/20">
          {currentUrl}
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="btn-tactile-cream flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-sage-700" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Tersalin!' : 'Salin Link'}
          </button>
          <button
            onClick={handlePrint}
            className="btn-tactile-primary flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Cetak QR
          </button>
        </div>

      </div>
    </div>
  );
}
