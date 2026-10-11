import { useState, useEffect } from 'react';

/**
 * Cadena de respaldo para imágenes de producto:
 * principal -> fallback (ilustración) -> null (se muestra el emoji).
 */
export function useImageWithFallback(primary?: string, fallback?: string) {
  const [current, setCurrent] = useState<string | undefined>(primary);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrent(primary);
    setFailed(false);
  }, [primary, fallback]);

  const onError = () => {
    if (current && fallback && current !== fallback) {
      setCurrent(fallback);
    } else {
      setFailed(true);
    }
  };

  return { src: current, failed, onError };
}
