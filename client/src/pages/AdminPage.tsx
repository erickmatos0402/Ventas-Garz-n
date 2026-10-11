import React, { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { useMockAdminStore } from '../store';
import { Product } from '../types';
import { formatPrice } from '../utils';
import { useImageWithFallback } from '../hooks/useImageWithFallback';
import { MARKET_GALLERY_IMAGES, BOUTIQUE_GALLERY_IMAGES } from '../data/imageGallery';

type ModalMode = 'create' | 'edit' | null;

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  image: '',
  category: 'aseo' as 'aseo' | 'alimentos',
  stock: '',
  discount: '',
  emoji: '🧴',
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

/** Tarjeta de producto del Admin con miniatura real y visor */
const AdminProductCard: React.FC<{
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
}> = ({ product, onEdit, onDelete, onPreview }) => {
  const { src, failed, onError } = useImageWithFallback(product.image, product.fallbackImage);

  return (
    <div className="glass-panel rounded-3xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Miniatura con foto real del producto */}
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
              {product.category === 'aseo' ? <Sparkles size={12} /> : <ShoppingBasket size={12} />}
              {product.category === 'aseo' ? 'Aseo' : 'Alimentos'}
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
        </span>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onPreview}
          className="btn-liquid-ghost inline-flex items-center justify-center py-2 px-3 text-sm"
          title="Ver imagen"
        >
          <ImageIcon size={14} />
        </button>
        <button
          onClick={onEdit}
          className="btn-liquid-ghost flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-sm"
        >
          <Pencil size={14} />
          Editar
        </button>
        <button
          onClick={onDelete}
          className="btn-liquid-ghost text-danger inline-flex items-center justify-center py-2 px-3 text-sm"
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
        className="relative glass-strong rounded-3xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-dark truncate pr-3">{product.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-dark transition flex-shrink-0" aria-label="Cerrar">
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

export const AdminPage: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useMockAdminStore();

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  // Estadísticas derivadas de los datos falsos
  const stats = useMemo(
    () => [
      { label: 'Productos', value: String(products.length), icon: <Package size={22} className="text-primary" /> },
      {
        label: 'Stock total',
        value: String(products.reduce((sum, p) => sum + (p.stock || 0), 0)),
        icon: <ShoppingCart size={22} className="text-primary" />,
      },
      {
        label: 'Ofertas activas',
        value: String(products.filter((p) => p.discount).length),
        icon: <BadgePercent size={22} className="text-accent" />,
      },
      {
        label: 'Valor inventario',
        value: formatPrice(products.reduce((sum, p) => sum + getDiscountedPriceSafe(p) * (p.stock || 0), 0)),
        icon: <Wallet size={22} className="text-primary-deep" />,
      },
    ],
    [products]
  );

  const openCreate = () => {
    setForm(EMPTY_FORM);
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
      stock: String(product.stock),
      discount: product.discount ? String(product.discount) : '',
      emoji: product.emoji || '🧴',
    });
    setEditingId(product.id);
    setModalMode('edit');
  };

  /** Subir una foto desde el PC: se comprime y queda como data URL */
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

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <div className="mb-10 glass-panel rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="heading-eyebrow">Panel de Control</p>
              <h1 className="heading-page text-3xl sm:text-4xl md:text-5xl">Administrador de Ventas Garzón</h1>
              <p className="mt-3 text-gray-600 max-w-2xl">
                Gestiona el catálogo con datos falsos: crea, edita y elimina productos de aseo, alimentos y ofertas.
              </p>
            </div>
            <button onClick={openCreate} className="btn-liquid inline-flex items-center gap-2 px-6 py-3">
              <Plus size={18} />
              Nuevo Producto
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <motion.div key={stat.label} whileHover={{ y: -4 }} className="glass-panel rounded-3xl p-6">
              <div className="flex items-center justify-between">
                <p className="heading-eyebrow">{stat.label}</p>
                {stat.icon}
              </div>
              <p className="mt-4 text-3xl font-bold text-dark">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Gestión de productos */}
        <div className="mt-10 glass-panel rounded-3xl p-6">
          <div className="mb-6">
            <h2 className="font-display text-xl font-bold text-primary-dark tracking-tight">Gestión de Productos</h2>
            <p className="text-sm text-gray-500">Los cambios se reflejan al instante en Productos y ofertas</p>
          </div>

          {products.length === 0 ? (
            <div className="liquid-badge rounded-3xl p-10 text-center">
              <Package size={40} className="mx-auto mb-3 text-primary/40" />
              <p className="text-gray-500">No hay productos. Crea el primero con "Nuevo Producto".</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
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
            className="relative glass-strong rounded-3xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl font-bold text-dark">
                {modalMode === 'create' ? 'Nuevo Producto' : 'Editar Producto'}
              </h3>
              <button onClick={() => setModalMode(null)} className="text-gray-400 hover:text-dark transition">
                <X size={22} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const data = {
                  name: form.name.trim(),
                  description: form.description.trim(),
                  price: Number(form.price) || 0,
                  image: form.image.trim(),
                  category: form.category,
                  stock: Number(form.stock) || 0,
                  rating: 4.5,
                  reviews: 0,
                  discount: form.discount ? Number(form.discount) : undefined,
                  emoji: form.emoji,
                };
                if (modalMode === 'create') {
                  addProduct(data);
                } else if (editingId) {
                  updateProduct({ ...data, id: editingId });
                }
                setModalMode(null);
              }}
              className="space-y-4"
            >
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

              {/* Imagen del producto: subir, pegar URL o elegir de la galería */}
              <div>
                <label className="block text-sm font-bold text-dark mb-1.5">Imagen del producto</label>
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
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageFile}
                        />
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
                    {[...MARKET_GALLERY_IMAGES, ...BOUTIQUE_GALLERY_IMAGES].map((src) => (
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-dark mb-1.5">Categoría</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value as 'aseo' | 'alimentos' })}
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="aseo">Aseo</option>
                    <option value="alimentos">Alimentos</option>
                  </select>
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
                  {['🧴', '🧻', '🧼', '🍋', '🧽', '☕', '🍚', '🥛', '🫘', '🫒', '🍪'].map((em) => (
                    <button
                      type="button"
                      key={em}
                      onClick={() => setForm({ ...form, emoji: em })}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition ${
                        form.emoji === em ? 'bg-primary/15 ring-2 ring-primary' : 'bg-white/50 hover:bg-white/80'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-liquid flex-1 py-2.5">
                  {modalMode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="btn-liquid-ghost px-6 py-2.5 text-dark"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-dark/40 backdrop-blur-sm" onClick={() => setConfirmDeleteId(null)} />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative glass-strong rounded-3xl p-6 w-full max-w-sm text-center"
          >
            <Trash2 size={36} className="mx-auto mb-3 text-danger" />
            <h3 className="font-display text-lg font-bold text-dark mb-1">¿Eliminar producto?</h3>
            <p className="text-sm text-gray-600 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  deleteProduct(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="btn-liquid flex-1 py-2.5"
              >
                Sí, eliminar
              </button>
              <button onClick={() => setConfirmDeleteId(null)} className="btn-liquid-ghost flex-1 py-2.5 text-dark">
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
