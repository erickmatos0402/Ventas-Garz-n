import { useEffect, useState } from 'react';
import { Product } from '../types';
import { productService } from '../services/api';

export function useProducts(category?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data: any = await productService.getAllProducts(1, category);
        setProducts(data.data || data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Error fetching products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  return { products, loading, error };
}
