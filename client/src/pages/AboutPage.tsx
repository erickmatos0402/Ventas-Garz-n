import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, Users, Wallet, Sparkles, Tag, Recycle, Gem, Ruler } from 'lucide-react';
import { useThemeStore } from '../store';
import { STORE_META_DATA } from '../data/boutiqueData';

const CONTENT = {
  market: {
    title: 'Ventas Garzón es tu aliado en aseo y alimentos',
    intro:
      'Somos una tienda enfocada en calidad, precio justo y atención personalizada. Nuestro objetivo es facilitar la compra de productos de limpieza y alimentos tanto para consumidores como para negocios.',
    pillars: [
      { title: 'Mayorista y Minorista', description: 'Compras al por mayor y detalle con precios competitivos.' },
      { title: 'Compra confiable', description: 'Pedidos listos rápido para recoger en tienda.' },
      { title: 'Atención local', description: 'Soporte cercano con una experiencia de compra segura.' },
    ],
    values: [
      { icon: <Leaf size={22} className="text-primary" />, title: 'Frescura garantizada', description: 'Rotamos el inventario constantemente para que siempre recibas productos frescos y vigentes.' },
      { icon: <Wallet size={22} className="text-primary" />, title: 'Precio justo', description: 'Compra directa con productores y distribuidores para ofrecerte el mejor precio posible.' },
      { icon: <Users size={22} className="text-primary" />, title: 'Confianza vecinal', description: 'Años atendiendo a las familias y negocios de Santiago de Cuba con la misma dedicación.' },
      { icon: <Sparkles size={22} className="text-primary" />, title: 'Selección cuidada', description: 'Cada producto del catálogo está probado y aprobado por nosotros antes de ofrecerlo.' },
    ],
    stats: [
      { value: '+500', label: 'Familias atendidas' },
      { value: '+50', label: 'Productos en catálogo' },
      { value: '24h', label: 'Tiempo máximo de entrega' },
    ],
    statsTitle: 'Ventas Garzón en números',
    ctaSecondary: 'Preguntas Frecuentes',
  },
  boutique: {
    title: 'Garzón Chic: moda con historia a precio de garaje',
    intro:
      'Nacimos como una venta de garaje familiar y hoy somos tu boutique online de segundas oportunidades. Curamos cada prenda y accesorio: solo entra a nuestro catálogo lo que nosotros mismos usaríamos.',
    pillars: [
      { title: 'Pieza única', description: 'Cada prenda es una sola. Si te gusta, no lo dejes pasar.' },
      { title: 'Curaduría real', description: 'Revisamos, limpiamos y fotografiamos cada artículo a mano.' },
      { title: 'Precio de garaje', description: 'Hasta 70% menos que lo que costaría nuevo.' },
    ],
    values: [
      { icon: <Tag size={22} className="text-primary" />, title: 'Gangas auténticas', description: 'Marcas y prendas a una fracción de su precio original, sin intermediarios.' },
      { icon: <Recycle size={22} className="text-primary" />, title: 'Moda sostenible', description: 'Alargar la vida de la ropa es la forma más chic de cuidar el planeta.' },
      { icon: <Ruler size={22} className="text-primary" />, title: 'Medidas honestas', description: 'Publicamos medidas reales y estado exacto de cada prenda, sin sorpresas.' },
      { icon: <Gem size={22} className="text-primary" />, title: 'Estilo curado', description: 'Seleccionamos con ojo de boutique: clásicos, statement y tesoros vintage.' },
    ],
    stats: [
      { value: '+300', label: 'Prendas con nueva historia' },
      { value: '70%', label: 'Ahorro promedio' },
      { value: '1a1', label: 'Revisión de cada pieza' },
    ],
    statsTitle: 'Garzón Chic en números',
    ctaSecondary: 'Cómo comprar',
  },
} as const;

export const AboutPage: React.FC = () => {
  const theme = useThemeStore((s) => s.theme);
  const meta = STORE_META_DATA[theme];
  const content = CONTENT[theme];

  return (
    <div className="min-h-dvh pt-10 sm:pt-20 pb-24 sm:pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-3xl p-5 sm:p-6 md:p-10"
        >
          <p className="heading-eyebrow break-words">Acerca de · {meta.name}</p>
          <h1 className="heading-page mt-4 text-2xl min-[400px]:text-3xl sm:text-4xl md:text-5xl">{content.title}</h1>
          <p className="mt-6 text-gray-600 leading-relaxed text-base sm:text-lg">{content.intro}</p>
          <div className="mt-8 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {content.pillars.map((item) => (
              <div key={item.title} className="liquid-badge rounded-3xl p-6">
                <h2 className="font-display text-xl font-bold text-primary-dark tracking-tight mb-2">{item.title}</h2>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link to="/products" className="btn-liquid px-6 py-3">
              Ver {theme === 'market' ? 'productos' : 'prendas'}
            </Link>
            <Link to="/faq" className="btn-liquid-ghost px-6 py-3">
              {content.ctaSecondary}
            </Link>
          </div>
        </motion.div>

        {/* Nuestros valores */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {content.values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="liquid-panel liquid-border rounded-3xl p-6 flex gap-4 glass-hover"
            >
              <div className="w-12 h-12 rounded-full liquid-badge flex items-center justify-center flex-shrink-0">
                {v.icon}
              </div>
              <div>
                <h2 className="font-display text-lg font-bold text-primary-dark mb-1">{v.title}</h2>
                <p className="text-gray-500 text-sm leading-relaxed">{v.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Cifras */}
        <div className="mt-12 grove-theme liquid-border rounded-3xl p-6 sm:p-8 md:p-10 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold mb-6 sm:mb-8">{content.statsTitle}</h2>
          <div className="grid grid-cols-3 gap-3 sm:gap-8">
            {content.stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl min-[400px]:text-3xl sm:text-4xl font-extrabold grove-accent mb-1">{stat.value}</p>
                <p className="grove-text-soft text-xs sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
