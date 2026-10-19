import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle, Phone } from 'lucide-react';

const faqs = [
  {
    question: '¿Cómo realizo un pedido?',
    answer:
      'Busca el producto en el catálogo, agrégalo al carrito y completa tus datos en el checkout. Recibirás una llamada para confirmar todo.',
  },
  {
    question: '¿Puedo recoger mi pedido en tienda?',
    answer:
      'Sí. Todos los pedidos se recogen en tienda, sin costo de envío. Al confirmar, tu pedido queda listo en 1 hora y tienes una ventana de 1 hora para recogerlo.',
  },
  {
    question: '¿Cómo puedo pagar?',
    answer:
      'Puedes pagar en efectivo presencial al recoger, o por transferencia bancaria. La transferencia incluye un recargo del 30% sobre el subtotal. No se cobran impuestos.',
  },
  {
    question: '¿Hay entrega a domicilio?',
    answer:
      'Por ahora el flujo es solo recogida en tienda en Santiago de Cuba. Así garantizamos que tu pedido esté listo en una hora.',
  },
  {
    question: '¿Puedo comprar al por mayor?',
    answer:
      'Claro, en Ventas Garzón atendemos clientes mayoristas y minoristas con precios especiales. Escríbenos para armar tu cotización.',
  },
  {
    question: '¿Cuándo puedo recoger mi pedido?',
    answer:
      'Al confirmar el pedido se marca una ventana de 1 hora: la hora exacta aparece en pantalla y se añade al mensaje de WhatsApp de la tienda.',
  },
  {
    question: '¿Los productos agotados tienen fecha de reposición?',
    answer:
      'En la tienda verás si un producto está en espera de abastecimiento y, cuando la tienda lo indica, los días estimados de reposición.',
  },
  {
    question: '¿Puedo calificar un producto?',
    answer:
      'Sí. Inicia sesión, abre la ficha del producto y deja tu calificación y comentario. Puedes editar tu reseña más adelante.',
  },
  {
    question: '¿Cómo contacto al soporte?',
    answer:
      'Usa la burbuja verde de contacto en cualquier página, llámanos al +53 56072398 o escríbenos a info@ventasgarzon.com.',
  },
];

export const FAQPage: React.FC = () => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  return (
    <div className="min-h-dvh pt-10 sm:pt-20 pb-24 sm:pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <p className="heading-eyebrow">Preguntas Frecuentes</p>
          <h1 className="heading-page mt-3 text-2xl min-[400px]:text-3xl sm:text-4xl md:text-5xl mb-3 text-balance">¿Tienes dudas? Estamos para ayudarte</h1>
          <p className="text-gray-500 mb-10">Respuestas rápidas sobre pedidos, entregas y pagos</p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`rounded-3xl overflow-hidden transition-shadow ${isOpen ? 'glass-strong shadow-glass-lg' : 'liquid-badge'}`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-5 text-left min-h-[3.5rem]"
                  aria-expanded={isOpen}
                >
                  <span className="font-display font-bold text-dark min-w-0">{faq.question}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isOpen ? 'bg-primary text-white' : 'bg-white/70 text-primary-deep'}`}
                  >
                    <ChevronDown size={16} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 sm:px-6 pb-6 text-gray-600 leading-relaxed">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Contacto final */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grove-theme liquid-border rounded-3xl p-6 sm:p-8 mt-12 text-center"
        >
          <h2 className="font-display text-2xl font-bold mb-2">¿Sigues con dudas?</h2>
          <p className="text-emerald-100/80 mb-6">Escríbenos y te respondemos el mismo día</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="tel:+5356072398" className="btn-grove inline-flex items-center justify-center gap-2 px-6 py-3">
              <Phone size={17} />
              Llamar ahora
            </a>
            <a href="mailto:info@ventasgarzon.com" className="grove-chip inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-bold text-emerald-50 hover:bg-white/10 transition">
              <MessageCircle size={17} />
              Enviar correo
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
