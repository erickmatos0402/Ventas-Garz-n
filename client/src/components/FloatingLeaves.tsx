import React from 'react';

/**
 * FloatingLeaves — fondo decorativo ESTÁTICO: manchas de color del tema
 * activo fijas en la parte superior/inferior. Puramente decorativo
 * (pointer-events: none) y por detrás del contenido (-z-10).
 */
export const FloatingLeaves: React.FC = () => {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
    >
      <div className="aurora-static aurora-1 -top-40 -left-32 h-[26rem] w-[26rem]" />
      <div className="aurora-static aurora-2 top-[28%] -right-40 h-[30rem] w-[30rem]" />
      <div className="aurora-static aurora-3 bottom-[-8rem] left-[28%] h-[24rem] w-[24rem]" />
    </div>
  );
};
