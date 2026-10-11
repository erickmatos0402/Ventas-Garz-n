# Ventas Garzón - Guía de Desarrollo

## 🚀 Quick Start

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar base de datos (ver database/SETUP.md)
psql -U ventas_garzon -d ventas_garzon -f database/schema.sql

# 3. Configurar variables de entorno
cp server/.env.example server/.env
# Editar server/.env con credenciales

# 4. Ejecutar en desarrollo
npm run dev
```

Frontend: http://localhost:3000
Backend: http://localhost:5000/api
Docs: http://localhost:5000/api/docs (próximamente)

## 📦 Scripts Disponibles

### Root
```bash
npm run dev          # Ejecutar frontend y backend
npm run server       # Solo backend
npm run client       # Solo frontend
npm run build        # Build para producción
npm run server:build # Build del backend
```

### Client
```bash
npm run dev          # Vite dev server
npm run build        # Build producción
npm run preview      # Preview del build
npm start            # Alias de dev
```

### Server
```bash
npm run dev          # Dev con auto-reload
npm run build        # Compilar TypeScript
npm run start        # Ejecutar build compilado
npm run db:setup     # Setup automático de BD
```

## 🔄 Desarrollo en Vivo

### Terminal 1 - Backend
```bash
cd server
npm run dev
```

### Terminal 2 - Frontend
```bash
cd client
npm run dev
```

### Terminal 3 - Comandos útiles
```bash
# Ver logs en tiempo real
npm run server

# Reiniciar BD
npm run db:setup

# Ver estructura de carpetas
tree -I 'node_modules|dist'
```

## 🎯 Estructura Recomendada para Desarrollo

```
Abrir 3 terminales:
1. Terminal Backend:    cd server && npm run dev
2. Terminal Frontend:   cd client && npm run dev
3. Terminal Auxiliar:   cd . (para comandos ocasionales)
```

## 🗄️ Operaciones de Base de Datos

### Conectar a la BD
```bash
psql -U ventas_garzon -d ventas_garzon
```

### Ver tablas
```sql
\dt
```

### Ver estructura de tabla
```sql
\d products
```

### Resetear BD
```bash
# Eliminar datos
psql -U ventas_garzon -d ventas_garzon -c "DROP TABLE IF EXISTS order_items, orders, products, users CASCADE;"

# Recrear
npm run db:setup
```

## 🔍 Debugging

### Frontend (Chrome DevTools)
- F12 para abrir DevTools
- Console: Errores de JS
- Network: Requests API
- Components: React DevTools (extensión recomendada)
- Redux DevTools: Para estado global

### Backend
```bash
# Agregar console.log para debugging
console.log('Debug:', variable);

# O usar debugger
node --inspect-brk ./dist/index.js
```

## 📝 Agregar Nuevas Funcionalidades

### Agregar un Endpoint

1. **Crear controlador** en `server/src/controllers/`
2. **Crear modelo** en `server/src/models/` (si necesita BD)
3. **Crear ruta** en `server/src/routes/`
4. **Importar ruta** en `server/src/index.ts`

### Agregar una Página

1. **Crear componente** en `client/src/pages/PageName.tsx`
2. **Agregar tipos** en `client/src/types/index.ts` (si necesita)
3. **Importar en App.tsx** y agregar `<Route>`
4. **Agregar navegación** en Header si es necesario

### Agregar Componente

1. **Crear archivo** en `client/src/components/ComponentName.tsx`
2. **Exportar en** `client/src/components/index.ts`
3. **Importar y usar** en páginas

## 🧪 Datos de Prueba

Credenciales incluidas en schema.sql:
- **Admin**: admin@ventasgarzon.com / password
- **Cliente**: juan@example.com / password

Productos de ejemplo ya cargados (6 productos)

## 🎨 Estilos y Animaciones

### Colores del Proyecto
```css
--primary: #10b981   /* Verde */
--secondary: #f59e0b /* Naranja */
--danger: #ef4444    /* Rojo */
--dark: #1f2937      /* Oscuro */
--light: #f9fafb     /* Claro */
```

### Animaciones Predefinidas
```tsx
// En utils/animations.tsx
<FadeIn delay={0.1}>Contenido</FadeIn>
<SlideUp delay={0.2}>Contenido</SlideUp>
```

## 🔐 Variables de Entorno

### Frontend (client/)
No requiere .env para desarrollo local (proxy configurado en vite.config.ts)

### Backend (server/)
Ver `.env.example` - copiar y editar `.env`

## ⚠️ Problemas Comunes

### "Port already in use"
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### "Cannot find module"
```bash
# Limpiar node_modules
rm -rf node_modules package-lock.json
npm install
```

### Errores de base de datos
```bash
# Verificar que PostgreSQL está ejecutándose
psql -U postgres

# Resetear BD
npm run db:setup
```

### CORS errors
- Verificar CORS_ORIGIN en server/.env
- Por defecto: http://localhost:3000

## 📚 Estándar de Código

### TypeScript
- Usar tipos explícitos
- Interfaces para objetos grandes
- Zod para validación

### React
- Functional components
- Hooks en lugar de clases
- Props tipados

### Express
- Async/await en lugar de callbacks
- Validación con Zod
- Error handling con try-catch

### Base de Datos
- Consultas parametrizadas
- Índices en FKs
- Transacciones para operaciones múltiples

## 🚀 Deploy (Próximos Pasos)

1. **Frontend**: Vercel, Netlify
2. **Backend**: Heroku, Railway, DigitalOcean
3. **Database**: Managed PostgreSQL (Heroku Postgres, AWS RDS)

## 📞 Ayuda

Para preguntas de desarrollo, revisa:
- `TECHNICAL.md` - Detalles técnicos
- `INSTALLATION.md` - Setup
- `database/SETUP.md` - Base de datos
- Código existente como referencia

---

**Happy Coding! 🎉**
