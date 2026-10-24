import React, { ReactNode, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

export const slideUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export const slideInFromLeftVariants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

export const slideInFromRightVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
};

export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

interface FadeInProps {
  children: ReactNode;
  delay?: number;
}

export const FadeIn: React.FC<FadeInProps> = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
  >
    {children}
  </motion.div>
);

interface SlideUpProps {
  children: ReactNode;
  delay?: number;
}

export const SlideUp: React.FC<SlideUpProps> = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
  >
    {children}
  </motion.div>
);

type RevealTag = 'h1' | 'h2' | 'h3' | 'p';

interface RevealTextProps {
  text: string;
  className?: string;
  /** Etiqueta semántica del texto (por defecto, párrafo). */
  as?: RevealTag;
  delay?: number;
}

/**
 * RevealText — los textos de la Landing aparecen al entrar en pantalla con un
 * fundido suave. Antes se partían en palabras y cada una se movía: al
 * cambiar el ancho de las palabras, el navegador reacomodaba las líneas y el
 * bloque “saltaba” de varias líneas a una. Ahora se anima el bloque completo
 * solo con opacidad y un desenfoque que se disuelve: no hay transformaciones
 * ni cambios de maquetación, así el texto ocupa su lugar definitivo desde el
 * primer momento.
 */
export const RevealText: React.FC<RevealTextProps> = ({
  text,
  className = '',
  as = 'p',
  delay = 0,
}) => {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  // `as` solo admite h1/h2/h3/p; el cast deja que createElement reciba el ref
  // del elemento real sin pelearse con la unión de tipos de framer-motion.
  const MotionTag = motion[as] as React.ElementType;

  return React.createElement(MotionTag, {
    ref,
    className,
    initial: { opacity: 0, filter: 'blur(6px)' },
    animate: inView ? { opacity: 1, filter: 'blur(0px)' } : undefined,
    transition: { duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] },
    style: { willChange: 'opacity, filter' },
  }, text);
};
