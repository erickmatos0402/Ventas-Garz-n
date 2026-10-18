import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  Banknote,
  AlertCircle,
  CheckCircle,
  Loader2,
  ShoppingBasket,
  Store,
  Truck,
  Phone,
  Lock,
  Landmark,
} from 'lucide-react';
import { useAuthStore, useCartStore, useThemeStore } from '../store';
import { SlideUp } from '../utils/animations';
import { formatPrice } from '../utils';
import { getDiscountedPrice } from '../data/mockData';
import { orderService } from '../services/orders';

type DeliveryMode = 'pickup' | 'delivery';
type PaymentMode = 'cash' | 'transfer';

/** Al pagar por transferencia el cliente adelanta este porcentaje del total. */
const TRANSFER_ADVANCE = 0.2;

export const CheckoutPage: React.FC = () => {
  const theme = useThemeStore((s) => s.theme);
  const user = useAuthStore((s) => s.user);
  const cart = useCartStore(theme);
  const { items, clearCart } = cart()
  const navigate = useNavigate();

  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('pickup');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Precio unitario con descuento: es el mismo que recalcula `create_order`
  // en Supabase, así lo que se muestra aquí coincide con lo que se cobra.
  const unitPrice = (item: any) => getDiscountedPrice(item);

  const subtotal = items.reduce((sum: number, item: any) => sum + unitPrice(item) * item.quantity, 0);
  const tax = Math.round(subtotal * 0.2);
  const deliveryFee = deliveryMode === 'delivery' ? 5000 : 0;
  const total = subtotal + tax + deliveryFee;
  // Importe que se paga por adelantado al elegir transferencia (20% del total).
  const transferAdvance = total * TRANSFER_ADVANCE;
  const transferBalance = total - transferAdvance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('Inicia sesión para confirmar tu pedido');
      return;
    }

    if (deliveryMode === 'delivery' && address.trim().length < 10) {
      setError('Escribe una dirección completa para la entrega a domicilio');
      return;
    }

    setLoading(true);

    try {
      // El pedido se guarda en Supabase: `create_order` valida stock,
      // calcula los importes y descuenta las unidades en una transacción.
      const order = await orderService.create({
        items: items.map((item: any) => ({ productId: item.id, quantity: item.quantity })),
        shippingAddress: deliveryMode === 'delivery' ? address : undefined,
        phone,
        deliveryMode,
        paymentMode,
      });

      setOrderId(order.id);
      clearCart();
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Error al procesar el pedido');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !success) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 py-16">
        <div className="text-center">
          <SlideUp>
            <div className="liquid-badge w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBasket size={44} className="text-primary" />
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-dark mb-3">Tu carrito está vacío</h1>
            <p className="text-gray-500 mb-8">Agrega productos para realizar un pedido</p>
            <Link to="/products" className="btn-liquid inline-block px-8 py-3">
              Ver Productos
            </Link>
          </SlideUp>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 py-16">
        <SlideUp>
          <div className="glass-strong rounded-3xl p-6 sm:p-8 max-w-md text-center w-full">
            <motion.div
              animate={{ scale: [0.8, 1.1, 1] }}
              transition={{ duration: 0.5 }}
              className="w-16 h-16 bg-primary/15 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle size={32} className="text-primary-deep" />
            </motion.div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-dark mb-2">¡Pedido Confirmado!</h2>
            {orderId && (
              <p className="text-xs font-semibold tracking-wide text-gray-400 mb-2">
                Pedido #{orderId.slice(0, 8).toUpperCase()}
              </p>
            )}
            <p className="text-gray-500 mb-6">
              Gracias por tu compra. Te llamaremos al {phone || 'tu teléfono'} para coordinar{' '}
              {deliveryMode === 'pickup' ? 'la recogida en tienda' : 'la entrega a domicilio'}.
              {paymentMode === 'transfer' && (
                <>
                  {' '}Te enviaremos los datos de la cuenta para adelantar por transferencia{' '}
                  <span className="font-semibold text-primary-deep">{formatPrice(transferAdvance)}</span> (20% del total).
                </>
              )}
            </p>
            <button onClick={() => navigate('/products')} className="btn-liquid w-full py-3">
              Seguir Comprando
            </button>
          </div>
        </SlideUp>
      </div>
    );
  }

  return (
    <div className="min-h-dvh pt-10 sm:pt-20 pb-24 sm:pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SlideUp>
          <p className="heading-eyebrow">Último paso</p>
          <h1 className="heading-page text-3xl sm:text-4xl md:text-5xl mb-2">Finalizar Compra</h1>
          <p className="text-gray-500 mb-8">Completa tus datos para coordinar tu pedido</p>
        </SlideUp>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="glass-strong rounded-3xl p-5 sm:p-6 space-y-6">
              {/* Modo de entrega como burbujas seleccionables */}
              <div>
                <h2 className="text-xl font-bold text-dark mb-4 flex items-center gap-2">
                  <Truck size={20} className="text-primary" />
                  ¿Cómo lo recibes?
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([
                    {
                      id: 'pickup' as DeliveryMode,
                      icon: <Store size={20} />,
                      title: 'Recogida en tienda',
                      subtitle: 'Gratis · Santiago de Cuba',
                    },
                    {
                      id: 'delivery' as DeliveryMode,
                      icon: <Truck size={20} />,
                      title: 'Entrega a domicilio',
                      subtitle: `${formatPrice(5000)} · según zona`,
                    },
                  ]).map((mode) => {
                    const selected = deliveryMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setDeliveryMode(mode.id)}
                        className={`relative rounded-2xl p-4 text-left transition cursor-pointer ${
                          selected
                            ? 'liquid-tab-blob !rounded-2xl ring-2 ring-primary'
                            : 'liquid-badge hover:scale-[1.02]'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${selected ? 'bg-primary text-white' : 'bg-white/70 text-primary-deep'}`}>
                            {mode.icon}
                          </span>
                          <span>
                            <span className="block font-bold text-dark text-sm">{mode.title}</span>
                            <span className="block text-xs text-gray-500 mt-0.5">{mode.subtitle}</span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contacto */}
              <div>
                <h2 className="text-xl font-bold text-dark mb-4 flex items-center gap-2">
                  <Phone size={20} className="text-primary" />
                  Datos de contacto
                </h2>
                <div className="space-y-3">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Teléfono para coordinar la entrega"
                    className="w-full px-4 py-2.5 rounded-full bg-white/60 border border-white/70 outline-none focus:ring-2 focus:ring-primary/60 text-sm"
                  />
                  {deliveryMode === 'delivery' && (
                    <motion.textarea
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      required
                      minLength={10}
                      placeholder="Barrio, calle y punto de referencia para la entrega..."
                      className="w-full px-4 py-3 rounded-2xl bg-white/60 border border-white/70 outline-none focus:ring-2 focus:ring-primary/60 text-sm resize-none"
                    />
                  )}
                  {deliveryMode === 'pickup' && (
                    <div className="liquid-badge rounded-2xl p-4 flex items-start gap-3 text-sm text-gray-600">
                      <MapPin size={18} className="text-primary flex-shrink-0 mt-0.5" />
                      Recoge en Santiago de Cuba. Te avisamos cuando tu pedido esté listo (normalmente el mismo día).
                    </div>
                  )}
                </div>
              </div>

              {/* Pago */}
              <div>
                <h2 className="text-xl font-bold text-dark mb-4 flex items-center gap-2">
                  <Banknote size={20} className="text-primary" />
                  Método de Pago
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([
                    {
                      id: 'cash' as PaymentMode,
                      icon: <Banknote size={20} />,
                      title: 'Efectivo contra entrega',
                      subtitle: 'Pagas el 100% al recibir',
                    },
                    {
                      id: 'transfer' as PaymentMode,
                      icon: <Landmark size={20} />,
                      title: 'Transferencia bancaria',
                      subtitle: `Adelantas el 20% (${formatPrice(transferAdvance)})`,
                    },
                  ]).map((mode) => {
                    const selected = paymentMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setPaymentMode(mode.id)}
                        className={`relative rounded-2xl p-4 text-left transition cursor-pointer ${
                          selected
                            ? 'liquid-tab-blob !rounded-2xl ring-2 ring-primary'
                            : 'liquid-badge hover:scale-[1.02]'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${selected ? 'bg-primary text-white' : 'bg-white/70 text-primary-deep'}`}>
                            {mode.icon}
                          </span>
                          <span>
                            <span className="block font-bold text-dark text-sm">{mode.title}</span>
                            <span className="block text-xs text-gray-500 mt-0.5">{mode.subtitle}</span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {paymentMode === 'transfer' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 liquid-badge rounded-2xl p-4 flex items-start gap-3 text-sm text-gray-600">
                      <Landmark size={18} className="text-primary flex-shrink-0 mt-0.5" />
                      Adelantas el 20% del total por transferencia bancaria y el resto lo pagas
                      {' '}al recibir tu pedido. Te enviamos los datos de la cuenta para completar el pago.
                    </div>
                  </motion.div>
                )}
              </div>

              {error && (
                <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-2xl flex items-start space-x-2 text-sm">
                  <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!user && (
                <div className="bg-primary/5 border border-primary/30 text-primary-deep px-4 py-3 rounded-2xl flex items-start gap-2 text-sm">
                  <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <span>
                    Necesitas una cuenta para confirmar el pedido.{' '}
                    <Link to="/login" className="font-bold underline">
                      Inicia sesión o regístrate
                    </Link>
                    .
                  </span>
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="btn-liquid w-full py-3.5 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={16} />}
                {loading ? 'Procesando pedido...' : 'Confirmar Pedido'}
              </motion.button>
            </form>
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            {/* sticky solo en escritorio: en móvil una columna sticky solo estorba */}
            <div className="glass-strong rounded-3xl p-5 sm:p-6 lg:sticky lg:top-24">
              <h2 className="text-xl font-bold text-dark mb-4">Tu Pedido</h2>

              <div className="space-y-3 mb-4 max-h-56 overflow-y-auto pr-1">
                {items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-xl bg-white/70 border border-white/80 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <span className="text-lg">{item.emoji || '🛒'}</span>
                      {item.image && (
                        <img
                          src={item.image}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover object-center"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      )}
                    </div>
                    <span className="text-sm text-dark flex-1 min-w-0 truncate">
                      {item.name} <span className="text-gray-400">× {item.quantity}</span>
                    </span>
                    <span className="text-sm font-semibold text-dark whitespace-nowrap">
                      {formatPrice(unitPrice(item) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 border-t border-white/70 pt-4 text-sm">
                <div className="flex justify-between text-dark">
                  <span>Subtotal:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-dark">
                  <span>Impuesto (20%):</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                {deliveryMode === 'delivery' && (
                  <div className="flex justify-between text-dark">
                    <span>Envío:</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-dark pt-2 border-t border-white/70">
                  <span>Total:</span>
                  <span className="text-primary-deep">{formatPrice(total)}</span>
                </div>

                {paymentMode === 'transfer' && (
                  <div className="mt-3 rounded-2xl bg-white/50 border border-white/70 p-3 space-y-1.5">
                    <div className="flex justify-between text-sm text-dark">
                      <span>Pago por transferencia (20%):</span>
                      <span className="font-bold text-primary-deep">{formatPrice(transferAdvance)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Resto al recibir:</span>
                      <span>{formatPrice(transferBalance)}</span>
                    </div>
                  </div>
                )}
              </div>

              <p className="mt-4 text-xs text-gray-400 text-center">Tu pedido quedará registrado en tu cuenta</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
