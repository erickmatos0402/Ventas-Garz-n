import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShoppingBasket, Sparkles, Star, Tag, SearchX } from 'lucide-react';
import { SlideUp } from '../utils/animations';
import { useMockAdminStore, useThemeStore } from '../store';
import { ProductCarousel, LiquidTabs } from '../components';
import { BOUTIQUE_PRODUCTS, STORE_META_DATA } from '../data/boutiqueData';

type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'rating';

export const ProductsPage: React.FC = () => {
  const marketProducts = useMockAdminStore((s) => s.products);
  const theme = useThemeStore((s) => s.theme);
  const meta = STORE_META_DATA[theme];
  const products = theme === 'market' ? marketProducts : BOUTIQUE_PRODUCTS;
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');

  // Sincroniza con la URL (llega desde el buscador de la landing)
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const cat = searchParams.get('category') || '';
    setSearchQuery(q);
    setSelectedCategory(cat);
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (selectedCategory === 'ofertas') {
      filtered = filtered.filter((p) => !!p.discount);
    } else if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'price-asc':
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        filtered = [...filtered].sort((a, b) => (b.discount || 0) - (a.discount || 0));
    }

    return filtered;
  }, [products, selectedCategory, searchQuery, sortBy]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    const params = new URLSearchParams();
    if (cat) params.set('category', cat);
    const q = searchParams.get('q');
    if (q) params.set('q', q);
    setSearchParams(params, { replace: true });
  };

  const categoryTabs = [
    { id: '', label: 'Todos', icon: <ShoppingBasket size={15} /> },
    { id: 'aseo', label: meta.categoryLabelA, icon: <Sparkles size={15} /> },
    { id: 'alimentos', label: meta.categoryLabelB, icon: <ShoppingBasket size={15} /> },
    { id: 'ofertas', label: 'Ofertas', icon: <Star size={15} /> },
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Más relevantes' },
    { value: 'price-asc', label: 'Precio: menor a mayor' },
    { value: 'price-desc', label: 'Precio: mayor a menor' },
    { value: 'rating', label: 'Mejor valorados' },
  ];

  return (
    <div className="min-h-dvh pt-8 sm:pt-20">
      {/* Encabezado */}
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SlideUp>
            <p className="heading-eyebrow">{meta.name}</p>
            <h1 className="heading-page text-3xl sm:text-4xl md:text-5xl mb-3">Nuestros Productos</h1>
            <p className="text-gray-500 max-w-xl">
              {theme === 'market'
                ? 'Aseo y alimentos seleccionados. Usa las pestañas o el buscador para encontrar lo que necesitas.'
                : 'Prendas y accesorios en pieza única o tallas limitadas. Lo que ves, es lo que hay.'}
            </p>
          </SlideUp>
        </div>
      </section>

      {/* Contenido */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Barra de filtros líquida */}
          <div className="glass-panel rounded-3xl p-4 sm:p-5 mb-8 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
            <LiquidTabs wrap items={categoryTabs} activeId={selectedCategory} onChange={handleCategoryChange} />

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:ml-auto">
              {/* Buscador */}
              <input
                type="text"
                placeholder="Buscar en el catálogo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 min-h-[44px] px-4 py-2.5 rounded-full bg-white/60 border border-white/70 outline-none focus:ring-2 focus:ring-primary/60 text-sm text-dark placeholder:text-gray-400"
              />
              {/* Orden */}
              <div className="liquid-badge rounded-full px-4 py-1 flex items-center gap-2 min-h-[44px]">
                <Tag size={14} className="text-primary-deep flex-shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent outline-none text-sm font-semibold text-primary-deep cursor-pointer py-1.5 max-w-full"
                  aria-label="Ordenar productos"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Resultado */}
          <p className="text-sm text-gray-500 mb-5">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}
            {searchQuery && <> para "<span className="font-semibold text-primary-deep">{searchQuery}</span>"</>}
          </p>

          {filteredProducts.length === 0 ? (
            <div className="glass-panel rounded-3xl py-20 text-center">
              <SearchX size={48} className="mx-auto mb-4 text-primary/40" />
              <p className="text-gray-600 text-lg font-semibold mb-1">No se encontraron productos</p>
              <p className="text-gray-400 text-sm mb-6">Prueba con otra búsqueda o cambia de categoría</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  handleCategoryChange('');
                }}
                className="btn-liquid px-6 py-2.5"
              >
                Ver todo el catálogo
              </button>
            </div>
          ) : (
            <ProductCarousel products={filteredProducts} />
          )}
        </div>
      </section>
    </div>
  );
};
