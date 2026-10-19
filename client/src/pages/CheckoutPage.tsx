import React, { useEffect, useState } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  Banknote,
  AlertCircle,
  CheckCircle,
  Loader2,
  ShoppingBasket,
  Store,
  Phone,
  Lock,
  Landmark,
  Clock,
} from 'lucide-react';
import { useAuthStore, useCartStore, useThemeStore } from '../store';
import { SlideUp } from '../utils/animations';
import { formatPrice, getPickupWindow } from '../utils';
import { getDiscountedPrice } from '../data/mockData';
import { orderService } from '../services/orders';
import type { OrderRow } from '../types/database';

type PaymentMode = 'cash' | 'transfer';

/** Recargo que se suma al total cuando el pago es por transferencia. */
const TRANSFER_SURCHARGE_RATE = 0.3;

/** Número de WhatsApp de la tienda (país +53, sin signos ni espacios). */
const WHATSAPP_NUMBER = '5356072398';

/**
 * Mensaje que se envía al WhatsApp de la tienda al confirmar un pedido.
 * Usa los importes que calculó `create_order` en Supabase (el `order`
 * devuelto por la RPC), nunca los que calculó el navegador.
 */
function buildWhatsAppMessage(input: {
  order: OrderRow;
  orderRef: string;
  items: any[];
  paymentMode: PaymentMode;
  phone: string;
  customer: string;
}): string {
  const { order, orderRef, items, paymentMode, phone, customer } = input;
  const money = (value: any) => formatPrice(Number(value) || 0);
  const lines = items.map(
    (item) => `• ${item.name} × ${item.quantity} — ${money(getDiscountedPrice(item) * item.quantity)}`
  );
  const pickup = getPickupWindow(order.pickup_ready_at);
  const transferFee = Number(order.transfer_fee) || 0;

  const details = [
    '*Nuevo pedido* — Ventas Garzón',
    `Pedido: ${orderRef}`,
    customer ? `Cliente: ${customer}` : null,
    phone ? `Teléfono: ${phone}` : null,
    '',
    '*Productos*',
    ...lines,
    '',
    `Subtotal: ${money(order.subtotal)}`,
    transferFee > 0 ? `Recargo transferencia (30%): ${money(transferFee)}` : null,
    `*Total: ${money(order.total)}*`,
    'Impuestos: no se cobran',
    '',
    'Entrega: Recogida en tienda (Santiago de Cuba)',
    `Listo para recoger: ${pickup.dayLabel}, ${pickup.startTime}`,
    `Recoge antes de: ${pickup.endTime} (ventana de 1 hora)`,
    paymentMode === 'transfer'
      ? 'Pago: Transferencia bancaria (incluye 30% de recargo)'
      : 'Pago: Efectivo presencial al recoger',
  ].filter((line): line is string => line !== null);

  return details.join('\n');
}

