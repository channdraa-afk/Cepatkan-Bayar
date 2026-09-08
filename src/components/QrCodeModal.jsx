import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { X, Download, Printer, Copy, Check, Banknote, Globe, Star, ExternalLink, Edit2 } from 'lucide-react';
import { sound } from '../lib/audio';
import { getVoteUrl, setVoteUrl } from '../lib/storage';

export default function QrCodeModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('web'); // 'web' | 'qris' | 'vote'
  const [copied, setCopied] = useState(false);
  const [copiedVote, setCopiedVote] = useState(false);
  const [voteUrl, setLocalVoteUrl] = useState(() => getVoteUrl());
  const [isEditingVote, setIsEditingVote] = useState(false);
  const [editInputVal, setEditInputVal] = useState(voteUrl);
  const canvasRef = useRef(null);
  const voteCanvasRef = useRef(null);
  
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
    } catch {
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
    } catch {
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
    } catch {
      window.open('/qris.png', '_blank');
    }
  };

  const handlePrint = () => {
    sound.playClick();
    window.print();
  };

  const handleCopyVote = () => {
    sound.playClick();
    navigator.clipboard.writeText(voteUrl);
    setCopiedVote(true);
    setTimeout(() => setCopiedVote(false), 2000);
  };

  const handleSaveVoteUrl = () => {
    sound.playComplete();
    const clean = editInputVal.trim();
    if (clean) {
      setVoteUrl(clean);
      setLocalVoteUrl(clean);
    }
    setIsEditingVote(false);
  };

  const handleDownloadVoteQr = () => {
    sound.playClick();
    if (voteCanvasRef.current) {
      const pngUrl = voteCanvasRef.current.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'qr-vote-stand-bazar.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
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

        {/* Tab Toggle: QR Menu vs QRIS Pembayaran vs QR Vote */}
        <div className="flex bg-cream-100 border-2 border-espresso rounded-xl p-1 gap-1 mb-4 mt-2">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('web');
            }}
            className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all flex items-center justify-center gap-1 ${
              activeTab === 'web'
                ? 'bg-caramel text-cream shadow-tactile-sm'
                : 'text-espresso/70 hover:text-espresso'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> Menu
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('qris');
            }}
            className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all flex items-center justify-center gap-1 ${
              activeTab === 'qris'
                ? 'bg-caramel text-cream shadow-tactile-sm'
                : 'text-espresso/70 hover:text-espresso'
            }`}
          >
            <Banknote className="w-3.5 h-3.5" /> QRIS
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('vote');
            }}
            className={`flex-1 py-1.5 text-[11px] font-black rounded-lg transition-all flex items-center justify-center gap-1 ${
              activeTab === 'vote'
                ? 'bg-caramel text-cream shadow-tactile-sm'
                : 'text-espresso/70 hover:text-espresso'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400" /> Vote
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
        ) : activeTab === 'qris' ? (
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
        ) : (
          /* ================= TAB 3: QR VOTE STAND BAZAR ================= */
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-espresso text-xs font-black text-amber-950 mb-2 shadow-tactile-sm">
              <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-500" /> Portal E-Voting SMEGA
            </div>
            <h3 className="text-lg font-black text-espresso mb-1">E-Voting Stand Bazar</h3>
            <p className="text-xs text-espresso/70 font-bold mb-3">
              Voting dilakukan langsung di portal web sekolah. Scan QR ini atau klik tombol di bawah untuk langsung membuka web voting!
            </p>

            <div className="p-3 bg-white border-2 border-espresso rounded-2xl shadow-tactile inline-block mx-auto mb-3">
              <QRCodeCanvas
                ref={voteCanvasRef}
                value={voteUrl}
                size={180}
                level="H"
                includeMargin={true}
                marginSize={3}
                fgColor="#4E220F"
                bgColor="#FFFFFF"
              />
            </div>

            {isEditingVote ? (
              <div className="space-y-2 mb-3 bg-cream-100 p-2.5 rounded-xl border border-espresso/20 text-left">
                <label className="text-[10px] font-black text-espresso uppercase block">Link / URL Portal Voting:</label>
                <input
                  type="url"
                  value={editInputVal}
                  onChange={(e) => setEditInputVal(e.target.value)}
                  placeholder="https://evoting.smkn1pbg.sch.id/"
                  className="w-full px-2.5 py-1.5 rounded-lg border-2 border-espresso bg-cream-50 text-xs font-bold text-espresso focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveVoteUrl}
                    className="btn-tactile-primary px-3 py-1 text-xs font-black"
                  >
                    Simpan Link
                  </button>
                  <button
                    onClick={() => {
                      setEditInputVal(voteUrl);
                      setIsEditingVote(false);
                    }}
                    className="btn-tactile-cream px-3 py-1 text-xs font-bold"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-3 bg-cream-100 p-2 rounded-lg border border-espresso/20 flex items-center justify-between gap-2">
                <p className="text-[11px] font-mono font-bold text-espresso/80 truncate text-left flex-1">
                  {voteUrl}
                </p>
                <button
                  onClick={() => setIsEditingVote(true)}
                  className="p-1 rounded bg-cream border border-espresso text-espresso/70 hover:text-espresso shrink-0 flex items-center gap-1 text-[10px] font-bold"
                  title="Ubah URL Link Voting"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Ubah</span>
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <a
                href={voteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-espresso border-2 border-espresso font-black text-xs flex items-center justify-center gap-1.5 shadow-tactile transition-all active:translate-y-0.5"
              >
                <Star className="w-4 h-4 fill-current text-espresso" />
                <span>🗳️ Buka Portal E-Voting SMEGA</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyVote}
                  className="btn-tactile-cream flex-1 py-2 text-xs flex items-center justify-center gap-1.5 font-bold"
                >
                  {copiedVote ? <Check className="w-3.5 h-3.5 text-sage-700" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedVote ? 'Tersalin!' : 'Salin Link'}
                </button>
                <button
                  onClick={handleDownloadVoteQr}
                  className="btn-tactile-primary flex-1 py-2 text-xs font-black flex items-center justify-center gap-1.5 shadow-tactile-sm"
                  title="Unduh QR code ini agar pengunjung stand bisa scan langsung ke portal evoting"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh QR (PNG)
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
