import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Phone, Mail, Clock } from 'lucide-react';

/**
 * ContactBubble — burbuja flotante de contacto. Acceso rápido desde
 * cualquier página a teléfono, email y horario de la tienda.
 */
export const ContactBubble: React.FC = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-[70] flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="glass-strong rounded-3xl p-5 w-72 shadow-glass-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-dark">¿Necesitas ayuda?</p>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-dark transition"
                aria-label="Cerrar contacto"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2.5 text-sm">
              <a href="tel:+5356072398" className="flex items-center gap-2.5 text-dark hover:text-primary-deep transition">
                <span className="w-8 h-8 rounded-full bg-mint flex items-center justify-center">
                  <Phone size={15} className="text-primary-deep" />
                </span>
                +53 56072398
              </a>
              <a href="mailto:info@ventasgarzon.com" className="flex items-center gap-2.5 text-dark hover:text-primary-deep transition">
                <span className="w-8 h-8 rounded-full bg-mint flex items-center justify-center">
                  <Mail size={15} className="text-primary-deep" />
                </span>
                info@ventasgarzon.com
              </a>
              <div className="flex items-center gap-2.5 text-gray-500">
                <span className="w-8 h-8 rounded-full bg-mint flex items-center justify-center">
                  <Clock size={15} className="text-primary-deep" />
                </span>
                Lun a Sáb · 8:00 am – 6:00 pm
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full btn-liquid flex items-center justify-center shadow-glass-lg z-10"
        aria-label="Contacto rápido"
      >
        {open ? <X size={22} className="text-primary-deep" /> : <MessageCircle size={22} className="text-primary-deep" />}
      </motion.button>
    </div>
  );
};
