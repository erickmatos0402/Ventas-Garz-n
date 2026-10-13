import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Clock } from 'lucide-react';
import { useThemeStore } from '../store';
import { STORE_META_DATA } from '../data/boutiqueData';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const theme = useThemeStore((s) => s.theme);
  const meta = STORE_META_DATA[theme];

  return (
    <footer className="grove-theme border-t border-white/10 safe-b safe-l safe-r">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24 sm:pt-14 sm:pb-16">
        {/* 1 col en móvil → 2 en tablet → 4 en escritorio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={meta.logo} alt={meta.name} className="h-12 w-12 rounded-full border border-white/25" />
              <div className="leading-tight">
                <p className="text-xs uppercase tracking-[0.3em] grove-accent font-bold">{meta.name.split(' ')[0]}</p>
                <span className="text-xl font-bold text-white">{meta.name.split(' ').slice(1).join(' ')}</span>
              </div>
            </div>
            <p className="grove-text-soft text-sm leading-relaxed">
              {meta.id === 'market'
                ? 'Tu tienda de confianza para productos de aseo y alimentos de calidad, a precio justo.'
                : 'Venta de garaje online: prendas y accesorios únicos seleccionados con ojo de boutique.'}
            </p>
            <div className="grove-chip inline-flex items-center gap-2 mt-5 rounded-full px-3.5 py-1.5 text-xs font-semibold grove-text">
              <Clock size={13} />
              Lun a Sáb · 8:00 am – 6:00 pm
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-lg font-bold mb-4">Navegación</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/products" className="grove-link">Productos</Link></li>
              <li><Link to="/about" className="grove-link">Acerca de</Link></li>
              <li><Link to="/faq" className="grove-link">Preguntas Frecuentes</Link></li>
              <li><Link to="/cart" className="grove-link">Mi Carrito</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-bold mb-4">Soporte</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/faq" className="grove-link">Medios de Pago</Link></li>
              <li><Link to="/faq" className="grove-link">Devoluciones</Link></li>
              <li><Link to="/faq" className="grove-link">Compra al por mayor</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5 grove-text-soft">
                <span className="grove-chip w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone size={14} />
                </span>
                <a href="tel:+5356072398" className="grove-link">+53 56072398</a>
              </li>
              <li className="flex items-center gap-2.5 grove-text-soft">
                <span className="grove-chip w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail size={14} />
                </span>
                <a href="mailto:info@ventasgarzon.com" className="grove-link">info@ventasgarzon.com</a>
              </li>
              <li className="flex items-start gap-2.5 grove-text-soft">
                <span className="grove-chip w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin size={14} />
                </span>
                <span>Santiago de Cuba, Cuba</span>
              </li>
            </ul>
          </div>
        </div>

        {/* pb extra en móvil: la burbuja flotante de contacto (56px, fija
            abajo a la derecha) taparía el aviso de copyright. */}
        <div className="border-t border-white/10 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 grove-text-soft text-sm">
          <p>&copy; {currentYear} {meta.name}. Todos los derechos reservados.</p>
          <div className="grove-chip rounded-full px-4 py-1.5 text-xs font-semibold grove-text">
            {meta.id === 'market' ? 'Hecho con orgullo en Cuba 🌿' : 'Moda con historia ♻️'}
          </div>
        </div>
      </div>
    </footer>
  );
};
