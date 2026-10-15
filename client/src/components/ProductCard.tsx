import React from 'react';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Check } from 'lucide-react';
import { Product } from '../types';
import { formatPrice, trackBubblePointer, resetBubblePointer } from '../utils';
import { useCartStore } from '../store';
import { useThemeStore } from '../store';
import { useImageWithFallback } from '../hooks/useImageWithFallback';
import { getDiscountedPrice } from '../data/mockData';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, quantity: number) => void;
  /**
   * Selector de cantidad. En "Productos Destacados" se oculta: ahí solo se
   * agrega al carrito, y la cantidad se elige en Tienda.
   */
  showQuantity?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, showQuantity = true }) => {
  const theme = useThemeStore((s) => s.theme);
  const cart = useCartStore(theme);
  const { addItem } = cart()
  const [quantity, setQuantity] = React.useState(1);
  const [justAdded, setJustAdded] = React.useState(false);
  const { src, onError } = useImageWithFallback(product.image, product.fallbackImage);

  const finalPrice = getDiscountedPrice(product);

  // En pantallas táctiles no hay hover real: sin este guard el efecto
  // "se pegaría" tras tocar la tarjeta.
  const [canHover, setCanHover] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setCanHover(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, quantity);
    } else {
      addItem(product, quantity);
    }
    setQuantity(1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <motion.div
      whileHover={canHover ? { y: -3 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      onPointerMove={trackBubblePointer}
      onPointerLeave={resetBubblePointer}
      className="ios-glass bubble-hl rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col h-full"
    >
      {/* Imagen del producto: ventana ancha con relación fija, recorta con object-cover */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-white/60">
        <img
          src={src}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover object-center cursor-pointer"
          onError={onError}
        />
      </div>
      {/* La tarjeta debe caber en dos columnas de móvil: tipografía y aire
          se reducen por debajo de `sm` para que quepan la foto, el precio,
          la cantidad y el botón sin apilarse en una sola columna. */}
      <div className="p-3 sm:p-5 flex flex-col flex-1">
        <h3 className="font-bold text-[13px] sm:text-lg text-dark mb-1 sm:mb-1.5 line-clamp-2 leading-tight">{product.name}</h3>
        <p className="text-gray-500 text-[11px] sm:text-sm mb-2 sm:mb-3 line-clamp-2 leading-snug">{product.description}</p>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center space-x-0.5 sm:space-x-1 mb-2 sm:mb-3">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < Math.floor(product.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
              />
            ))}
            <span className="text-xs text-gray-500 ml-1">({product.reviews || 0})</span>
          </div>
        )}

        {/* Precio */}
        <div className="mb-2.5 sm:mb-4">
          {product.discount ? (
            <>
              <p className="text-[11px] sm:text-sm text-gray-400 line-through">{formatPrice(product.price)}</p>
              <p className="text-base sm:text-2xl font-bold text-primary-deep leading-tight">{formatPrice(finalPrice)}</p>
            </>
          ) : (
            <p className="text-base sm:text-2xl font-bold text-primary-deep leading-tight">{formatPrice(product.price)}</p>
          )}
          <p className={`text-[11px] sm:text-xs ${product.stock > 0 ? 'text-gray-500' : 'text-danger font-semibold'}`}>
            {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
          </p>
        </div>

        {/* Cantidad y acción: en columnas estrechas van uno debajo del otro,
            en cuanto hay ancho suficiente vuelven a la misma fila. */}
        <div className="mt-auto flex flex-col min-[400px]:flex-row items-stretch min-[400px]:items-center gap-2">
          {showQuantity && (
          <div className="liquid-badge flex items-center justify-center min-[400px]:justify-start rounded-full px-1 min-[400px]:flex-shrink-0">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="hit-expand flex-1 min-[400px]:flex-none w-9 h-9 rounded-full text-dark hover:bg-white/70 transition text-lg leading-none"
              disabled={product.stock === 0}
              aria-label="Restar cantidad"
            >
              −
            </button>
            <span className="w-7 sm:w-8 text-center font-bold text-dark text-sm">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              className="hit-expand flex-1 min-[400px]:flex-none w-9 h-9 rounded-full text-dark hover:bg-white/70 transition text-lg leading-none"
              disabled={product.stock === 0}
              aria-label="Sumar cantidad"
            >
              +
            </button>
          </div>
          )}
          <motion.button
            whileTap={{ scale: product.stock > 0 ? 0.95 : 1 }}
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`btn-liquid flex-1 min-[400px]:py-2.5 py-3 text-[13px] sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 disabled:cursor-not-allowed ${justAdded ? 'text-primary-deep' : ''}`}
          >
            {justAdded ? <Check size={17} /> : <ShoppingCart size={17} />}
            <span>{product.stock === 0 ? 'Agotado' : justAdded ? '¡Añadido!' : 'Agregar'}</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
