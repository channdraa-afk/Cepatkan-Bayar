-- ==============================================================================
-- CEPAKATAN BAYAR - SKEMA DATABASE SUPABASE (POSTGRESQL + REALTIME)
-- Jalankan skrip ini di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. TABEL MENUS (Katalog Makanan & Minuman Stand)
CREATE TABLE IF NOT EXISTS public.menus (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    image TEXT,
    badge TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. TABEL ORDERS (Daftar Antrean Pesanan Bazar)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    notes TEXT DEFAULT '',
    items JSONB NOT NULL,
    total_price INTEGER NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'Tunai',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'cooking' | 'completed' | 'cancelled'
    cash_given INTEGER,
    change_amount INTEGER,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Buat Policy Akses Terbuka untuk Operasional Cepat Bazar (Anon Key)
CREATE POLICY "Akses publik baca menu" ON public.menus FOR SELECT USING (true);
CREATE POLICY "Akses publik update stok menu" ON public.menus FOR ALL USING (true);

CREATE POLICY "Akses publik baca pesanan" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Akses publik buat pesanan" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Akses publik perbarui pesanan" ON public.orders FOR ALL USING (true);

-- 4. AKTIFKAN SUPABASE REALTIME REPLICATION
-- Mengizinkan perubahan data disiarkan otomatis ke browser pelanggan & kasir
ALTER PUBLICATION supabase_realtime ADD TABLE public.menus;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- 5. SEED DATA AWAL (MENU BAZAR)
INSERT INTO public.menus (id, name, category, price, stock, description, image, badge)
VALUES
  ('m1', 'Tahu Bakso Goreng Krispi', 'Makanan', 15000, 20, 'Tahu bakso daging sapi gurih dengan kulit krispi renyah & saus cocolan.', 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=400&q=80', 'Best Seller 🔥'),
  ('m2', 'Dimsum Ayam Jamur (Isi 4)', 'Makanan', 18000, 15, 'Dimsum kenyal lembut daging ayam pilihan dengan saus chili oil harum.', 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=400&q=80', 'Favorit'),
  ('m3', 'Cireng Salju Bumbu Rujak', 'Makanan', 12000, 25, 'Cireng kenyal garing di luar dengan saus bumbu rujak pedas manis pedas nampol.', 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&q=80', 'Cemilan Seru'),
  ('m4', 'Pisang Karamel Keju Lumer', 'Makanan', 10000, 18, 'Pisang manis legit dibalut karamel toffee dan parutan keju melimpah.', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=400&q=80', 'Manis'),
  ('d1', 'Es Kopi Susu Gula Aren', 'Minuman', 15000, 30, 'Espresso bold dipadu susu creamy dan gula aren murni khas nusantara.', 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=400&q=80', 'Wajib Coba ☕'),
  ('d2', 'Matcha Cream Latte', 'Minuman', 18000, 20, 'Matcha murni beraroma daun teh segar dipadu susu oat lembut yang menenangkan.', 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=400&q=80', 'Artisan'),
  ('d3', 'Berry Lemonade Sparkle', 'Minuman', 12000, 25, 'Soda segar dipadu ekstrak strawberry dan perasan lemon asli pemadam dahaga.', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80', 'Segar 🍋'),
  ('d4', 'Teh Tarik Klasik Vintage', 'Minuman', 8000, 35, 'Teh hitam kental wangi ditarik berbusa dengan sentuhan susu manis hangat/dingin.', 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80', 'Ekonomis')
ON CONFLICT (id) DO NOTHING;
