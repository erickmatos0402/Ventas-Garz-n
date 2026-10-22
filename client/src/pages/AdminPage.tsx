import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  ShoppingCart,
  Wallet,
  Plus,
  Pencil,
  Trash2,
  X,
  Sparkles,
  ShoppingBasket,
  BadgePercent,
  ImageIcon,
  ZoomIn,
  Upload,
  AlertCircle,
  CheckCircle2,
  ListOrdered,
  BarChart3,
  Loader2,
  Phone,
  Clock,
  Truck,
  CreditCard,
  LogOut,
} from 'lucide-react';
import { LiquidTabs, RevenueChart } from '../components';
import { useAuthStore, useCatalogStore, useThemeStore } from '../store';
import { BoutiqueCategory, Product } from '../types';
import { formatDate, formatPrice, getPickupWindow } from '../utils';
import {
  buildDailySeries,
  buildMonthlySeries,
  buildWeeklySeries,
  summarizeOrders,
} from '../utils/analytics';
import { orderService, type AdminOrder } from '../services/orders';
import type { OrderStatus } from '../types/database';
import { BOUTIQUE_CATEGORIES, STORE_META_DATA } from '../data/boutiqueData';
import { useImageWithFallback } from '../hooks/useImageWithFallback';
import { MARKET_GALLERY_IMAGES, BOUTIQUE_GALLERY_IMAGES } from '../data/imageGallery';

type StoreId = 'market' | 'boutique';
type AdminTab = 'productos' | 'pedidos' | 'ventas';
type ModalMode = 'create' | 'edit' | null;
type ChartMode = 'diario' | 'semanal' | 'mensual';

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  image: '',
  category: 'aseo' as 'aseo' | 'alimentos',
  subcategory: 'superior' as BoutiqueCategory,
  stock: '',
  restockDays: '',
  discount: '',
  emoji: '🧴',
};

const MARKET_EMOJIS = ['🧴', '🧻', '🧼', '🍋', '🧽', '☕', '🍚', '🥛', '🫘', '🫒', '🍪'];
const BOUTIQUE_EMOJIS = ['👗', '👚', '👖', '👠', '👜', '🧥', '👒', '🧣', '💍', '🕶️', '👔'];

const STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-amber-500/15 text-amber-700' },
  processing: { label: 'En preparación', className: 'bg-sky-500/15 text-sky-700' },
  shipped: { label: 'Listo', className: 'bg-indigo-500/15 text-indigo-700' },
  delivered: { label: 'Entregado', className: 'bg-emerald-500/15 text-emerald-700' },
  cancelled: { label: 'Cancelado', className: 'bg-red-500/15 text-red-700' },
};

/**
 * Reduce y comprime una foto local (máx. 800px, JPEG) para poder
 * guardarla como data URL sin llenar el localStorage.
 */
async function fileToCompressedDataUrl(file: File, maxSize = 800, quality = 0.82): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Imagen inválida'));
    el.src = dataUrl;
  });

  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

function getDiscountedPriceSafe(p: Product): number {
  return p.discount ? Math.round(p.price * (1 - p.discount / 100)) : p.price;
}

function productGroupLabel(product: Product): string {
  if ((product.store ?? 'market') === 'market') {
    return product.category === 'aseo' ? 'Aseo' : 'Alimentos';
  }
  return BOUTIQUE_CATEGORIES.find((cat) => cat.id === product.subcategory)?.label ?? 'Prenda';
}

