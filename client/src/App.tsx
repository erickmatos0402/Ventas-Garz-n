import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { Header, Footer, FloatingLeaves, ContactBubble, StoreTransitionOverlay } from './components';
import {
  LandingPage,
  ProductsPage,
  CartPage,
  CheckoutPage,
  AboutPage,
  FAQPage,
  AdminPage,
  AuthPage,
} from './pages';
import { useMockAdminStore, useThemeStore } from './store';
import { STORE_META_DATA } from './data/boutiqueData';

/** Título de documento por sección (navegación más clara) */
const SECTION_TITLES: Record<string, string> = {
  '/': 'Inicio',
  '/products': 'Productos',
  '/cart': 'Carrito',
  '/checkout': 'Finalizar compra',
  '/about': 'Nosotros',
  '/faq': 'Preguntas frecuentes',
  '/admin': 'Administración',
  '/login': 'Mi cuenta',
};

/**
 * Shell de la app: en cada cambio de ruta lleva la vista al inicio,
 * actualiza el título del documento y re-monta el contenido con la
 * transición page-fade.
 */
function AppShell() {
  const { pathname } = useLocation();
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const base = '/' + (pathname.split('/')[1] || '');
    const section = SECTION_TITLES[base];
    const meta = STORE_META_DATA[theme];
    document.title = section ? `${meta.name} · ${section}` : meta.name;
  }, [pathname, theme]);

  return (
    // min-h-dvh: en móvil, 100vh incluye la barra del navegador y deja
    // un hueco fantasma al final del scroll.
    <div className="relative flex flex-col min-h-dvh">
      <FloatingLeaves />
      <Header />
      <main key={pathname} className="flex-1 page-fade">
        <Routes>
          <Route path="/market" element={<LandingPage />} />
          <Route path="/boutique" element={<LandingPage />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <ContactBubble />
      <StoreTransitionOverlay />
    </div>
  );
}

function App() {
  // DEMO (temporal): sin login; los productos provienen de datos falsos.
  // El store del admin se inicializa solo al montar.
  useMockAdminStore((s) => s.products);

  return (
    // reducedMotion="user": en móviles que pidan menos movimiento,
    // framer-motion omite transformaciones y deja solo fade-in/out.
    <MotionConfig reducedMotion="user">
      <Router>
        <AppShell />
      </Router>
    </MotionConfig>
  );
}

export default App;
