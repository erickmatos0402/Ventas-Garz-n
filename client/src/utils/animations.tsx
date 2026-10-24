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
 * RevealText — los textos de la Landing aparecen al entrar en pantalla
 * mientras se hace scroll. Cada palabra se eleva desde su máscara con un
 * giro leve sobre el eje X, desenfoque que se disuelve y un pequeño
 * asentamiento de escala; el conjunto se lee como una cortina de cristal que
 * se abre, en lugar del salto recto de antes. El bloque se anima una sola vez
 * y el texto real queda en `aria-label`, así los lectores de pantalla lo leen
 * de corrido y no palabra por palabra.
 */
export const RevealText: React.FC<RevealTextProps> = ({
  text,
  className = '',
  as = 'p',
  delay = 0,
  stagger = 0.055,
}) => {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const words = text.split(' ');

  return React.createElement(
    as,
    { ref, className, 'aria-label': text, style: { perspective: '900px' } },
    words.map((word, index) => (
      <span
        key={`${word}-${index}`}
        aria-hidden
        className="inline-block overflow-hidden align-bottom pb-[0.06em]"
      >
        <motion.span
          className="inline-block will-change-transform"
          style={{ transformOrigin: '50% 100%', transformStyle: 'preserve-3d' }}
          initial={{ y: '105%', opacity: 0, rotateX: -48, scale: 0.96, filter: 'blur(6px)' }}
          animate={
            inView
              ? { y: '0%', opacity: 1, rotateX: 0, scale: 1, filter: 'blur(0px)' }
              : undefined
          }
          transition={{
            duration: 0.85,
            delay: delay + index * stagger,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {word}
          {index < words.length - 1 ? '\u00A0' : ''}
        </motion.span>
      </span>
    ))
  );
};
