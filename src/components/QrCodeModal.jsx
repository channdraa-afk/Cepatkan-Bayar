import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, QrCode, Download, Printer, Copy, Check, Banknote, Globe } from 'lucide-react';
import { sound } from '../lib/audio';

export default function QrCodeModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('web'); // 'web' | 'qris'
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);
  
  if (!isOpen) return null;

  // Kunci ke domain publik produksi agar pembeli TIDAK dimintai login Vercel
  const targetUrl = 'https://cepatkan-bayar.vercel.app';

  const handleCopy = () => {
    sound.playClick();
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadWebQr = () => {
    sound.playClick();
    if (canvasRef.current) {
      const pngUrl = canvasRef.current.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'qr-menu-stand-cepatkan-bayar.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const handlePrint = () => {
    sound.playClick();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-espresso/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="relative w-full max-w-sm bg-cream border-2 border-espresso rounded-2xl shadow-tactile-lg overflow-hidden text-center p-5 sm:p-6">
        
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

        {/* Tab Toggle: QR Web vs QRIS Pembayaran */}
        <div className="flex bg-cream-100 border-2 border-espresso rounded-xl p-1 gap-1 mb-4 mt-2">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('web');
            }}
            className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 ${
              activeTab === 'web'
                ? 'bg-caramel text-cream shadow-tactile-sm'
                : 'text-espresso/70 hover:text-espresso'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> QR Menu
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('qris');
            }}
            className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1 ${
              activeTab === 'qris'
                ? 'bg-caramel text-cream shadow-tactile-sm'
                : 'text-espresso/70 hover:text-espresso'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" /> QRIS Stand
          </button>
        </div>

        {activeTab === 'web' ? (
          /* ================= TAB 1: QR CODE WEB STAND ================= */
          <div>
            <h3 className="text-lg font-black text-espresso mb-1">Scan Untuk Memesan</h3>
            <p className="text-xs text-espresso/70 font-bold mb-3">
              Tunjukkan layar ini ke pembeli atau tempel di akrilik meja
            </p>

            <div className="p-3.5 bg-white border-2 border-espresso rounded-2xl shadow-tactile inline-block mx-auto mb-3">
              <QRCodeCanvas
                ref={canvasRef}
                value={targetUrl}
                size={180}
                level="H"
                includeMargin={false}
                fgColor="#4E220F"
                bgColor="#FFFFFF"
              />
            </div>

            <p className="text-[11px] font-mono font-bold text-espresso/80 truncate mb-3 bg-cream-100 p-2 rounded-lg border border-espresso/20">
              {targetUrl}
            </p>

            <div className="flex flex-col gap-2">
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
                  className="btn-tactile-cream flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Cetak QR
                </button>
              </div>

              <button
                onClick={handleDownloadWebQr}
                className="btn-tactile-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5 font-black shadow-tactile"
              >
                <Download className="w-4 h-4" /> Unduh Gambar QR (PNG)
              </button>
            </div>
          </div>
        ) : (
          /* ================= TAB 2: QRIS PEMBAYARAN STAND ================= */
          <div>
            <h3 className="text-lg font-black text-espresso mb-1">QRIS Resmi Stand Bazar</h3>
            <p className="text-xs text-espresso/70 font-bold mb-3">
              Pembeli bisa langsung scan untuk transfer pembayaran
            </p>

            <div className="p-2.5 bg-white border-2 border-espresso rounded-2xl shadow-tactile inline-block mx-auto mb-3">
              <img
                src="/qris.png"
                alt="QRIS Stand"
                className="max-h-60 w-auto mx-auto rounded-xl object-contain"
              />
            </div>

            <div className="flex gap-2">
              <a
                href="/qris.png"
                download="qris-stand-bazar.png"
                className="btn-tactile-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5 font-black shadow-tactile"
              >
                <Download className="w-4 h-4" /> Unduh QRIS
              </a>
              <button
                onClick={handlePrint}
                className="btn-tactile-cream flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5 font-bold"
              >
                <Printer className="w-4 h-4" /> Cetak QRIS
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
