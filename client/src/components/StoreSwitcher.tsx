import React from 'react';
import { ShoppingBasket, ShoppingBag } from 'lucide-react';
import { useThemeStore, StoreTheme } from '../store/themeStore';
import { LiquidTabs, LiquidTabItem } from './LiquidTabs';

const OPTIONS: LiquidTabItem[] = [
  { id: 'market', label: 'Mercado', icon: <ShoppingBasket size={14} /> },
  { id: 'boutique', label: 'Boutique', icon: <ShoppingBag size={14} /> },
];

/**
 * StoreSwitcher — pastilla de cristal con las dos tiendas. Usa LiquidTabs
 * con la MISMA configuración que las proporciones del editor de fotos
 * (ProductImageEditor): la pastilla de cristal viaja al cambiar de tienda y
 * cada opción reacciona al pasar el cursor con el brillo que sigue al
 * puntero. Al no añadir `glow`, el efecto queda por opción y no por todo el
 * contenedor, igual que en «Proporción del recorte».
 */
export const StoreSwitcher: React.FC = () => {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <LiquidTabs
      items={OPTIONS}
      activeId={theme}
      onChange={(id) => setTheme(id as StoreTheme)}
      size="sm"
      className="store-switcher"
    />
  );
};
