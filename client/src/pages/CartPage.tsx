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
      <div className="min-h-dvh flex items-center justify-center px-4 py-16">
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
    <div className="min-h-dvh pt-10 sm:pt-20 pb-24 sm:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SlideUp>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-dark mb-8">Mi Carrito</h1>
        </SlideUp>

        {/* Barra de envío gratis */}
        <SlideUp delay={0.05}>
          {/* En teléfonos el texto salta de línea: un pill (rounded-full)
              recorta las esquinas, así que ahí va con radio normal. */}
          <div className="glass-panel rounded-2xl sm:rounded-full px-5 py-3 mb-8 flex items-center gap-3">
            <Truck size={18} className="text-primary flex-shrink-0" />
            {missingForFreeShipping > 0 ? (
              <p className="text-sm text-dark min-w-0 flex-1">
                Te faltan <span className="font-bold text-primary-deep">{formatPrice(missingForFreeShipping)}</span> para el envío gratis
              </p>
            ) : (
              <p className="text-sm font-bold text-primary-deep min-w-0 flex-1">¡Tienes envío gratis en este pedido! 🎉</p>
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
              className="grid grid-cols-2 min-[420px]:grid-cols-3 gap-2.5 sm:gap-3 items-stretch"
            >
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  layout
                  className="glass-panel rounded-xl p-2 flex flex-col"
                >
                  {/* Ficha compacta: la foto manda y el botón de eliminar se
                      superpone para no robarle alto a la tarjeta. */}
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-white/60 border border-white/70 flex items-center justify-center">
                    <span className="text-2xl">{item.emoji || '🛒'}</span>
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="absolute inset-0 w-full h-full object-cover object-center"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    )}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute top-1 right-1 z-10 rounded-full bg-white/85 text-danger p-1.5 shadow-sm hover:bg-white transition"
                      aria-label={`Eliminar ${item.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="mt-1.5 flex-1 min-w-0">
                    <h3 className="font-bold text-[12px] sm:text-[13px] text-dark leading-tight line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="mt-0.5 font-bold text-[12px] sm:text-[13px] text-primary-deep">
                      {formatPrice(item.price)}
                    </p>
                  </div>

                  <div className="mt-1.5 liquid-badge flex items-center justify-between rounded-full px-0.5">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="w-7 h-7 rounded-full hover:bg-white/70 transition flex items-center justify-center"
                      aria-label="Restar"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="px-1 font-bold text-dark text-[12px]">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-full hover:bg-white/70 transition flex items-center justify-center"
                      aria-label="Sumar"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <p className="mt-1 text-[11px] sm:text-xs font-bold text-dark text-right">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <SlideUp delay={0.15}>
              {/* sticky solo en escritorio (en móvil la columna única no lo necesita) */}
              <div className="glass-strong rounded-3xl p-5 sm:p-6 lg:sticky lg:top-24">
                <h2 className="font-display text-2xl font-bold text-dark mb-6">Resumen</h2>

                <div className="space-y-3 mb-6 border-b border-white/70 pb-6">
                  <div className="flex justify-between text-dark">
                    <span>Subtotal:</span>
                    <span className="font-semibold">{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-dark">
                    <span>Impuesto (20%):</span>
                    <span className="font-semibold">{formatPrice(total * 0.2)}</span>
                  </div>
                </div>

                <div className="flex justify-between text-2xl font-bold text-dark mb-6">
                  <span>Total:</span>
                  <span className="text-primary-deep">{formatPrice(total * 1.2)}</span>
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
                  className="btn-liquid-ghost w-full text-danger text-sm py-3"
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
