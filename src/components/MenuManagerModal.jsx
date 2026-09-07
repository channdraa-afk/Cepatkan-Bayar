import React, { useState } from 'react';
import { 
  X, Plus, Edit2, Trash2, Package, Sparkles, Check, AlertTriangle, 
  Image, Tag, DollarSign, Layers, ArrowLeft
} from 'lucide-react';
import { formatRupiah } from './MenuCard';
import { PHOTO_PRESETS } from '../data/initialMenu';
import { sound } from '../lib/audio';

export default function MenuManagerModal({
  isOpen,
  onClose,
  menus,
  onCreateMenu,
  onUpdateMenu,
  onDeleteMenu,
  onClearAllMenus
}) {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'add' | 'edit'
  const [editingId, setEditingId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Makanan');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('20');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(PHOTO_PRESETS[4].url); // default gorengan
  const [badge, setBadge] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setCategory('Makanan');
    setPrice('');
    setStock('20');
    setDescription('');
    setImage(PHOTO_PRESETS[0].url);
    setBadge('');
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    sound.playClick();
    resetForm();
    setActiveTab('add');
  };

  const handleOpenEdit = (item) => {
    sound.playClick();
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price.toString());
    setStock(item.stock.toString());
    setDescription(item.description || '');
    setImage(item.image || PHOTO_PRESETS[0].url);
    setBadge(item.badge || '');
    setActiveTab('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    sound.playComplete();

    const payload = {
      name: name.trim(),
      category: category.trim(),
      price: parseInt(price) || 0,
      stock: parseInt(stock) || 0,
      description: description.trim(),
      image: image.trim(),
      badge: badge.trim()
    };

    if (activeTab === 'edit' && editingId) {
      await onUpdateMenu(editingId, payload);
    } else {
      await onCreateMenu(payload);
    }

    resetForm();
    setActiveTab('list');
  };

  const handleDelete = async (id) => {
    sound.playRemove();
    await onDeleteMenu(id);
    setConfirmDeleteId(null);
  };

  const handleClearAll = async () => {
    sound.playRemove();
    await onClearAllMenus();
    setShowClearConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-espresso/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-cream border-2 border-espresso rounded-2xl shadow-tactile-lg flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b-2 border-espresso bg-cream-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-caramel border-2 border-espresso flex items-center justify-center text-cream shadow-tactile-sm">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-espresso">Kelola Menu Stand Bazar</h2>
              <p className="text-xs text-espresso/70 font-bold">Tambah, edit, atau hapus menu kapan saja</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-cream border border-espresso flex items-center justify-center text-espresso hover:bg-cream-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b-2 border-espresso bg-cream-50 p-2 gap-2">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('list');
            }}
            className={`flex-1 py-2 text-xs font-black rounded-xl border-2 border-espresso transition-all ${
              activeTab === 'list'
                ? 'bg-caramel text-cream shadow-tactile-sm'
                : 'bg-cream text-espresso hover:bg-cream-100'
            }`}
          >
            Daftar Menu ({menus.length})
          </button>
          <button
            onClick={handleOpenAdd}
            className={`flex-1 py-2 text-xs font-black rounded-xl border-2 border-espresso transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'add'
                ? 'bg-sage text-espresso shadow-tactile-sm'
                : 'bg-cream text-espresso hover:bg-cream-100'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Menu Baru</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4">
          
          {/* ================= TAB 1: DAFTAR MENU ================= */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              
              {/* Tombol Aksi Cepat / Kosongkan */}
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-bold text-espresso/70">
                  Total Tersedia: <strong>{menus.length}</strong> menu
                </span>
                {menus.length > 0 && (
                  <div>
                    {showClearConfirm ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-black text-rose-700">Yakin kosongkan semua?</span>
                        <button
                          onClick={handleClearAll}
                          className="px-2 py-1 rounded bg-rose-700 text-cream text-[10px] font-bold border border-espresso"
                        >
                          Ya, Kosongkan
                        </button>
                        <button
                          onClick={() => setShowClearConfirm(false)}
                          className="px-2 py-1 rounded bg-cream text-espresso text-[10px] font-bold border border-espresso"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowClearConfirm(true)}
                        className="text-xs font-bold text-rose-700 hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Kosongkan Semua Menu</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {menus.length === 0 ? (
                <div className="text-center py-12 px-4 card-tactile bg-cream-50">
                  <div className="w-14 h-14 rounded-2xl bg-cream-200 border-2 border-espresso flex items-center justify-center mx-auto mb-3 shadow-tactile-sm">
                    <Package className="w-7 h-7 text-espresso/40" />
                  </div>
                  <h3 className="text-base font-black text-espresso mb-1">Menu Masih Kosong</h3>
                  <p className="text-xs text-espresso/70 font-bold mb-4 max-w-sm mx-auto">
                    Yuk mulai masukkan menu lezat stand bazarmu agar calon pembeli bisa langsung pesan dari HP!
                  </p>
                  <button
                    onClick={handleOpenAdd}
                    className="btn-tactile-primary px-4 py-2.5 text-xs inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Menu Pertama Sekarang</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {menus.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-cream-50 border-2 border-espresso rounded-xl shadow-tactile-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      {/* Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover border border-espresso shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-black text-sm text-espresso truncate">{item.name}</h4>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cream-200 border border-espresso text-espresso">
                              {item.category}
                            </span>
                            {item.badge && (
                              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-caramel/20 text-caramel border border-caramel/50">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-caramel">
                            {formatRupiah(item.price)} • <span className="text-espresso/70">Stok: {item.stock} porsi</span>
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-cream border border-espresso font-bold text-xs text-espresso hover:bg-cream-200 flex items-center gap-1"
                          title="Edit Menu"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {confirmDeleteId === item.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="px-2 py-1 rounded bg-rose-700 text-cream font-black text-xs border border-espresso"
                            >
                              Hapus!
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded bg-cream text-espresso font-bold text-xs border border-espresso"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="p-1.5 rounded-lg bg-rose-100 text-rose-800 border border-rose-400 hover:bg-rose-200"
                            title="Hapus Menu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* ================= TAB 2: TAMBAH / EDIT MENU ================= */}
          {(activeTab === 'add' || activeTab === 'edit') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="flex items-center justify-between pb-1 border-b border-espresso/20">
                <h3 className="font-black text-sm text-espresso flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-caramel" />
                  {activeTab === 'edit' ? 'Edit Detail Menu' : 'Tambah Menu Baru ke Stand'}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="text-xs font-bold text-espresso/60 hover:text-espresso flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar
                </button>
              </div>

              {/* Nama Menu */}
              <div>
                <label className="block text-xs font-black text-espresso uppercase mb-1">
                  Nama Menu <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Es Teh Solo Jumbo / Tahu Krispi Pedas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-espresso bg-white font-bold text-xs text-espresso focus:outline-none focus:ring-2 focus:ring-caramel shadow-tactile-sm"
                />
              </div>

              {/* Baris Kategori, Harga & Stok */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Kategori */}
                <div>
                  <label className="block text-xs font-black text-espresso uppercase mb-1">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-espresso bg-white font-bold text-xs text-espresso focus:outline-none focus:ring-2 focus:ring-caramel shadow-tactile-sm"
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Cemilan">Cemilan</option>
                    <option value="Paket">Paket Hemat</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                {/* Harga */}
                <div>
                  <label className="block text-xs font-black text-espresso uppercase mb-1">
                    Harga (Rp) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 15000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-espresso bg-white font-bold text-xs text-espresso focus:outline-none focus:ring-2 focus:ring-caramel shadow-tactile-sm"
                  />
                </div>

                {/* Stok Awal */}
                <div>
                  <label className="block text-xs font-black text-espresso uppercase mb-1">
                    Stok Awal (Porsi)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 25"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border-2 border-espresso bg-white font-bold text-xs text-espresso focus:outline-none focus:ring-2 focus:ring-caramel shadow-tactile-sm"
                  />
                </div>
              </div>

              {/* Pilihan Foto Cepat (Preset Galeri) */}
              <div>
                <label className="block text-xs font-black text-espresso uppercase mb-1 flex items-center justify-between">
                  <span>Pilih Foto Menu (Klik Preset Cepat):</span>
                  <span className="text-[10px] text-espresso/60 font-bold lowercase">atau tempel url di bawah</span>
                </label>
                
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-2">
                  {PHOTO_PRESETS.map((preset, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => {
                        sound.playClick();
                        setImage(preset.url);
                      }}
                      className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${
                        image === preset.url 
                          ? 'border-caramel ring-2 ring-caramel scale-105 shadow-tactile-sm' 
                          : 'border-espresso/40 hover:border-espresso'
                      }`}
                      title={preset.name}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      {image === preset.url && (
                        <div className="absolute inset-0 bg-caramel/40 flex items-center justify-center text-white">
                          <Check className="w-4 h-4 font-black" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* URL Gambar Custom */}
                <input
                  type="url"
                  placeholder="URL Foto (Opsional, sudah terisi dari preset di atas)"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-espresso/40 bg-white font-mono text-[11px] text-espresso"
                />
              </div>

              {/* Deskripsi Menu */}
              <div>
                <label className="block text-xs font-black text-espresso uppercase mb-1">
                  Deskripsi Singkat (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Renyah gurih dengan bumbu pedas manis"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-espresso bg-white font-bold text-xs text-espresso focus:outline-none focus:ring-2 focus:ring-caramel shadow-tactile-sm"
                />
              </div>

              {/* Badge Promo */}
              <div>
                <label className="block text-xs font-black text-espresso uppercase mb-1">
                  Badge Sorotan (Opsional)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {['Best Seller 🔥', 'Favorit ⭐', 'Pedas 🌶️', 'Segar 🍋', 'Manis 🍯', 'Wajib Coba ☕'].map((b) => (
                    <button
                      type="button"
                      key={b}
                      onClick={() => setBadge(badge === b ? '' : b)}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold border transition-all ${
                        badge === b 
                          ? 'bg-caramel text-cream border-espresso font-black' 
                          : 'bg-cream-100 text-espresso border-espresso/30'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tombol Simpan */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="btn-tactile-cream flex-1 py-2.5 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-tactile-primary flex-1 py-2.5 text-xs font-black"
                >
                  {activeTab === 'edit' ? 'Simpan Perubahan' : '+ Simpan Menu Baru'}
                </button>
              </div>

            </form>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 border-t-2 border-espresso bg-cream-100 flex items-center justify-between text-xs font-bold text-espresso/70">
          <span>Setiap penambahan atau penghapusan menu langsung tersinkronisasi ke HP pembeli.</span>
          <button
            onClick={onClose}
            className="btn-tactile-primary px-4 py-2 text-xs"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