export const CheckoutPage: React.FC = () => {
  const theme = useThemeStore((s) => s.theme);
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const cart = useCartStore(theme);
  const { items, clearCart } = cart();
  const navigate = useNavigate();

  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [success, setSuccess] = useState(false);
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  // Confirmado el pedido: el navegador va directo al chat de WhatsApp con
  // el pedido ya escrito. La pausa deja leer la ventana de recogida; si el
  // usuario se mueve antes, se cancela y la pantalla queda como respaldo.
  useEffect(() => {
    if (!whatsappUrl) return;
    const timer = window.setTimeout(() => {
      window.location.href = whatsappUrl;
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [whatsappUrl]);

  // Precio unitario con descuento: es el mismo que recalcula `create_order`
  // en Supabase, así lo que se muestra aquí coincide con lo que se cobra.
  const unitPrice = (item: any) => getDiscountedPrice(item);

  const subtotal = items.reduce((sum: number, item: any) => sum + unitPrice(item) * item.quantity, 0);
  // Sin impuestos ni envío: solo existe el recargo del 30% por transferencia.
  const transferFee = paymentMode === 'transfer' ? Math.round(subtotal * TRANSFER_SURCHARGE_RATE) : 0;
  const total = subtotal + transferFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('Inicia sesión para confirmar tu pedido');
      return;
    }

    setLoading(true);

    try {
      // El pedido se guarda en Supabase: `create_order` valida stock,
      // calcula los importes y descuenta las unidades en una transacción.
      // El flujo actual es siempre recogida en tienda.
      const created = await orderService.create({
        items: items.map((item: any) => ({ productId: item.id, quantity: item.quantity })),
        phone,
        paymentMode,
      });

      setOrder(created);

      // Se arma el mensaje con el carrito todavía lleno y con los importes
      // reales que calculó la base de datos (incluida la hora de recogida).
      const orderRef = `#${created.id.slice(0, 8).toUpperCase()}`;
      const message = buildWhatsAppMessage({
        order: created,
        orderRef,
        items,
        paymentMode,
        phone,
        customer: user.name,
      });
      setWhatsappUrl(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`);

      clearCart();
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Error al procesar el pedido');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4">
        <p className="text-gray-500">Comprobando tu sesión…</p>
      </div>
    );
  }

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

  // Confirmar el pedido es una acción crítica: sin sesión se pide login.
  if (!user) {
    return <Navigate to="/login?next=/checkout" replace />;
  }

  if (success && order) {
    const pickup = getPickupWindow(order.pickup_ready_at);
    const transferFeePaid = Number(order.transfer_fee) || 0;

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
            <p className="text-xs font-semibold tracking-wide text-gray-400 mb-4">
              Pedido #{order.id.slice(0, 8).toUpperCase()}
            </p>

            <div className="liquid-badge rounded-2xl p-4 text-left mb-5">
              <p className="flex items-center gap-2 font-bold text-dark text-sm mb-1">
                <Clock size={16} className="text-primary" />
                Ventana de recogida (1 hora)
              </p>
              <p className="text-sm text-gray-600">
                Listo {pickup.dayLabel}, de{' '}
                <span className="font-bold text-primary-deep">{pickup.startTime}</span> a{' '}
                <span className="font-bold text-primary-deep">{pickup.endTime}</span>.
              </p>
              <p className="text-xs text-gray-400 mt-1">Hora de la tienda en Santiago de Cuba.</p>
            </div>

            <p className="text-gray-500 text-sm mb-5">
              Te estamos llevando al chat de WhatsApp con tu pedido y la hora de recogida.
              Hablamos al {phone || 'tu teléfono'} para coordinar.
            </p>

            <div className="rounded-2xl bg-white/50 border border-white/70 p-3 text-sm mb-5 space-y-1">
              <div className="flex justify-between text-dark">
                <span>Subtotal</span>
                <span>{formatPrice(Number(order.subtotal))}</span>
              </div>
              {transferFeePaid > 0 && (
                <div className="flex justify-between text-dark">
                  <span>Recargo transferencia (30%)</span>
                  <span>{formatPrice(transferFeePaid)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-dark pt-2 border-t border-white/70">
                <span>Total</span>
                <span className="text-primary-deep">{formatPrice(Number(order.total))}</span>
              </div>
              <p className="text-xs text-gray-500 text-center pt-1">
                {order.payment_mode === 'transfer'
                  ? 'Pago por transferencia bancaria'
                  : 'Pago en efectivo al recoger'}
              </p>
            </div>

            {whatsappUrl && (
              <a href={whatsappUrl} className="btn-liquid w-full py-3 mb-3 flex items-center justify-center">
                Abrir WhatsApp con mi pedido
              </a>
            )}
            <button onClick={() => navigate('/products')} className="btn-liquid-ghost w-full py-3">
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
              {/* Recogida en tienda (única modalidad) */}
              <div>
                <h2 className="text-xl font-bold text-dark mb-4 flex items-center gap-2">
                  <Store size={20} className="text-primary" />
                  Recogida en tienda
                </h2>
                <div className="rounded-2xl p-4 liquid-tab-blob !rounded-2xl ring-2 ring-primary">
                  <span className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-primary text-white">
                      <MapPin size={20} />
                    </span>
                    <span>
                      <span className="block font-bold text-dark text-sm">Santiago de Cuba</span>
                      <span className="block text-xs text-gray-500 mt-0.5">Gratis · sin envío</span>
                    </span>
                  </span>
                </div>
                <p className="mt-3 liquid-badge rounded-2xl p-4 flex items-start gap-3 text-sm text-gray-600">
                  <Clock size={18} className="text-primary flex-shrink-0 mt-0.5" />
                  Confirmado el pedido, tienes <strong className="font-bold">1 hora</strong> para recogerlo.
                  La hora exacta se añade al mensaje de WhatsApp.
                </p>
              </div>

              {/* Contacto */}
              <div>
                <h2 className="text-xl font-bold text-dark mb-4 flex items-center gap-2">
                  <Phone size={20} className="text-primary" />
                  Datos de contacto
                </h2>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Teléfono para coordinar la recogida"
                  className="w-full px-4 py-2.5 rounded-full bg-white/60 border border-white/70 outline-none focus:ring-2 focus:ring-primary/60 text-sm"
                />
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
                      title: 'Efectivo presencial',
                      subtitle: 'Pagas el 100% al recoger',
                    },
                    {
                      id: 'transfer' as PaymentMode,
                      icon: <Landmark size={20} />,
                      title: 'Transferencia bancaria',
                      subtitle: `Incluye 30% de recargo (${formatPrice(transferFee || Math.round(subtotal * TRANSFER_SURCHARGE_RATE))})`,
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
                      El total incluye un recargo del <strong className="font-bold">30%</strong> por
                      transferencia. Te enviamos los datos de la cuenta para completar el pago.
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
                {paymentMode === 'transfer' && (
                  <div className="flex justify-between text-dark">
                    <span>Recargo transferencia (30%):</span>
                    <span>{formatPrice(transferFee)}</span>
                  </div>
                )}
                <p className="text-xs text-gray-400">No se cobran impuestos.</p>
                <div className="flex justify-between text-lg font-bold text-dark pt-2 border-t border-white/70">
                  <span>Total:</span>
                  <span className="text-primary-deep">{formatPrice(total)}</span>
                </div>

                <div className="mt-3 rounded-2xl bg-white/50 border border-white/70 p-3 text-xs text-gray-600 flex items-start gap-2">
                  <Clock size={15} className="text-primary flex-shrink-0 mt-0.5" />
                  <span>Recogida en tienda con ventana de 1 hora desde la confirmación.</span>
                </div>
              </div>

              <p className="mt-4 text-xs text-gray-400 text-center">Tu pedido quedará registrado en tu cuenta</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
