-- ============================================================================
-- Ventas Garzón — esquema de Supabase
--
-- Ejecuta este archivo completo en el SQL Editor del proyecto
-- (Supabase → SQL Editor → New query → Run). Es idempotente: se puede
-- volver a ejecutar sin borrar datos.
--
-- Después ejecuta `seed.sql` para cargar el catálogo actual.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Perfiles (1:1 con auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Crea el perfil automáticamente al registrarse. El nombre llega en
-- `options.data.name` desde `supabase.auth.signUp`.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Productos (Mercado y Boutique en la misma tabla)
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store text not null default 'market' check (store in ('market', 'boutique')),
  name text not null,
  description text not null default '',
  -- Precios en pesos enteros, igual que `formatPrice` en el frontend.
  price integer not null check (price >= 0),
  image text not null default '',
  fallback_image text,
  category text not null check (category in ('aseo', 'alimentos')),
  subcategory text check (subcategory in ('superior', 'inferior', 'conjuntos', 'accesorios')),
  stock integer not null default 0 check (stock >= 0),
  rating numeric(3, 2),
  reviews integer not null default 0 check (reviews >= 0),
  discount integer check (discount between 0 and 100),
  emoji text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_store on public.products (store);
create index if not exists idx_products_category on public.products (category);
create index if not exists idx_products_subcategory on public.products (subcategory);

-- ----------------------------------------------------------------------------
-- Pedidos
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  subtotal integer not null default 0 check (subtotal >= 0),
  tax integer not null default 0 check (tax >= 0),
  delivery_fee integer not null default 0 check (delivery_fee >= 0),
  total integer not null default 0 check (total >= 0),
  shipping_address text,
  phone text,
  delivery_mode text not null default 'pickup' check (delivery_mode in ('pickup', 'delivery')),
  payment_mode text not null default 'cash' check (payment_mode in ('cash', 'transfer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_user_id on public.orders (user_id);
create index if not exists idx_orders_created_at on public.orders (created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  -- El producto puede eliminarse después; el pedido conserva su nombre y precio.
  product_id uuid references public.products (id) on delete set null,
  name text not null,
  image text,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order_id on public.order_items (order_id);

-- ----------------------------------------------------------------------------
-- updated_at automático
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Helpers y RLS
-- ----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Perfiles: cada usuario ve y edita el suyo; los admin ven todos.
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- Evita que un cliente se ascienda a admin cambiando `role`.
revoke update on public.profiles from anon, authenticated;
grant update (name, avatar_url) on public.profiles to authenticated;

-- Productos: lectura pública; escritura solo admin.
drop policy if exists "products_select_public" on public.products;
create policy "products_select_public" on public.products
  for select using (true);

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- Pedidos: se leen los propios (o todos si eres admin). Las altas pasan
-- siempre por `create_order`, que calcula precios y descuenta stock.
drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "order_items_select_own_or_admin" on public.order_items;
create policy "order_items_select_own_or_admin" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_admin())
    )
  );

-- ----------------------------------------------------------------------------
-- create_order: alta atómica de pedido
--
-- Recibe solo id + cantidad; los precios, el impuesto (20%), el envío
-- (5000 si es a domicilio) y el total se calculan aquí, nunca en el cliente.
-- Bloquea las filas de producto para evitar sobreventa.
-- ----------------------------------------------------------------------------
create or replace function public.create_order(
  p_items jsonb,
  p_shipping_address text,
  p_phone text,
  p_delivery_mode text default 'pickup',
  p_payment_mode text default 'cash'
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.orders;
  v_item record;
  v_product public.products;
  v_unit_price integer;
  v_subtotal integer := 0;
  v_tax integer;
  v_delivery_fee integer := 0;
  v_total integer;
begin
  if v_user_id is null then
    raise exception 'Inicia sesión para confirmar tu pedido' using errcode = '28000';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido está vacío' using errcode = '22023';
  end if;

  if p_delivery_mode not in ('pickup', 'delivery') then
    raise exception 'Modo de entrega inválido' using errcode = '22023';
  end if;

  if p_payment_mode not in ('cash', 'transfer') then
    raise exception 'Método de pago inválido' using errcode = '22023';
  end if;

  if p_delivery_mode = 'delivery'
     and coalesce(length(trim(p_shipping_address)), 0) < 10 then
    raise exception 'Escribe una dirección completa para la entrega' using errcode = '22023';
  end if;

  -- Pedido vacío primero: el total se actualiza al final.
  insert into public.orders (
    user_id, subtotal, tax, delivery_fee, total,
    shipping_address, phone, delivery_mode, payment_mode
  )
  values (
    v_user_id, 0, 0, 0, 0,
    nullif(trim(p_shipping_address), ''), nullif(trim(p_phone), ''),
    p_delivery_mode, p_payment_mode
  )
  returning * into v_order;

  -- Agrupa líneas repetidas y ordena por id para bloquear siempre en el
  -- mismo orden (evita interbloqueos entre pedidos concurrentes).
  for v_item in
    select
      (entry ->> 'product_id')::uuid as product_id,
      sum(coalesce((entry ->> 'quantity')::int, 0))::int as quantity
    from jsonb_array_elements(p_items) as entry
    group by 1
    order by 1
  loop
    if v_item.quantity <= 0 then
      raise exception 'Cantidad inválida' using errcode = '22023';
    end if;

    select * into v_product
    from public.products
    where id = v_item.product_id
    for update;

    if not found then
      raise exception 'El producto % no existe', v_item.product_id using errcode = '22023';
    end if;

    if v_product.stock < v_item.quantity then
      raise exception 'Stock insuficiente para "%" (disponible: %)',
        v_product.name, v_product.stock using errcode = '22023';
    end if;

    v_unit_price := round(v_product.price * (100 - coalesce(v_product.discount, 0)) / 100.0);

    insert into public.order_items (order_id, product_id, name, image, unit_price, quantity)
    values (v_order.id, v_product.id, v_product.name, v_product.image, v_unit_price, v_item.quantity);

    update public.products
    set stock = stock - v_item.quantity
    where id = v_product.id;

    v_subtotal := v_subtotal + v_unit_price * v_item.quantity;
  end loop;

  v_tax := round(v_subtotal * 0.20);

  if p_delivery_mode = 'delivery' then
    v_delivery_fee := 5000;
  end if;

  v_total := v_subtotal + v_tax + v_delivery_fee;

  update public.orders
  set subtotal = v_subtotal, tax = v_tax, delivery_fee = v_delivery_fee, total = v_total
  where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.create_order(jsonb, text, text, text, text) from public, anon;
grant execute on function public.create_order(jsonb, text, text, text, text) to authenticated;

-- ----------------------------------------------------------------------------
-- Permisos (Supabase ya los concede por defecto; explícitos para claridad)
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select, update (name, avatar_url) on public.profiles to authenticated;
