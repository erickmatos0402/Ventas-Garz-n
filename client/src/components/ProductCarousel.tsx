import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, Heart, ShoppingCart, Star, Check, MessageSquare } from 'lucide-react';
import { Product } from '../types';
import { formatPrice } from '../utils';
import { getDiscountedPrice } from '../data/pricing';
import { useCartStore, useThemeStore } from '../store';
import { useImageWithFallback } from '../hooks/useImageWithFallback';

interface ProductCarouselProps {
  products: Product[];
  className?: string;
}

/** Separación horizontal entre tarjetas en pantallas grandes (px) */
const GAP = 28;

/** Separación reducida en teléfonos: la tarjeta vecina alcanza a asomarse */
const GAP_MOBILE = 14;

/** Desde qué ancho se considera "teléfono" para el carrusel (px) */
const MOBILE_BREAKPOINT = 520;

/** Etiqueta de estado de la tarjeta (arriba a la izquierda) */
function getStatusLabel(product: Product, isBoutique: boolean): string {
  if (product.discount) return `-${product.discount}% OFF`;
  if ((product.rating ?? 0) >= 4.8) return 'BEST SELLER';
  if (product.stock <= 1) return isBoutique ? 'PIEZA ÚNICA' : 'ÚLTIMAS UNIDADES';
  return 'NUEVO';
}

interface CarouselCardProps {
  product: Product;
  isActive: boolean;
  width: number;
  isBoutique: boolean;
  favorite: boolean;
  onToggleFavorite: () => void;
  onActivate: () => void;
}

/**
 * Tarjeta vertical del carrusel. El botón "Agregar al carrito" solo se
 * expande por completo en la tarjeta activa; en las laterales queda como
 * botón circular compacto.
 */
