import React from 'react';
import { Link } from 'react-router-dom';
import { useThemeStore } from '../store';
import { STORE_META_DATA } from '../data/boutiqueData';

/**
 * Footer compacto: marca, enlaces y contacto en columnas cortas y una barra
 * final fina. Se omite la descripción larga, los iconos y la dirección para
 * que no se coma la página.
 */
export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const theme = useThemeStore((s) => s.theme);
  const meta = STORE_META_DATA[theme];

  return (
    <footer className="footer-theme border-t border-white/10 safe-b safe-l safe-r">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Marca */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <img src={meta.logo} alt={meta.name} className="h-9 w-9 rounded-full border border-white/25" />
              <div className="leading-tight">
                <p className="text-[10px] uppercase tracking-[0.3em] grove-accent font-bold">
                  {meta.name.split(' ')[0]}
                </p>
                <span className="text-base font-bold text-white">
                  {meta.name.split(' ').slice(1).join(' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Navegación */}
          <div>
            <h4 className="text-sm font-bold mb-1.5">Navegación</h4>
            <ul className="space-y-1 text-sm">
              <li><Link to="/products" className="grove-link tap-link">Productos</Link></li>
              <li><Link to="/about" className="grove-link tap-link">Acerca de</Link></li>
              <li><Link to="/faq" className="grove-link tap-link">Preguntas Frecuentes</Link></li>
              <li><Link to="/cart" className="grove-link tap-link">Mi Carrito</Link></li>
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <h4 className="text-sm font-bold mb-1.5">Soporte</h4>
            <ul className="space-y-1 text-sm">
              <li><Link to="/faq" className="grove-link tap-link">Medios de Pago</Link></li>
              <li><Link to="/faq" className="grove-link tap-link">Devoluciones</Link></li>
              <li><Link to="/faq" className="grove-link tap-link">Compra al por mayor</Link></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="text-sm font-bold mb-1.5">Contacto</h4>
            <ul className="space-y-1 text-sm">
              <li><a href="tel:+5356072398" className="grove-link tap-link">+53 56072398</a></li>
              <li><a href="mailto:info@ventasgarzon.com" className="grove-link tap-link break-all">info@ventasgarzon.com</a></li>
              <li className="grove-text-soft">Santiago de Cuba</li>
            </ul>
          </div>
        </div>

        {/* pb mínimo: la burbuja flotante de contacto vive abajo a la derecha */}
        <div className="border-t border-white/10 mt-4 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 grove-text-soft text-xs">
          <p>&copy; {currentYear} {meta.name}. Todos los derechos reservados.</p>
          <div className="grove-chip rounded-full px-3 py-1 text-[10px] font-semibold grove-text">
            {meta.id === 'market' ? 'Hecho con orgullo en Cuba 🌿' : 'Moda con historia ♻️'}
          </div>
        </div>
      </div>
    </footer>
  );
};
