import express from 'express';
import cors from 'cors';
import 'express-async-errors';

import { config } from './config/index.js';
import { errorHandler } from './middleware/auth.js';
import { setupDatabase } from './database/setup.js';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';

const app = express();

// Middleware
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Error Handler
app.use(errorHandler);

async function startServer() {
  await setupDatabase();

  const PORT = config.port;
  app.listen(PORT, () => {
    console.log(`✅ Servidor ejecutándose en puerto ${PORT}`);
    console.log(`Ambiente: ${config.nodeEnv}`);
    console.log(`API disponible en http://localhost:${PORT}/api`);
  });
}

startServer().catch((error) => {
  console.error('Error al iniciar el servidor:', error);
  process.exit(1);
});

export default app;
