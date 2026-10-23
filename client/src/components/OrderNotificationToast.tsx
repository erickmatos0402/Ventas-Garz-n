import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BellRing, X } from 'lucide-react';
import {
  ORDER_NOTIFICATION_EVENT,
  type OrderNotificationPayload,
} from '../utils/notifications';

/**
 * Aviso flotante de pedido completado. Escucha el evento interno que
 * dispara `notifyOrderCompleted` y se muestra aunque el navegador tenga
 * las notificaciones del sistema bloqueadas. Vive en el shell de la app,
 * así funciona igual en la tienda y en el panel de administración.
 */
export const OrderNotificationToast: React.FC = () => {
  const [payload, setPayload] = useState<OrderNotificationPayload | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onNotify = (event: Event) => {
      const detail = (event as CustomEvent<OrderNotificationPayload>).detail;
      if (!detail) return;
      setPayload(detail);
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setPayload(null), 6000);
    };

    window.addEventListener(ORDER_NOTIFICATION_EVENT, onNotify);
    return () => {
      window.removeEventListener(ORDER_NOTIFICATION_EVENT, onNotify);
      window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="fixed left-0 right-0 top-20 sm:top-24 z-[80] flex justify-center px-4 pointer-events-none">
      <AnimatePresence>
        {payload && (
          <motion.div
            key="order-notification"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="glass-strong rounded-2xl px-4 py-3 flex items-start gap-3 w-full max-w-sm pointer-events-auto shadow-glass-lg"
          >
            <span
              className="w-9 h-9 rounded-full grid place-items-center text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--c-sig-1), var(--c-sig-3))' }}
              aria-hidden
            >
              <BellRing size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold text-dark text-sm leading-tight">{payload.title}</p>
              <p className="text-xs text-gray-600 leading-snug mt-0.5">{payload.body}</p>
            </div>
            <button
              type="button"
              onClick={() => setPayload(null)}
              className="tap-icon text-gray-400 hover:text-dark transition flex-shrink-0"
              aria-label="Cerrar aviso"
            >
              <X size={17} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
