-- ==============================================================================
-- CEPAKATAN BAYAR - SKEMA DATABASE SUPABASE (BERSIH / SIAP PAKAI)
-- Jalankan di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. TABEL MENUS (Katalog Makanan & Minuman Stand Bazar)
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

-- 2. TABEL ORDERS (Daftar Antrean Pesanan Masuk)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    notes TEXT DEFAULT '',
    items JSONB NOT NULL,
    total_price INTEGER NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'Tunai',
    status TEXT NOT NULL DEFAULT 'pending',
    cash_given INTEGER,
    change_amount INTEGER,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS) & AKSES
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Akses publik baca menu" ON public.menus;
DROP POLICY IF EXISTS "Akses publik kelola menu" ON public.menus;
DROP POLICY IF EXISTS "Akses publik update stok menu" ON public.menus;

CREATE POLICY "Akses publik baca menu" ON public.menus FOR SELECT USING (true);
CREATE POLICY "Akses publik kelola menu" ON public.menus FOR ALL USING (true);

DROP POLICY IF EXISTS "Akses publik baca pesanan" ON public.orders;
DROP POLICY IF EXISTS "Akses publik buat pesanan" ON public.orders;
DROP POLICY IF EXISTS "Akses publik perbarui pesanan" ON public.orders;

CREATE POLICY "Akses publik baca pesanan" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Akses publik buat pesanan" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Akses publik kelola pesanan" ON public.orders FOR ALL USING (true);

-- 4. AKTIFKAN REPLIKASI REALTIME
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'menus'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.menus;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END $$;
