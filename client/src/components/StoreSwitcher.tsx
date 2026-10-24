import React, { useEffect, useState } from 'react';
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
 *
 * El tema real (`theme`) no cambia al hacer clic: espera a que la onda del
 * traspaso cubra la pantalla (~1.9 s). Por eso la opción elegida se marca
 * aquí en el acto, con un estado optimista propio: así la pastilla viaja
 * justo al tocar y no se queda quieta hasta que el tema se aplica debajo de
 * la onda. Cuando el tema llega, el estado optimista se descarta y todo
 * queda mandado por la tienda real.
 */
export const StoreSwitcher: React.FC = () => {
  const theme = useThemeStore((s) => s.theme);
  const switching = useThemeStore((s) => s.switching);
  const setTheme = useThemeStore((s) => s.setTheme);
  const [selected, setSelected] = useState<StoreTheme | null>(null);

  // El tema ya cambió (o no había nada pendiente): manda la tienda real.
  useEffect(() => {
    setSelected(null);
  }, [theme]);

  const active = selected ?? theme;

  const handleChange = (id: string) => {
    const next = id as StoreTheme;
    // Mientras corre una onda, el cambio de tema está bloqueado: marcar otra
    // opción dejaría la pastilla en una tienda que no se va a aplicar.
    if (switching) return;
    setSelected(next === theme ? null : next);
    setTheme(next);
  };

  return (
    <LiquidTabs
      items={OPTIONS}
      activeId={active}
      onChange={handleChange}
      size="sm"
      className="store-switcher"
    />
  );
};
