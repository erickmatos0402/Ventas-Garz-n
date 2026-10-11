import React from 'react';
import { motion } from 'framer-motion';
import { Star, ShoppingCart, Check } from 'lucide-react';
import { Product } from '../types';
import { formatPrice } from '../utils';
import { useCartStore } from '../store';
import { useThemeStore } from '../store';
import { useImageWithFallback } from '../hooks/useImageWithFallback';
import { getDiscountedPrice } from '../data/mockData';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, quantity: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const theme = useThemeStore((s) => s.theme);
  const cart = useCartStore(theme);
  const { addItem } = cart()
  const [quantity, setQuantity] = React.useState(1);
  const [justAdded, setJustAdded] = React.useState(false);
  const { src, onError } = useImageWithFallback(product.image, product.fallbackImage);

  const finalPrice = getDiscountedPrice(product);

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
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="glass-panel glass-hover rounded-2xl overflow-hidden flex flex-col h-full"
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
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-lg text-dark mb-1.5 line-clamp-2">{product.name}</h3>
        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{product.description}</p>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center space-x-1 mb-3">
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
        <div className="mb-4">
          {product.discount ? (
            <>
              <p className="text-sm text-gray-400 line-through">{formatPrice(product.price)}</p>
              <p className="text-2xl font-bold text-primary-deep">{formatPrice(finalPrice)}</p>
            </>
          ) : (
            <p className="text-2xl font-bold text-primary-deep">{formatPrice(product.price)}</p>
          )}
          <p className={`text-xs ${product.stock > 0 ? 'text-gray-500' : 'text-danger font-semibold'}`}>
            {product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}
          </p>
        </div>

        {/* Cantidad y acción */}
        <div className="mt-auto flex items-center gap-2">
          <div className="liquid-badge flex items-center rounded-full px-1">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded-full text-dark hover:bg-white/70 transition text-lg leading-none"
              disabled={product.stock === 0}
              aria-label="Restar cantidad"
            >
              −
            </button>
            <span className="w-8 text-center font-bold text-dark text-sm">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              className="w-8 h-8 rounded-full text-dark hover:bg-white/70 transition text-lg leading-none"
              disabled={product.stock === 0}
              aria-label="Sumar cantidad"
            >
              +
            </button>
          </div>
          <motion.button
            whileTap={{ scale: product.stock > 0 ? 0.95 : 1 }}
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`btn-liquid flex-1 py-2.5 flex items-center justify-center space-x-2 disabled:cursor-not-allowed ${justAdded ? 'text-primary-deep' : ''}`}
          >
            {justAdded ? <Check size={18} /> : <ShoppingCart size={18} />}
            <span>{product.stock === 0 ? 'Agotado' : justAdded ? '¡Añadido!' : 'Agregar'}</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
