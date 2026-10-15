import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  ShieldCheck,
  BadgeCheck,
  ArrowRight,
  Search,
  Star,
  ShoppingBasket,
  Sparkles,
  Store,
  Truck,
  Wallet,
} from 'lucide-react';
import { SlideUp, containerVariants, itemVariants } from '../utils/animations';
import { useMockAdminStore, useThemeStore } from '../store';
import { Product } from '../types';
import { ProductCard, LiquidTabs, LogoMedallion } from '../components';
import { getDiscountedPrice } from '../data/mockData';
import { BOUTIQUE_PRODUCTS } from '../data/boutiqueData';
import { STORE_META_DATA } from '../data/boutiqueData';
import { formatPrice, trackBubblePointer, resetBubblePointer } from '../utils';

const BOUTIQUE_FALLBACK = BOUTIQUE_PRODUCTS;

/**
 * Bubble highlight (estilo iOS): el brillo especular sigue al puntero.
 * Los handlers escriben --mx / --my, que consume `.bubble-hl` en index.css.
 */
const bubbleProps = {
  onPointerMove: trackBubblePointer,
  onPointerLeave: resetBubblePointer,
};

/** Encabezado de sección: barra con el arco del medallón + título + bajada. */
const SectionHeading: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <SlideUp>
    <div className="mb-6 sm:mb-10 flex flex-col items-center gap-2.5 sm:gap-3.5 text-center">
      <span className="section-rule" aria-hidden />
      <h2 className="font-display text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-dark text-balance">
        {title}
      </h2>
      {subtitle && (
        <p className="text-gray-500 font-light text-sm sm:text-lg max-w-xl text-balance">{subtitle}</p>
      )}
    </div>
  </SlideUp>
);