const CarouselCard: React.FC<CarouselCardProps> = ({
  product,
  isActive,
  width,
  isBoutique,
  favorite,
  onToggleFavorite,
  onActivate,
}) => {
  const theme = useThemeStore((s) => s.theme);
  const cart = useCartStore(theme);
  const { addItem } = cart();
  const [justAdded, setJustAdded] = useState(false);
  // La cantidad se elige aquí, en Tienda (en Destacados solo se agrega).
  const [quantity, setQuantity] = useState(1);
  const { src, failed, onError } = useImageWithFallback(product.image, product.fallbackImage);

  const hasImage = !!src && !failed;
  const finalPrice = getDiscountedPrice(product);
  const status = getStatusLabel(product, isBoutique);
  const soldOut = product.stock === 0;

  const handleAdd = () => {
    if (soldOut) return;
    addItem(product, quantity);
    setQuantity(1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <motion.div
      onClick={onActivate}
      animate={{ scale: isActive ? 1.04 : 1, opacity: isActive ? 1 : 0.84 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="rounded-[2.25rem] overflow-hidden flex flex-col transition-all duration-500 ease-in-out cursor-pointer"
      style={{
        width,
        // Superficie del tema: blanco -> tinte del tema (--c-soft-rgb) con
        // borde del primario. Sin hex propios, así cada tienda usa su paleta.
        background: 'linear-gradient(165deg, rgba(255, 255, 255, 0.94) 0%, rgba(var(--c-soft-rgb), 0.92) 100%)',
        border: '1px solid rgba(var(--c-primary-rgb), 0.28)',
        boxShadow: isActive
          ? '0 26px 60px -14px rgba(var(--c-shadow-rgb), 0.45), 0 10px 26px rgba(var(--c-shadow-rgb), 0.18), inset 0 1px 0 rgba(255,255,255,0.85)'
          : '0 8px 22px rgba(var(--c-shadow-rgb), 0.10), inset 0 1px 0 rgba(255,255,255,0.6)',
      }}
    >
      {/* Imagen + etiqueta de estado + favorito */}
      <div className="relative mx-2.5 mt-2.5 rounded-[1.7rem] overflow-hidden bg-white/70 aspect-[4/3]">
        {hasImage ? (
          <img
            src={src}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover object-center"
            onError={onError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl select-none">
            {product.emoji || '🛍️'}
          </div>
        )}

        <span
          className="absolute top-2.5 left-2.5 z-10 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white shadow-sm"
          // Tokens oscuros del tema: la etiqueta va en blanco y debe
          // mantener contraste en las dos tiendas.
          style={{ background: 'linear-gradient(135deg, var(--c-primary-dark), var(--c-grove-2))' }}
        >
          {status}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-label={favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
          aria-pressed={favorite}
          className="hit-expand absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110 active:scale-90"
          style={{
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.7)',
            boxShadow: '0 4px 12px rgba(var(--c-shadow-rgb), 0.15)',
          }}
        >
          <Heart
            size={15}
            className={favorite ? 'fill-rose-500 text-rose-500' : 'text-primary-deep'}
          />
        </button>
      </div>

      {/* Cuerpo: aire justo para que la tarjeta se sienta ligera y compacta. */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display text-lg leading-snug text-dark line-clamp-2 mb-1.5">
          {product.name}
        </h3>
        <p className="text-gray-500 text-[13px] leading-snug line-clamp-2 mb-2.5">{product.description}</p>

        {/* Reseñas reales (sin valoraciones inventadas) */}
        <Link
          to={`/products/${product.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 mb-3 group/reviews"
          aria-label={`Ver reseñas de ${product.name}`}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              size={14}
              className={
                product.reviews && i <= Math.round(product.rating || 0)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-gray-300'
              }
            />
          ))}
          <span className="text-xs text-gray-500 ml-1">
            {product.rating ? `${product.rating.toFixed(1)} (${product.reviews || 0})` : 'Sin reseñas'}
          </span>
          <span className="ml-auto hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-primary-deep flex-shrink-0">
            <MessageSquare size={13} />
            Calificar
          </span>
        </Link>

        {/* Precio */}
        <div className="flex items-end justify-between gap-2 mb-3">
          <div>
            {product.discount ? (
              <p className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</p>
            ) : null}
            <p className="text-xl font-bold text-primary-deep leading-none">
              {formatPrice(finalPrice)}
            </p>
          </div>
          <span className={`text-[11px] ${soldOut ? 'text-danger font-semibold' : 'text-gray-400'}`}>
            {soldOut ? 'Agotado' : `${product.stock} disp.`}
          </span>
        </div>

        {product.restockDays != null ? (
          <p className="text-[11px] font-semibold text-amber-700 mb-3 -mt-2">
            {soldOut ? 'Espera de abastecimiento' : 'Reposición'}: ~{product.restockDays}{' '}
            {product.restockDays === 1 ? 'día' : 'días'}
          </p>
        ) : soldOut ? (
          <p className="text-[11px] font-semibold text-amber-700 mb-3 -mt-2">
            Esperando abastecimiento
          </p>
        ) : null}

        {/* Acción: se expande solo en la tarjeta activa */}
        <div className="mt-auto flex flex-col gap-2">
          {isActive && !soldOut && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-gray-500">Cantidad</span>
              <div className="liquid-badge flex items-center rounded-full px-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuantity((q) => Math.max(1, q - 1));
                  }}
                  className="w-8 h-8 rounded-full text-dark hover:bg-white/70 transition flex items-center justify-center text-lg leading-none"
                  aria-label="Restar cantidad"
                >
                  −
                </button>
                <span className="w-7 text-center font-bold text-dark text-sm">{quantity}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuantity((q) => Math.min(product.stock, q + 1));
                  }}
                  className="w-8 h-8 rounded-full text-dark hover:bg-white/70 transition flex items-center justify-center text-lg leading-none"
                  aria-label="Sumar cantidad"
                >
                  +
                </button>
              </div>
            </div>
          )}
          <motion.button
            type="button"
            whileTap={{ scale: soldOut ? 1 : 0.96 }}
            onClick={(e) => {
              e.stopPropagation();
              if (isActive) handleAdd();
              else onActivate();
            }}
            disabled={soldOut}
            aria-label={`Agregar ${product.name} al carrito`}
            className={`btn-liquid flex items-center justify-center gap-2 h-10 text-sm transition-all duration-500 ease-in-out disabled:cursor-not-allowed ${
              isActive ? 'w-full px-4' : 'w-10'
            }`}
          >
            {justAdded && isActive ? <Check size={17} /> : <ShoppingCart size={17} />}
            <AnimatePresence initial={false}>
              {isActive && (
                <motion.span
                  key="label"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {soldOut ? 'Agotado' : justAdded ? '¡Añadido!' : 'Agregar al carrito'}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * ProductCarousel — carrusel centrado con enfoque activo (Active Scale).
 * La tarjeta central crece y proyecta sombra profunda; las laterales se
 * reducen. Incluye flechas circulares semi-transparentes, puntos
 * indicadores y arrastre horizontal. Se adapta a la paleta de cada tienda
 * (Mercado / Boutique) mediante los tokens de color del tema.
 */
export const ProductCarousel: React.FC<ProductCarouselProps> = ({ products, className = '' }) => {
  const theme = useThemeStore((s) => s.theme);
  const isBoutique = theme === 'boutique';
  const [active, setActive] = useState(0);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [viewportW, setViewportW] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  const count = products.length;

  // Reinicia al cambiar el listado (filtros, búsqueda, orden o tienda)
  useEffect(() => {
    setActive(0);
  }, [products]);

  // Mide el ancho disponible para centrar y dimensionar las tarjetas
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => setViewportW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // En teléfonos el hueco entre tarjetas baja para aprovechar el ancho,
  // que a 320–360px es el recurso más escaso.
  const gap = viewportW > 0 && viewportW < MOBILE_BREAKPOINT ? GAP_MOBILE : GAP;

  // Tarjetas más pequeñas: la activa deja ver las vecinas y la sección
  // respira sin perder legibilidad (el contenido también se compactó).
  const slideW = useMemo(
    () => Math.min(296, Math.max(196, viewportW * 0.68)),
    [viewportW]
  );
  const step = slideW + gap;
  const offsetX = viewportW / 2 - slideW / 2 - active * step;

  const goPrev = useCallback(() => setActive((a) => Math.max(0, a - 1)), []);
  const goNext = useCallback(() => setActive((a) => Math.min(count - 1, a + 1)), [count]);

  const handlePanEnd = (_e: PointerEvent, info: PanInfo) => {
    if (info.offset.x < -60) goNext();
    else if (info.offset.x > 60) goPrev();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goPrev();
    else if (e.key === 'ArrowRight') goNext();
  };

  const toggleFavorite = (id: string) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (count === 0) return null;

  // Flechas algo más pequeñas en móvil: con la tarjeta activa ocupando
  // casi todo el ancho, las de 44px se comían el contenido de los bordes.
  const arrowClass = `hit-expand absolute top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-primary-deep transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none`;
  const arrowStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.55)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    boxShadow: '0 8px 24px rgba(var(--c-shadow-rgb), 0.20)',
  };

  return (
    <div className={`relative ${className}`} role="region" aria-roledescription="carrusel" aria-label="Carrusel de productos">
      {/* Zona deslizable */}
      <div
        ref={viewportRef}
        className="overflow-hidden py-6 outline-none touch-pan-y"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <motion.div
          className="flex items-stretch"
          style={{ gap }}
          animate={{ x: offsetX }}
          transition={{ type: 'tween', duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          onPanEnd={handlePanEnd}
        >
          {products.map((product, i) => (
            <div key={product.id} className="flex-shrink-0 flex" style={{ width: slideW }}>
              <CarouselCard
                product={product}
                isActive={i === active}
                width={slideW}
                isBoutique={isBoutique}
                favorite={favorites.has(product.id)}
                onToggleFavorite={() => toggleFavorite(product.id)}
                onActivate={() => setActive(i)}
              />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Flechas */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            disabled={active === 0}
            aria-label="Producto anterior"
            className={`${arrowClass} left-0 sm:left-1`}
            style={arrowStyle}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={active === count - 1}
            aria-label="Producto siguiente"
            className={`${arrowClass} right-0 sm:right-1`}
            style={arrowStyle}
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      {/* Puntos indicadores */}
      {count > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          {products.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Ir al producto ${i + 1} de ${count}`}
              aria-current={i === active}
              className="hit-expand flex h-11 w-11 items-center justify-center rounded-full -m-1.5"
            >
              {/* Barra visible + área táctil amplia (h-8) sin cambiar el diseño */}
              <span
                className="block rounded-full transition-all duration-500 ease-in-out"
                style={{
                  width: i === active ? 28 : 8,
                  height: 8,
                  background:
                    i === active
                      ? 'linear-gradient(90deg, var(--c-primary), var(--c-primary-deep))'
                      : 'rgba(var(--c-ink-rgb), 0.18)',
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
