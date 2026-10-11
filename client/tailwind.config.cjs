module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
        display: ['Sora', 'Outfit', 'Segoe UI', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },      colors: {
        // Tokens que se resuelven según el tema activo (mercado/boutique)
        primary: 'var(--c-primary)',
        'primary-deep': 'var(--c-primary-deep)',
        'primary-dark': 'var(--c-primary-dark)',
        'primary-ink': 'var(--c-grove-2)',
        leaf: '#2E7D57',
        mint: 'var(--c-soft)',
        moss: 'var(--c-soft-2)',
        // Acento "agua" del mercado: ahora sale del eje azul marino del
        // logo para no meter un azul vivo fuera de la paleta del Hero.
        aqua: 'var(--c-text-accent)',
        'aqua-deep': 'var(--c-grove-1)',
        'aqua-soft': 'var(--c-soft)',
        // Acentos de moda sostenible (boutique Garzón Chic)
        wicker: '#C2A383',
        'wicker-deep': '#9A7B54',
        denim: '#4B637B',
        'denim-deep': '#3A4E61',
        sage: '#818D7A',
        latte: '#EFE8DF',
        'latte-deep': '#E2D6C5',
        // Genéricos
        secondary: 'var(--c-primary)',
        accent: 'var(--c-eyebrow)',
        danger: '#D64545',
        dark: 'var(--c-ink)',
        light: '#F3FAF5',
        mist: 'var(--c-soft-2)',
      },
      boxShadow: {
        glass: '0 1px 2px rgba(var(--c-shadow-rgb), 0.05), 0 4px 14px rgba(var(--c-shadow-rgb), 0.08), 0 12px 32px rgba(var(--c-shadow-rgb), 0.10), inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -1px 1px rgba(255,255,255,0.25)',
        'glass-lg': '0 2px 6px rgba(var(--c-shadow-rgb), 0.06), 0 16px 44px rgba(var(--c-shadow-rgb), 0.16), 0 24px 64px rgba(var(--c-shadow-2-rgb), 0.10), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 1px rgba(255,255,255,0.3)',
      },
      spacing: {
        '128': '32rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-up': 'slideUp 0.5s ease-out',
        'bounce-slow': 'bounce 2s infinite',
        'float-slow': 'floatSlow 7s ease-in-out infinite',
        'float-slower': 'floatSlow 10s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
}
