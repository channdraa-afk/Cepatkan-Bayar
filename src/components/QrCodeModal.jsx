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

  const handleDownloadWebQr = async (type = 'png') => {
    sound.playClick();
    try {
      const fileUrl = type === 'svg' ? '/qr-stand-vector.svg' : '/qr-stand-poster.png';
      const fileName = type === 'svg' ? 'qr-stand-vector-hd.svg' : 'qr-stand-poster-hd.png';
      const res = await fetch(fileUrl);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (e) {
      if (canvasRef.current) {
        const pngUrl = canvasRef.current.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = 'qr-menu-stand-cepatkan-bayar.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    }
  };

  const handleDownloadPoster = async () => {
    sound.playClick();
    try {
      const res = await fetch('/stand-bazar-poster.png');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = 'poster-stand-bazar-a4.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (e) {
      window.open('/stand-bazar-poster.png', '_blank');
    }
  };

  const handleDownloadQris = async () => {
    sound.playClick();
    try {
      const res = await fetch('/qris.png');
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = 'qris-stand-bazar.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    } catch (e) {
      window.open('/qris.png', '_blank');
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

            <div className="p-3 bg-white border-2 border-espresso rounded-2xl shadow-tactile inline-block mx-auto mb-3">
              <QRCodeCanvas
                ref={canvasRef}
                value={targetUrl}
                size={180}
                level="H"
                includeMargin={true}
                marginSize={3}
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

              {/* Unduh QR PNG High-Res */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleDownloadWebQr('png')}
                  className="btn-tactile-primary py-2 text-xs flex items-center justify-center gap-1 font-black shadow-tactile-sm"
                  title="Unduh QR resolusi tinggi 1200x1200px format PNG dengan margin rapi"
                >
                  <Download className="w-3.5 h-3.5" /> QR Poster (PNG)
                </button>
                <button
                  onClick={() => handleDownloadWebQr('svg')}
                  className="btn-tactile-sage py-2 text-xs flex items-center justify-center gap-1 font-black shadow-tactile-sm"
                  title="Unduh format vektor SVG untuk diedit di Canva / Photoshop tanpa pecah"
                >
                  <Download className="w-3.5 h-3.5" /> Vektor (SVG)
                </button>
              </div>

              {/* Unduh Poster Stand Bazar Lengkap */}
              <button
                onClick={handleDownloadPoster}
                className="py-2.5 px-3 bg-amber-400 text-espresso border-2 border-espresso rounded-xl text-xs font-black shadow-tactile hover:brightness-105 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5"
                title="Unduh poster stand A4 siap cetak & pasang di meja"
              >
                <span>📄 Unduh Poster Meja Siap Cetak (A4)</span>
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
              <button
                type="button"
                onClick={handleDownloadQris}
                className="btn-tactile-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5 font-black shadow-tactile"
              >
                <Download className="w-4 h-4" /> Unduh QRIS
              </button>
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
