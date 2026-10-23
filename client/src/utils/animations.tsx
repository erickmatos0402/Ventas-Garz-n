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
  /** Segundos entre palabra y palabra. */
  stagger?: number;
}

/**
 * RevealText — los textos de la Landing aparecen palabra a palabra al
 * entrar en pantalla mientras se hace scroll. Cada palabra sube desde su
 * propia máscara y se va aclarando con una curva rápida de salida; el
 * bloque se anima una sola vez. El texto real queda en `aria-label`, así
 * los lectores de pantalla lo leen de corrido y no palabra por palabra.
 */
export const RevealText: React.FC<RevealTextProps> = ({
  text,
  className = '',
  as = 'p',
  delay = 0,
  stagger = 0.045,
}) => {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const words = text.split(' ');

  return React.createElement(
    as,
    { ref, className, 'aria-label': text },
    words.map((word, index) => (
      <span
        key={`${word}-${index}`}
        aria-hidden
        className="inline-block overflow-hidden align-bottom"
      >
        <motion.span
          className="inline-block"
          initial={{ y: '110%', opacity: 0 }}
          animate={inView ? { y: '0%', opacity: 1 } : undefined}
          transition={{
            duration: 0.55,
            delay: delay + index * stagger,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {word}
          {index < words.length - 1 ? '\u00A0' : ''}
        </motion.span>
      </span>
    ))
  );
};