/** Tarjeta de producto del Admin con miniatura real y visor */
const AdminProductCard: React.FC<{
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
}> = ({ product, onEdit, onDelete, onPreview }) => {
  const { src, failed, onError } = useImageWithFallback(product.image, product.fallbackImage);
  const isMarket = (product.store ?? 'market') === 'market';

  return (
    <div className="glass-panel rounded-3xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onPreview}
            title="Ver imagen en grande"
            className="relative w-16 h-16 rounded-2xl overflow-hidden bg-white/70 border border-white/80 flex-shrink-0 group"
          >
            {src && !failed ? (
              <>
                <img src={src} alt={product.name} loading="lazy" className="w-full h-full object-cover object-center" onError={onError} />
                <span className="absolute inset-0 bg-primary-ink/0 group-hover:bg-primary-ink/35 transition flex items-center justify-center">
                  <ZoomIn size={18} className="text-white opacity-0 group-hover:opacity-100 transition" />
                </span>
              </>
            ) : (
              <span className="text-3xl select-none">{product.emoji || '📦'}</span>
            )}
          </button>
          <div className="min-w-0">
            <p className="font-semibold text-dark leading-tight truncate">{product.name}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
              {isMarket ? <Sparkles size={12} /> : <ShoppingBasket size={12} />}
              {productGroupLabel(product)}
            </p>
          </div>
        </div>
        {product.discount ? (
          <span className="bg-accent text-white text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0">
            -{product.discount}%
          </span>
        ) : null}
      </div>

      <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>

      <div className="flex items-center justify-between text-sm">
        <span className="font-bold text-primary">{formatPrice(getDiscountedPriceSafe(product))}</span>
        <span className={product.stock > 0 ? 'text-gray-500' : 'text-danger font-semibold'}>
          {product.stock > 0 ? `${product.stock} en stock` : 'Agotado'}
          {product.restockDays != null && (
            <span className="block text-[11px] text-amber-700">
              Reposición ~{product.restockDays} {product.restockDays === 1 ? 'día' : 'días'}
            </span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onPreview}
          className="btn-liquid-ghost tap-icon inline-flex items-center justify-center py-2 px-3 text-sm"
          title="Ver imagen"
        >
          <ImageIcon size={14} />
        </button>
        <button
          onClick={onEdit}
          className="btn-liquid-ghost tap-icon flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-sm"
        >
          <Pencil size={14} />
          Editar
        </button>
        <button
          onClick={onDelete}
          className="btn-liquid-ghost tap-icon text-danger inline-flex items-center justify-center py-2 px-3 text-sm"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

/** Visor grande de la foto del producto (con fallback a ilustración) */
const ImagePreviewModal: React.FC<{ product: Product; onClose: () => void }> = ({ product, onClose }) => {
  const { src, failed, onError } = useImageWithFallback(product.image, product.fallbackImage);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-primary-ink/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        className="relative glass-strong rounded-3xl p-5 w-full max-w-md max-h-[85dvh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-dark truncate pr-3">{product.name}</h3>
          <button onClick={onClose} className="tap-icon text-gray-400 hover:text-dark transition flex-shrink-0" aria-label="Cerrar">
            <X size={22} />
          </button>
        </div>
        <div className="rounded-2xl overflow-hidden bg-white/80 border border-white/80 aspect-square flex items-center justify-center">
          {src && !failed ? (
            <img src={src} alt={product.name} className="w-full h-full object-cover object-center" onError={onError} />
          ) : (
            <span className="text-7xl select-none">{product.emoji || '📦'}</span>
          )}
        </div>
        <p className="text-xs text-gray-400 text-center mt-3">Imagen del producto · cámbiala desde Editar</p>
      </motion.div>
    </div>
  );
};

/** Tarjeta de pedido con las acciones que lleva el control diario. */
const OrderCard: React.FC<{
  order: AdminOrder;
  busy: boolean;
  onAction: (order: AdminOrder, status: OrderStatus) => void;
}> = ({ order, busy, onAction }) => {
  const status = STATUS_META[order.status];
  const pickup = getPickupWindow(order.pickup_ready_at);
  const isOpen = order.status !== 'delivered' && order.status !== 'cancelled';

  return (
    <div className="glass-panel rounded-3xl p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display font-bold text-dark">#{order.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
        </div>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="text-sm text-gray-600 space-y-0.5">
        <p className="font-semibold text-dark truncate">{order.customerName}</p>
        {order.customerEmail && <p className="truncate text-xs text-gray-400">{order.customerEmail}</p>}
        {order.phone && (
          <p className="flex items-center gap-1.5 text-xs">
            <Phone size={12} /> {order.phone}
          </p>
        )}
      </div>

      <ul className="text-sm space-y-1 border-y border-white/70 py-2">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3">
            <span className="text-gray-600 min-w-0">
              {item.name} <span className="text-gray-400">×{item.quantity}</span>
            </span>
            <span className="text-dark font-semibold whitespace-nowrap">
              {formatPrice(item.unit_price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 flex items-center gap-1.5">
          {order.payment_mode === 'transfer' ? <CreditCard size={14} /> : <Wallet size={14} />}
          {order.payment_mode === 'transfer' ? 'Transferencia' : 'Efectivo'}
        </span>
        <span className="font-bold text-primary-deep">{formatPrice(Number(order.total))}</span>
      </div>

      <p className="text-xs text-gray-500 flex items-start gap-1.5">
        <Clock size={13} className="mt-0.5 flex-shrink-0 text-primary" />
        Recogida: {pickup.dayLabel}, {pickup.startTime}–{pickup.endTime}
      </p>

      {isOpen ? (
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => onAction(order, 'delivered')}
            disabled={busy}
            className="btn-liquid flex-1 py-2.5 text-sm inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Entregado
          </button>
          <button
            onClick={() => onAction(order, 'cancelled')}
            disabled={busy}
            className="btn-liquid-ghost flex-1 py-2.5 text-sm text-danger inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            <X size={14} />
            Cancelar
          </button>
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center pt-1">
          {order.status === 'delivered' ? 'Venta confirmada e incluida en los ingresos' : 'Pedido cancelado'}
        </p>
      )}
    </div>
  );
};

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const authLoading = useAuthStore((s) => s.loading);
  const siteTheme = useThemeStore((s) => s.theme);
  const { products, addProduct, updateProduct, deleteProduct, loading, error } = useCatalogStore();

  const [tab, setTab] = useState<AdminTab>('productos');
  // El panel administra SIEMPRE la tienda activa (Mercado o Boutique): no hay
  // conmutador dentro del panel, se cambia desde la barra superior.
  const adminStore: StoreId = siteTheme;
  const [chartMode, setChartMode] = useState<ChartMode>('diario');

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<'all' | 'open' | 'delivered' | 'cancelled'>('all');
  const [actionTarget, setActionTarget] = useState<{ order: AdminOrder; status: OrderStatus } | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';
  const meta = STORE_META_DATA[adminStore];

  // Catálogo de la tienda elegida en el panel (Mercado y Boutique aparte).
  const storeProducts = useMemo(
    () => products.filter((p) => (p.store ?? 'market') === adminStore),
    [products, adminStore]
  );

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const list = await orderService.listForAdmin(adminStore);
      setOrders(list);
    } catch (err) {
      setOrders([]);
      setOrdersError(err instanceof Error ? err.message : 'No se pudieron cargar los pedidos');
    } finally {
      setOrdersLoading(false);
    }
  }, [adminStore]);

  useEffect(() => {
    if (!isAdmin) return;
    void loadOrders();
  }, [isAdmin, loadOrders]);

  const stats = useMemo(
    () => [
      { label: 'Productos', value: String(storeProducts.length), icon: <Package size={22} className="text-primary" /> },
      {
        label: 'Stock total',
        value: String(storeProducts.reduce((sum, p) => sum + (p.stock || 0), 0)),
        icon: <ShoppingCart size={22} className="text-primary" />,
      },
      {
        label: 'Ofertas activas',
        value: String(storeProducts.filter((p) => p.discount).length),
        icon: <BadgePercent size={22} className="text-accent" />,
      },
      {
        label: 'Valor inventario',
        value: formatPrice(storeProducts.reduce((sum, p) => sum + getDiscountedPriceSafe(p) * (p.stock || 0), 0)),
        icon: <Wallet size={22} className="text-primary-deep" />,
      },
    ],
    [storeProducts]
  );

  const summary = useMemo(() => summarizeOrders(orders), [orders]);
  const series = useMemo(() => {
    if (chartMode === 'semanal') return buildWeeklySeries(orders, 8);
    if (chartMode === 'mensual') return buildMonthlySeries(orders, 6);
    return buildDailySeries(orders, 14);
  }, [orders, chartMode]);

  const visibleOrders = useMemo(() => {
    if (orderFilter === 'open') {
      return orders.filter((order) => order.status === 'pending' || order.status === 'processing');
    }
    if (orderFilter === 'delivered') return orders.filter((order) => order.status === 'delivered');
    if (orderFilter === 'cancelled') return orders.filter((order) => order.status === 'cancelled');
    return orders;
  }, [orders, orderFilter]);

  // Salir del panel es una acción directa (no escondida en un desplegable):
  // cierra la sesión y devuelve a la tienda.
  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, emoji: adminStore === 'market' ? '🧴' : '👗' });
    setEditingId(null);
    setModalMode('create');
  };

  const openEdit = (product: Product) => {
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      image: product.image || '',
      category: product.category,
      subcategory: product.subcategory ?? 'superior',
      stock: String(product.stock),
      restockDays: product.restockDays != null ? String(product.restockDays) : '',
      discount: product.discount ? String(product.discount) : '',
      emoji: product.emoji || '📦',
    });
    setEditingId(product.id);
    setModalMode('edit');
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setForm((prev) => ({ ...prev, image: dataUrl }));
    } catch {
      // Si falla la compresión se deja la imagen como estaba
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaving(true);

    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price) || 0,
      image: form.image.trim(),
      // La columna `category` sigue existiendo para ambos catálogos; en la
      // Boutique el filtro real es `subcategory`.
      category: adminStore === 'market' ? form.category : ('aseo' as const),
      subcategory: adminStore === 'boutique' ? form.subcategory : undefined,
      stock: Number(form.stock) || 0,
      restockDays: form.restockDays !== '' ? Number(form.restockDays) : undefined,
      discount: form.discount ? Number(form.discount) : undefined,
      emoji: form.emoji,
      store: adminStore,
    };

    try {
      if (modalMode === 'create') {
        await addProduct(data);
      } else if (editingId) {
        await updateProduct({ ...data, id: editingId });
      }
      setModalMode(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'No se pudo guardar el producto');
    } finally {
      setSaving(false);
    }
  };

  const confirmStatusChange = async () => {
    if (!actionTarget) return;
    const { order, status } = actionTarget;
    setActionBusyId(order.id);
    setOrdersError(null);
    try {
      await orderService.updateStatus(order.id, status);
      setOrders((list) => list.map((item) => (item.id === order.id ? { ...item, status } : item)));
      setActionTarget(null);
    } catch (err) {
      setOrdersError(err instanceof Error ? err.message : 'No se pudo actualizar el pedido');
    } finally {
      setActionBusyId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4">
        <p className="text-gray-500">Comprobando tu sesión…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 py-16">
        <div className="glass-strong rounded-3xl p-6 sm:p-8 max-w-md text-center w-full">
          <Package size={40} className="mx-auto mb-4 text-primary/50" />
          <h1 className="font-display text-2xl font-extrabold text-dark mb-2">Panel de administración</h1>
          <p className="text-gray-500 mb-6">
            Inicia sesión con una cuenta de administrador para gestionar el catálogo y los pedidos.
          </p>
          <Link to="/login" className="btn-liquid inline-flex items-center justify-center w-full py-3">
            Iniciar sesión
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 py-16">
        <div className="glass-strong rounded-3xl p-6 sm:p-8 max-w-md text-center w-full">
          <AlertCircle size={40} className="mx-auto mb-4 text-danger/70" />
          <h1 className="font-display text-2xl font-extrabold text-dark mb-2">Sin permisos de administrador</h1>
          <p className="text-gray-500 mb-3">
            Tu cuenta <span className="font-semibold text-primary-deep">{user.email}</span> no tiene el rol de administrador.
          </p>
          <p className="text-xs text-gray-400 mb-6">
            Un administrador puede concederlo desde el SQL Editor de Supabase con:
            {' '}<code>update public.profiles set role = 'admin' where email = '...';</code>
          </p>
          <Link to="/" className="btn-liquid inline-flex items-center justify-center w-full py-3">
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh pt-10 sm:pt-20 pb-24 sm:pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera: el panel corresponde siempre a la tienda activa */}
        <div className="mb-6 glass-panel rounded-3xl p-5 sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="heading-eyebrow">Panel de Control</p>
              <h1 className="heading-page text-3xl sm:text-4xl md:text-5xl break-words">
                Administrador de {meta.name}
              </h1>
              <p className="mt-3 text-gray-600 max-w-2xl">
                {adminStore === 'market'
                  ? 'Catálogo, pedidos y ventas del mercado: aseo y alimentos.'
                  : 'Catálogo, pedidos y ventas de la boutique: prendas y accesorios.'}{' '}
                El panel sigue la tienda activa: para pasar de Mercado a Boutique,
                usa el conmutador de la barra superior.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-shrink-0">
              {tab === 'productos' && (
                <button onClick={openCreate} className="btn-liquid inline-flex items-center gap-2 px-5 py-3 text-sm">
                  <Plus size={18} />
                  Nuevo {adminStore === 'market' ? 'Producto' : 'Artículo'}
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="btn-liquid-ghost inline-flex items-center gap-2 px-5 py-3 text-sm text-danger"
              >
                <LogOut size={17} />
                Cerrar sesión
              </button>
            </div>
          </div>

          <p className="mt-5 text-xs text-gray-400">
            {storeProducts.length} {adminStore === 'market' ? 'productos' : 'artículos'} en {meta.name}
          </p>
        </div>

        {/* Secciones del panel */}
        <div className="mb-6 flex justify-center">
          <LiquidTabs
            wrap
            items={[
              { id: 'productos', label: 'Productos', icon: <Package size={15} /> },
              { id: 'pedidos', label: 'Pedidos', icon: <ListOrdered size={15} /> },
              { id: 'ventas', label: 'Gráficos', icon: <BarChart3 size={15} /> },
            ]}
            activeId={tab}
            onChange={(id) => setTab(id as AdminTab)}
          />
        </div>

        {error && (
          <div className="mb-6 bg-danger/10 border border-danger text-danger px-4 py-3 rounded-2xl flex items-start gap-2 text-sm">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {tab === 'productos' && (
          <>
            {/* Estadísticas de la tienda activa */}
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {stats.map((stat) => (
                <motion.div key={stat.label} whileHover={{ y: -4 }} className="glass-panel rounded-3xl p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-2">
                    <p className="heading-eyebrow text-[11px] sm:text-sm min-w-0 break-words">{stat.label}</p>
                    <span className="flex-shrink-0">{stat.icon}</span>
                  </div>
                  <p className="mt-3 sm:mt-4 text-xl min-[380px]:text-2xl sm:text-3xl font-bold text-dark break-words">{stat.value}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 sm:mt-10 glass-panel rounded-3xl p-4 sm:p-6">
              <div className="mb-6">
                <h2 className="font-display text-xl font-bold text-primary-dark tracking-tight">
                  Gestión de {adminStore === 'market' ? 'Productos' : 'Artículos'}
                </h2>
                <p className="text-sm text-gray-500">Los cambios se reflejan al instante en {meta.name}</p>
              </div>

              {loading && storeProducts.length === 0 ? (
                <p className="text-sm text-gray-500">Cargando catálogo…</p>
              ) : storeProducts.length === 0 ? (
                <div className="liquid-badge rounded-3xl p-10 text-center">
                  <Package size={40} className="mx-auto mb-3 text-primary/40" />
                  <p className="text-gray-500">
                    No hay {adminStore === 'market' ? 'productos' : 'artículos'}. Crea el primero con el botón de arriba.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {storeProducts.map((product) => (
                    <AdminProductCard
                      key={product.id}
                      product={product}
                      onEdit={() => openEdit(product)}
                      onDelete={() => setConfirmDeleteId(product.id)}
                      onPreview={() => setPreviewProduct(product)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'pedidos' && (
          <div className="glass-panel rounded-3xl p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
              <div>
                <h2 className="font-display text-xl font-bold text-primary-dark tracking-tight">Pedidos de {meta.name}</h2>
                <p className="text-sm text-gray-500">
                  Marca cada pedido como entregado o cancelado para llevar el control.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadOrders()}
                disabled={ordersLoading}
                className="btn-liquid-ghost inline-flex items-center gap-2 px-4 py-2 text-sm self-start"
              >
                {ordersLoading ? <Loader2 size={14} className="animate-spin" /> : <ListOrdered size={14} />}
                Actualizar
              </button>
            </div>

            <div className="mb-5 flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {([
                { id: 'all', label: `Todos (${orders.length})` },
                {
                  id: 'open',
                  label: `Abiertos (${orders.filter((o) => o.status === 'pending' || o.status === 'processing').length})`,
                },
                { id: 'delivered', label: `Entregados (${summary.delivered})` },
                { id: 'cancelled', label: `Cancelados (${summary.cancelled})` },
              ] as const).map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setOrderFilter(filter.id)}
                  className={`flex-shrink-0 rounded-full px-4 min-h-[38px] text-sm font-semibold transition ${
                    orderFilter === filter.id
                      ? 'liquid-tab-blob !rounded-full ring-2 ring-primary text-dark'
                      : 'liquid-badge text-dark'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {ordersError && (
              <div className="mb-4 bg-danger/10 border border-danger text-danger px-4 py-3 rounded-2xl flex items-start gap-2 text-sm">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <span>{ordersError}</span>
              </div>
            )}

            {ordersLoading && orders.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-10">Cargando pedidos…</p>
            ) : visibleOrders.length === 0 ? (
              <div className="liquid-badge rounded-3xl p-10 text-center">
                <ListOrdered size={40} className="mx-auto mb-3 text-primary/40" />
                <p className="text-gray-500">Todavía no hay pedidos en esta vista.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    busy={actionBusyId === order.id}
                    onAction={(target, status) => setActionTarget({ order: target, status })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'ventas' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {[
                { label: 'Ingresos confirmados', value: formatPrice(summary.revenue), icon: <Wallet size={22} className="text-primary" /> },
                { label: 'Pedidos entregados', value: String(summary.delivered), icon: <CheckCircle2 size={22} className="text-emerald-600" /> },
                { label: 'Ticket promedio', value: formatPrice(summary.averageTicket), icon: <Truck size={22} className="text-primary-deep" /> },
                { label: 'Pendientes', value: String(summary.pending), icon: <Clock size={22} className="text-amber-600" /> },
              ].map((stat) => (
                <div key={stat.label} className="glass-panel rounded-3xl p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-2">
                    <p className="heading-eyebrow text-[11px] sm:text-sm min-w-0 break-words">{stat.label}</p>
                    <span className="flex-shrink-0">{stat.icon}</span>
                  </div>
                  <p className="mt-3 sm:mt-4 text-xl min-[380px]:text-2xl sm:text-3xl font-bold text-dark break-words">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="glass-panel rounded-3xl p-4 sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-xl font-bold text-primary-dark tracking-tight">Gráfico de ventas</h2>
                  <p className="text-sm text-gray-500">
                    Solo los pedidos entregados cuentan como venta confirmada.
                  </p>
                </div>
                <LiquidTabs
                  items={[
                    { id: 'diario', label: 'Diario' },
                    { id: 'semanal', label: 'Semanal' },
                    { id: 'mensual', label: 'Mensual' },
                  ]}
                  activeId={chartMode}
                  onChange={(id) => setChartMode(id as ChartMode)}
                />
              </div>

              {ordersLoading && orders.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-10">Cargando ventas…</p>
              ) : (
                <RevenueChart
                  points={series}
                  unitLabel={chartMode === 'diario' ? 'últimos 14 días' : chartMode === 'semanal' ? 'últimas 8 semanas' : 'últimos 6 meses'}
                />
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Entregados', value: summary.delivered, tone: 'text-emerald-700' },
                  { label: 'Pendientes', value: summary.pending, tone: 'text-amber-700' },
                  { label: 'Cancelados', value: summary.cancelled, tone: 'text-red-700' },
                ].map((item) => (
                  <div key={item.label} className="liquid-badge rounded-2xl px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className={`font-bold ${item.tone}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visor de imagen de producto */}
      <AnimatePresence>
        {previewProduct && (
          <ImagePreviewModal product={previewProduct} onClose={() => setPreviewProduct(null)} />
        )}
      </AnimatePresence>

      {/* Modal crear/editar */}
      {modalMode && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark/40 backdrop-blur-sm" onClick={() => setModalMode(null)} />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative glass-strong rounded-3xl p-5 sm:p-6 w-full max-w-lg max-h-[85dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl font-bold text-dark">
                {modalMode === 'create' ? `Nuevo ${adminStore === 'market' ? 'Producto' : 'Artículo'}` : 'Editar'}
                <span className="block text-xs font-semibold text-gray-400">{meta.name}</span>
              </h3>
              <button onClick={() => setModalMode(null)} className="tap-icon text-gray-400 hover:text-dark transition">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-dark mb-1.5">Nombre</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-dark mb-1.5">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-dark mb-1.5">Imagen de la {adminStore === 'market' ? 'producto' : 'prenda'}</label>
                <div className="flex items-start gap-3">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/60 border border-white/80 flex items-center justify-center flex-shrink-0">
                    {form.image ? (
                      <img src={form.image} alt="Vista previa" className="w-full h-full object-cover object-center" />
                    ) : (
                      <span className="text-3xl select-none">{form.emoji || '📦'}</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <label className="btn-liquid-ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-sm cursor-pointer">
                        <Upload size={14} />
                        Subir foto
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
                      </label>
                      {form.image && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, image: '' })}
                          className="btn-liquid-ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-danger"
                        >
                          <X size={14} />
                          Quitar
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={form.image.startsWith('data:') ? '' : form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                      placeholder="/img/products/shampoo.jpg o https://…"
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 mb-1.5">O elige una imagen del catálogo:</p>
                <div className="liquid-badge rounded-2xl p-2 max-h-28 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {(adminStore === 'market' ? MARKET_GALLERY_IMAGES : BOUTIQUE_GALLERY_IMAGES).map((src) => (
                      <button
                        type="button"
                        key={src}
                        title={src}
                        onClick={() => setForm({ ...form, image: src })}
                        className={`w-11 h-11 rounded-xl overflow-hidden border-2 transition flex-shrink-0 ${
                          form.image === src
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img src={src} alt="" loading="lazy" className="w-full h-full object-cover object-center" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-dark mb-1.5">Precio (COP)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-dark mb-1.5">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    required
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-dark mb-1.5">
                  Días de espera por abastecimiento (opcional)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.restockDays}
                  onChange={(e) => setForm({ ...form, restockDays: e.target.value })}
                  placeholder="Ej. 5 (se muestra en la tienda si hay espera)"
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-dark mb-1.5">
                    {adminStore === 'market' ? 'Categoría' : 'Tipo de prenda'}
                  </label>
                  {adminStore === 'market' ? (
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value as 'aseo' | 'alimentos' })}
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="aseo">Aseo</option>
                      <option value="alimentos">Alimentos</option>
                    </select>
                  ) : (
                    <select
                      value={form.subcategory}
                      onChange={(e) => setForm({ ...form, subcategory: e.target.value as BoutiqueCategory })}
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
                    >
                      {BOUTIQUE_CATEGORIES.filter((cat) => cat.id).map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-dark mb-1.5">Descuento % (opcional)</label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value })}
                    placeholder="0"
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-dark mb-1.5">Emoji de vista previa</label>
                <div className="flex flex-wrap gap-2">
                  {(adminStore === 'market' ? MARKET_EMOJIS : BOUTIQUE_EMOJIS).map((em) => (
                    <button
                      type="button"
                      key={em}
                      onClick={() => setForm({ ...form, emoji: em })}
                      className={`w-11 h-11 rounded-xl text-xl flex items-center justify-center transition ${
                        form.emoji === em ? 'bg-primary/15 ring-2 ring-primary' : 'bg-white/50 hover:bg-white/80'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {saveError && (
                <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-2xl flex items-start gap-2 text-sm">
                  <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-liquid flex-1 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Guardando…' : modalMode === 'create' ? 'Crear' : 'Guardar Cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="btn-liquid-ghost px-6 py-3 text-dark"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Confirmar eliminación de producto */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark/40 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)} />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative glass-strong rounded-3xl p-6 w-full max-w-sm text-center"
          >
            <Trash2 size={36} className="mx-auto mb-3 text-danger" />
            <h3 className="font-display text-lg font-bold text-dark mb-1">¿Eliminar {adminStore === 'market' ? 'producto' : 'artículo'}?</h3>
            <p className="text-sm text-gray-600 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  try {
                    await deleteProduct(confirmDeleteId);
                  } catch {
                    // El error queda visible en el aviso del catálogo.
                  } finally {
                    setConfirmDeleteId(null);
                  }
                }}
                className="btn-liquid flex-1 py-3"
              >
                Sí, eliminar
              </button>
              <button onClick={() => setConfirmDeleteId(null)} className="btn-liquid-ghost flex-1 py-3 text-dark">
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Confirmar cambio de estado del pedido */}
      {actionTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark/40 backdrop-blur-sm" onClick={() => setActionTarget(null)} />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative glass-strong rounded-3xl p-6 w-full max-w-sm text-center"
          >
            {actionTarget.status === 'delivered' ? (
              <CheckCircle2 size={36} className="mx-auto mb-3 text-emerald-600" />
            ) : (
              <X size={36} className="mx-auto mb-3 text-danger" />
            )}
            <h3 className="font-display text-lg font-bold text-dark mb-1">
              {actionTarget.status === 'delivered' ? '¿Marcar como entregado?' : '¿Cancelar este pedido?'}
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              Pedido #{actionTarget.order.id.slice(0, 8).toUpperCase()} ·{' '}
              {formatPrice(Number(actionTarget.order.total))}
              {actionTarget.status === 'delivered'
                ? '. Pasará a contar como venta confirmada.'
                : '. Dejará de contar como venta.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => void confirmStatusChange()}
                disabled={actionBusyId !== null}
                className={`flex-1 py-3 inline-flex items-center justify-center gap-2 ${
                  actionTarget.status === 'delivered' ? 'btn-liquid' : 'btn-liquid text-danger'
                } disabled:opacity-60`}
              >
                {actionBusyId ? <Loader2 size={16} className="animate-spin" /> : null}
                {actionTarget.status === 'delivered' ? 'Sí, entregado' : 'Sí, cancelar'}
              </button>
              <button
                onClick={() => setActionTarget(null)}
                className="btn-liquid-ghost flex-1 py-3 text-dark"
              >
                Volver
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
