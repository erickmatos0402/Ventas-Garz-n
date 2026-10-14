import React from 'react';
import { ShoppingBasket, ShoppingBag } from 'lucide-react';
import { useThemeStore, StoreTheme } from '../store/themeStore';
import { LiquidTabs, LiquidTabItem } from './LiquidTabs';

const OPTIONS: LiquidTabItem[] = [
  { id: 'market', label: 'Mercado', icon: <ShoppingBasket size={14} /> },
  { id: 'boutique', label: 'Boutique', icon: <ShoppingBag size={14} /> },
];

/**
 * StoreSwitcher — pastilla de cristal con las dos tiendas. Reutiliza
 * LiquidTabs para heredar el mismo efecto del menú: burbuja líquida
 * transparente y fluida, sin brillo de gota, que viaja y asienta.
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
    />
  );
};
