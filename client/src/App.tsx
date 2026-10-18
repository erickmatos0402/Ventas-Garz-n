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
import { useAuthStore, useCatalogStore, useThemeStore } from './store';
import { STORE_META_DATA } from './data/boutiqueData';
import { isSupabaseConfigured } from './utils/supabase';

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

/**
 * Sin variables de entorno no hay catálogo ni sesión: en vez de una página
 * en blanco se explica qué falta (Vercel, por ejemplo, necesita que se
 * configuren en el panel del proyecto y volver a desplegar).
 */
function SupabaseConfigScreen() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-16">
      <div className="glass-strong rounded-3xl p-6 sm:p-10 max-w-lg w-full text-center">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-dark mb-3">
          Falta configurar Supabase
        </h1>
        <p className="text-gray-500 mb-4 text-sm">
          Crea <code className="font-semibold">client/.env.local</code> con las credenciales del proyecto
          (Supabase → Project Settings → API) y reinicia el servidor:
        </p>
        <pre className="text-left text-xs bg-white/60 border border-white/70 rounded-2xl p-4 mb-4 overflow-x-auto">
          {'VITE_SUPABASE_URL=https://tu-proyecto.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...'}
        </pre>
        <p className="text-xs text-gray-400">
          Si la app está desplegada, añade esas mismas variables en el panel del hosting y vuelve a desplegar.
        </p>
      </div>
    </div>
  );
}

function App() {
  const initializeAuth = useAuthStore((s) => s.initialize);
  const fetchProducts = useCatalogStore((s) => s.fetchProducts);

  // Restaura la sesión de Supabase y carga el catálogo una sola vez.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void initializeAuth();
    void fetchProducts();
  }, [initializeAuth, fetchProducts]);

  if (!isSupabaseConfigured) {
    return <SupabaseConfigScreen />;
  }

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