export const LandingPage: React.FC = () => {
  const marketProducts = useMockAdminStore((s) => s.products);
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const meta = STORE_META_DATA[theme];
  const isMarket = theme === 'market';
  const products = isMarket ? marketProducts : BOUTIQUE_FALLBACK;
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [quickCategory, setQuickCategory] = React.useState('todos');

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(searchQuery.trim() ? `/products?q=${encodeURIComponent(searchQuery.trim())}` : '/products');
  };

  // Destacados según la pestaña líquida de la hero
  const featuredProducts = useMemo(() => {
    let list = [...products];
    if (quickCategory === 'ofertas') {
      list = list.filter((p) => !!p.discount);
    } else if (quickCategory !== 'todos') {
      list = list.filter((p) => p.category === quickCategory);
    }
    list.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    return list.slice(0, 6);
  }, [products, quickCategory]);

  // Las 2 mayores ofertas para las tarjetas de promoción (con producto real)
  const promoCards = useMemo(() => {
    const withDiscount = products.filter((p) => p.discount);
    withDiscount.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    return withDiscount.slice(0, 2);
  }, [products]);

  const quickTabs = [
    { id: 'todos', label: 'Destacados', icon: <Store size={15} /> },
    { id: 'aseo', label: meta.categoryLabelA, icon: <Sparkles size={15} /> },
    { id: 'alimentos', label: meta.categoryLabelB, icon: <ShoppingBasket size={15} /> },
    { id: 'ofertas', label: 'Ofertas', icon: <Star size={15} /> },
  ];

  const trustItems = [
    {
      icon: <Zap size={22} />,
      accent: 'var(--c-sig-1)',
      title: 'Atención inmediata',
      description: 'Procesamos tu pedido el mismo día para que no esperes.',
    },
    {
      icon: <ShieldCheck size={22} />,
      accent: 'var(--c-sig-2)',
      title: 'Pago contra entrega',
      description: 'Paga en efectivo al recibir. Sin riesgos ni comisiones.',
    },
    {
      icon: <BadgeCheck size={22} />,
      accent: 'var(--c-sig-3)',
      title: 'Marcas garantizadas',
      description: 'Productos seleccionados y frescos, siempre.',
    },
  ];

  const steps = [
    {
      step: '1',
      icon: <ShoppingBasket size={22} />,
      title: 'Elige tus productos',
      description: 'Explora el catálogo y agrega lo que necesitas al carrito.',
    },
    {
      step: '2',
      icon: <Truck size={22} />,
      title: 'Coordina la entrega',
      description: 'Recogida en tienda o envío a domicilio según tu zona.',
    },
    {
      step: '3',
      icon: <Wallet size={22} />,
      title: 'Paga al recibir',
      description: 'Efectivo contra entrega. Simple y sin complicaciones.',
    },
  ];

  const testimonials = [
    {
      name: 'María Fernández',
      role: 'Cliente frecuente',
      text: 'El pedido llegó el mismo día y todo fresquito. El café es de lo mejor que he probado.',
    },
    {
      name: 'Carlos Pérez',
      role: 'Dueño de cafetería',
      text: 'Compro al por mayor cada semana. Precios justos y nunca me han fallado con la entrega.',
    },
    {
      name: 'Ana Rodríguez',
      role: 'Mamá de tres',
      text: 'Las sopitas y los jugos naturales salvan mis mañanas. Atenderse por WhatsApp es comodísimo.',
    },
  ];

  const categories = isMarket
    ? [
        {
          title: 'Cuidado del Hogar',
          subtitle: 'Shampoo, jabones, detergente y más',
          image: '/img/products/jabon-bano.jpg',
          to: '/products?category=aseo',
        },
        {
          title: 'Despensa Completa',
          subtitle: 'Café, arroz, pastas, sopas y dulces',
          image: '/img/products/sazon.jpg',
          to: '/products?category=alimentos',
        },
      ]
    : [
        {
          title: 'Prendas con Historia',
          subtitle: 'Vestidos, camisas, jeans y blusas únicas',
          image: '/img/boutique/real/vestido-floral.webp',
          to: '/products?category=aseo',
        },
        {
          title: 'Accesorios Chic',
          subtitle: 'Bolsos, sombreros, joyas y más',
          image: '/img/boutique/real/bolso.webp',
          to: '/products?category=alimentos',
        },
      ];

  return (
    <div className="min-h-dvh">
      {/* ============ HERO ============ */}
      <section className="relative pt-4 sm:pt-8 md:pt-12 pb-10 sm:pb-16 hero-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 sm:gap-8 md:gap-10 items-center">
            {/* Texto */}
            <div className="sm:col-span-7 text-center sm:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="space-y-4 sm:space-y-5">
                  <p className="ios-glass-dark inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-semibold text-primary-deep">
                    <span className="h-2 w-2 rounded-full" style={{ background: 'var(--c-sig-1)' }}></span>
                    {meta.badgeText}
                  </p>
                  <h1 className="font-display text-[1.65rem] min-[400px]:text-[1.85rem] sm:text-4xl lg:text-5xl font-extrabold text-dark leading-[1.12] sm:leading-[1.08] text-balance">
                    {meta.heroTitleA}{' '}
                    <span className="text-signature">{meta.heroTitleB}</span>
                  </h1>
                  <p className="text-sm sm:text-lg text-gray-500 font-light max-w-xl mx-auto sm:mx-0">
                    {meta.heroSubtitle}
                  </p>

                  {/* Buscador hero */}
                  <form onSubmit={submitSearch} className="max-w-xl mx-auto lg:mx-0" role="search">
                    <div className="ios-glass-dark bubble-hl rounded-full p-1.5 flex items-center gap-2">
                      <Search size={18} className="ml-4 text-gray-400 flex-shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={meta.searchPlaceholder}
                        className="flex-1 bg-transparent outline-none text-dark placeholder:text-gray-400 min-w-0"
                      />
                      <button type="submit" className="btn-signature px-4 sm:px-6 py-3 flex-shrink-0">
                        <span className="sm:hidden" aria-hidden>
                          <Search size={18} />
                        </span>
                        <span className="hidden sm:inline">Buscar</span>
                        <span className="sr-only sm:hidden">Buscar productos</span>
                      </button>
                    </div>
                  </form>

                  <div className="flex flex-col gap-3 min-[420px]:flex-row justify-center sm:justify-start">
                    <Link to="/products" className="btn-signature px-8 py-3.5">
                      Compra Ahora
                      <ArrowRight size={18} className="ml-2" />
                    </Link>
                    <Link to="/about" className="btn-liquid-ghost px-8 py-3.5">
                      Conoce Más
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Medallón del logo con órbitas de burbujas */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="sm:col-span-5 flex justify-center"
            >
              <LogoMedallion withChips />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ FRANJA DE CONFIANZA ============ */}
      <section className="pt-7 sm:pt-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="ios-glass rounded-[1.75rem] p-1.5 grid grid-cols-3"
          >
            {trustItems.map((item) => (
              <motion.div
                key={item.title}
                variants={itemVariants}
                className="bubble-hl rounded-[1.35rem] px-2.5 sm:px-5 py-3.5 sm:py-5 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 text-center sm:text-left"
                {...bubbleProps}
              >
                <span
                  className="flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-2xl grid place-items-center text-white"
                  style={{
                    background: `linear-gradient(135deg, ${item.accent}, var(--c-sig-3))`,
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45)',
                  }}
                  aria-hidden
                >
                  {item.icon}
                </span>
                <div>
                  <h3 className="font-display text-[12px] sm:text-base font-bold text-dark mb-1 leading-tight">{item.title}</h3>
                  <p className="hidden sm:block text-sm text-gray-500 font-light leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ============ CATEGORÍAS CON IMAGEN ============ */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 gap-3 sm:gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              <Link
                to={cat.to}
                {...bubbleProps}
                className={`group relative block overflow-hidden bubble-hl ios-press liquid-border shadow-glass-lg ${
                  isMarket ? 'rounded-[2rem]' : 'rounded-[1.8rem]'
                }`}
              >
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-32 sm:h-52 md:h-72 object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, var(--c-scrim-1), var(--c-scrim-2) 48%, transparent 75%)',
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-7 flex items-end justify-between gap-2 sm:gap-4">
                  <div>
                    <h3 className="font-display text-sm sm:text-2xl font-extrabold text-white mb-1 sm:mb-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
                      {cat.title}
                    </h3>
                    <p className="hidden sm:block text-white/85 text-sm font-light">{cat.subtitle}</p>
                  </div>
                  <span className="ios-glass-dark rounded-full p-2 sm:p-3.5 text-white group-hover:translate-x-1 transition-transform inline-flex items-center">
                    <ArrowRight size={20} />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ OFERTAS CON PRODUCTO REAL ============ */}
      <section className="py-8 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Ofertas Especiales"
            subtitle="Promociones frescas cada semana en tus productos favoritos"
          />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-3 sm:gap-6"
          >
            {promoCards.length === 0 ? (
              <div className="md:col-span-2 ios-glass rounded-3xl p-10 text-center">
                <p className="text-gray-500">No hay ofertas activas por ahora. Añade productos con descuento en el Admin.</p>
                <Link to="/admin" className="btn-signature inline-flex px-6 py-3 mt-4">
                  Ir al Admin
                </Link>
              </div>
            ) : (
              promoCards.map((product) => (
                <motion.div
                  key={product.id}
                  variants={itemVariants}
                  {...bubbleProps}
                  className="relative overflow-hidden bubble-hl bubble-hl-dark ios-press group shadow-glass-lg min-h-[180px] sm:min-h-[260px] flex items-end"
                  style={{ borderRadius: 'clamp(1.25rem, 6vw, 3rem)' }}
                >
                  {/* Imagen de fondo con capa protectora de contraste según imagen */}
                  <div className="absolute inset-0 z-0" aria-hidden>
                    <img
                      src={product.image}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                  </div>
                  {/* Overlay adaptable: oscuro suave para garantizar legibilidad del texto */}
                  <div
                    className="absolute inset-0 z-10"
                    style={{
                      background:
                        'linear-gradient(180deg, var(--c-scrim-3) 0%, var(--c-scrim-2) 35%, var(--c-scrim-1) 100%)',
                    }}
                  />
                  {/* Capa cristalina sutil para unir composición */}
                  <div className="absolute inset-0 z-10 rounded-[inherit] ring-1 ring-white/30" aria-hidden />

                  <div className="relative z-20 w-full p-3.5 sm:p-8">
                    <span className="inline-flex items-center gap-1.5 mb-2 sm:mb-3 rounded-full px-2.5 sm:px-4 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold text-white ios-glass-dark">
                      {product.discount}% · {product.category === 'aseo' ? 'Aseo' : 'Alimentos'}
                    </span>
                    <h3 className="font-display text-sm sm:text-3xl font-extrabold tracking-tight text-white mb-1 sm:mb-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
                      {product.name}
                    </h3>
                    <p className="hidden sm:block mb-2 text-white/95 font-light text-base sm:text-lg drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)]">
                      {product.description}
                    </p>
                    <p className="mb-3 sm:mb-5 text-white font-bold text-[13px] sm:text-xl drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)]">
                      <span className="line-through opacity-70 mr-2">{formatPrice(product.price)}</span>
                      {formatPrice(getDiscountedPrice(product))}
                    </p>
                    <Link
                      to="/products?category=ofertas"
                      className="inline-flex items-center gap-1.5 sm:gap-2 text-primary-deep px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-base rounded-full font-bold bg-white/85 backdrop-blur-sm shadow-glass hover:brightness-105 active:scale-95 transition"
                    >
                      Ver Oferta
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </section>

      {/* ============ DESTACADOS CON PESTAÑAS ============ */}
      <section className="py-8 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideUp>
            <h2 className="font-display text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-center text-dark mb-5 sm:mb-8 text-balance">
              Productos Destacados
            </h2>
          </SlideUp>

          {/* Filtros: la opción activa se marca sin desplazamientos */}
          <div className="flex justify-center mb-6 sm:mb-10">
            <LiquidTabs items={quickTabs} activeId={quickCategory} onChange={setQuickCategory} />
          </div>

          <motion.div
            key={quickCategory}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-3 gap-3 sm:gap-6 items-stretch"
          >
            {featuredProducts.map((product: Product) => (
              <motion.div key={product.id} variants={itemVariants} className="h-full">
                {/* Destacados: solo "Agregar"; la cantidad se elige en Tienda. */}
                <ProductCard product={product} showQuantity={false} />
              </motion.div>
            ))}
          </motion.div>

          <div className="text-center mt-8 sm:mt-12">
            <Link to="/products" className="btn-signature inline-flex px-8 py-3">
              Ver Todos los Productos
              <ArrowRight size={18} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============ CÓMO COMPRAR (secuencia real) ============ */}
      <section className="py-8 sm:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Comprar es así de fácil"
            subtitle="Tres pasos y tu pedido está listo"
          />

          <div className="relative grid grid-cols-3 gap-3 sm:gap-8">
            {/* Hilo que conecta los pasos: el arco del medallón */}
            <div
              aria-hidden
              className="hidden md:block absolute left-[16%] right-[16%] top-[34px] h-[3px] rounded-full"
              style={{
                background:
                  'linear-gradient(90deg, var(--c-sig-1), var(--c-sig-2) 50%, var(--c-sig-3))',
                opacity: 0.55,
              }}
            />
            {steps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                {...bubbleProps}
                className="relative bubble-hl ios-glass rounded-2xl sm:rounded-3xl px-2.5 py-4 pt-9 sm:p-7 sm:pt-12 text-center"
              >
                <span
                  className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full text-white font-display font-extrabold flex items-center justify-center shadow-glass ring-4 ring-white/40"
                  style={{ background: 'linear-gradient(135deg, var(--c-sig-1), var(--c-sig-3))' }}
                >
                  {step.step}
                </span>
                <div
                  className="w-10 h-10 sm:w-14 sm:h-14 mx-auto mb-2 sm:mb-4 rounded-2xl grid place-items-center text-primary-deep"
                  style={{ background: 'rgba(var(--c-primary-rgb), 0.12)' }}
                >
                  {step.icon}
                </div>
                <h3 className="font-display text-[12px] sm:text-lg font-bold text-primary-dark mb-2 leading-tight">{step.title}</h3>
                <p className="hidden sm:block text-gray-500 text-sm font-light leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIOS ============ */}
      <section className="py-8 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Lo que dicen nuestros clientes"
            subtitle="Familias y negocios que ya compran con nosotros"
          />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                {...bubbleProps}
                className="bubble-hl ios-glass rounded-2xl sm:rounded-3xl p-3.5 sm:p-7"
              >
                <div className="flex gap-1 mb-3 sm:mb-4">
                  {[...Array(5)].map((_, s) => (
                    <Star key={s} size={15} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-[13px] sm:text-base text-gray-600 mb-4 sm:mb-5 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-full text-white font-bold flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--c-sig-1), var(--c-sig-3))' }}
                  >
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-dark text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CROSS-SELLING: LA OTRA TIENDA ============ */}
      <section className="py-8 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <SlideUp>
            <button
              onClick={() => setTheme(isMarket ? 'boutique' : 'market')}
              {...bubbleProps}
              className="group relative block w-full rounded-3xl overflow-hidden bubble-hl bubble-hl-dark ios-press liquid-border shadow-glass-lg text-left"
            >
              <img
                src={isMarket ? '/img/boutique/real/vestido-floral.webp' : '/img/products/caldito-pollo.jpg'}
                alt=""
                className="w-full h-40 sm:h-52 md:h-64 object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div
                className="absolute inset-0"
                style={{
                  /* --c-cross-* describe siempre la tienda que se muestra
                     en la tarjeta (la contraria a la activa). */
                  background: 'linear-gradient(to top, var(--c-cross-1), var(--c-cross-2) 55%, transparent)',
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 flex items-end justify-between gap-4">
                <div>
                  <p className="ios-glass-dark inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold text-white mb-3">
                    <Store size={13} />
                    {isMarket ? 'Nueva tienda' : 'Visita también'}
                  </p>
                  <h3 className="font-display text-xl sm:text-2xl md:text-4xl font-extrabold text-white mb-1">
                    {isMarket ? 'Garzón Chic' : 'Ventas Garzón'}
                  </h3>
                  <p className="text-white/85 text-xs sm:text-sm md:text-base">
                    {isMarket
                      ? 'Venta de garaje online: ropa y accesorios únicos a precio de ganga'
                      : 'Tu mercado de aseo y alimentos de siempre, a un clic'}
                  </p>
                </div>
                <span className="ios-glass-dark rounded-full p-3.5 text-white group-hover:translate-x-1.5 transition-transform flex-shrink-0">
                  <ArrowRight size={22} />
                </span>
              </div>
            </button>
          </SlideUp>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      {/* pb extra: deja respirar el contenido respecto a la burbuja de contacto */}
      <section className="py-8 sm:py-14 pb-24 sm:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <SlideUp>
            <div className="grove-theme liquid-border rounded-3xl p-5 sm:p-6 md:p-10 text-center shadow-glass-lg">
              <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight mb-3 sm:mb-4">
                ¿Listo para Comprar?
              </h2>
              <p className="text-sm sm:text-lg mb-6 sm:mb-8 grove-text-soft">
                {isMarket ? 'Tu despensa y tu aseo, resueltos en minutos' : 'Renueva tu armario sin vaciar tu bolsillo'}
              </p>
              <div className="flex flex-col min-[420px]:flex-row gap-3 sm:gap-4 justify-center">
                <Link to="/products" className="btn-signature inline-flex px-8 py-3">
                  Compra Ahora
                  <ArrowRight size={18} className="ml-2" />
                </Link>
                <a
                  href="tel:+5356072398"
                  className="grove-chip inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 font-bold grove-text hover:bg-white/10 transition"
                >
                  <Zap size={18} className="grove-accent" />
                  Pedir por teléfono
                </a>
              </div>
            </div>
          </SlideUp>
        </div>
      </section>
    </div>
  );
};
