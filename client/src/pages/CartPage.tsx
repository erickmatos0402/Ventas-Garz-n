import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, Plus, Minus, ShoppingBasket, Truck, Lock } from 'lucide-react';
import { useCartStore } from '../store';
import { useThemeStore } from '../store';
import { SlideUp, containerVariants, itemVariants } from '../utils/animations';
import { formatPrice } from '../utils';

export const CartPage: React.FC = () => {
  const theme = useThemeStore((s) => s.theme);
  const cart = useCartStore(theme);
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = cart()
  const navigate = useNavigate();
  const total = getTotalPrice();
  const FREE_SHIPPING_THRESHOLD = 20000;
  const missingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - total);

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 pb-16">
        <div className="text-center px-4">
          <SlideUp>
            <div className="liquid-badge w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBasket size={44} className="text-primary" />
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-dark mb-3">Tu carrito está vacío</h1>
            <p className="text-gray-500 mb-8">Agrega productos para comenzar tu compra</p>
            <Link to="/products" className="btn-liquid inline-block px-8 py-3">
              Explorar Productos
            </Link>
          </SlideUp>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SlideUp>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-dark mb-8">Mi Carrito</h1>
        </SlideUp>

        {/* Barra de envío gratis */}
        <SlideUp delay={0.05}>
          <div className="glass-panel rounded-full px-5 py-3 mb-8 flex items-center gap-3">
            <Truck size={18} className="text-primary flex-shrink-0" />
            {missingForFreeShipping > 0 ? (
              <p className="text-sm text-dark">
                Te faltan <span className="font-bold text-primary-deep">{formatPrice(missingForFreeShipping)}</span> para el envío gratis
              </p>
            ) : (
              <p className="text-sm font-bold text-primary-deep">¡Tienes envío gratis en este pedido! 🎉</p>
            )}
          </div>
        </SlideUp>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  layout
                  className="glass-panel rounded-3xl p-5 flex flex-col sm:flex-row gap-5"
                >
                  {/* Miniatura real del producto (con emoji de respaldo) */}
                  <div className="relative w-full sm:w-24 h-24 flex-shrink-0 bg-white/60 border border-white/70 rounded-2xl overflow-hidden flex items-center justify-center">
                    <span className="text-3xl">{item.emoji || '🛒'}</span>
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="absolute inset-0 w-full h-full object-cover object-center"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-dark">{item.name}</h3>
                    <p className="text-gray-500 text-sm mb-2 line-clamp-1">{item.description}</p>
                    <p className="font-bold text-primary-deep">{formatPrice(item.price)}</p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="btn-liquid-ghost text-danger p-3 sm:p-2.5"
                      aria-label={`Eliminar ${item.name}`}
                    >
                      <Trash2 size={18} />
                    </button>

                    <div className="liquid-badge flex items-center rounded-full px-1">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-10 h-10 sm:w-9 sm:h-9 rounded-full hover:bg-white/70 transition flex items-center justify-center"
                        aria-label="Restar"
                      >
                        <Minus size={15} />
                      </button>
                      <span className="px-3 font-bold text-dark text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-10 h-10 sm:w-9 sm:h-9 rounded-full hover:bg-white/70 transition flex items-center justify-center"
                        aria-label="Sumar"
                      >
                        <Plus size={15} />
                      </button>
                    </div>

                    <p className="font-bold text-dark">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <SlideUp delay={0.15}>
              <div className="glass-strong rounded-3xl p-6 sticky top-24">
                <h2 className="font-display text-2xl font-bold text-dark mb-6">Resumen</h2>

                <div className="space-y-3 mb-6 border-b border-white/70 pb-6">
                  <div className="flex justify-between text-dark">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-dark">
                    <span>Impuesto (19%):</span>
                    <span className="font-semibold">{formatPrice(total * 0.19)}</span>
                  </div>
                </div>

                <div className="flex justify-between text-2xl font-bold text-dark mb-6">
                  <span>Total:</span>
                  <span className="text-primary-deep">{formatPrice(total * 1.19)}</span>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/checkout')}
                  className="btn-liquid w-full py-3 mb-3 flex items-center justify-center gap-2"
                >
                  <Lock size={16} />
                  Proceder al Pago
                </motion.button>

                <button
                  onClick={() => navigate('/products')}
                  className="btn-liquid-ghost w-full py-3 mb-3 text-primary-deep"
                >
                  Seguir Comprando
                </button>

                <button
                  onClick={clearCart}
                  className="btn-liquid-ghost w-full text-danger text-sm py-2.5"
                >
                  Vaciar Carrito
                </button>
              </div>
            </SlideUp>
          </div>
        </div>
      </div>
    </div>
  );
};
