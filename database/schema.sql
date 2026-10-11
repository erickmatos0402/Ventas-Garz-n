-- Crear base de datos
CREATE DATABASE IF NOT EXISTS ventas_garzon;

-- Cambiar a la base de datos
\c ventas_garzon

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'customer',
  avatar TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image TEXT,
  category VARCHAR(100) NOT NULL,
  stock INTEGER DEFAULT 0,
  rating DECIMAL(3, 2),
  reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de órdenes
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  shipping_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de items de órdenes
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Datos de ejemplo
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@ventasgarzon.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG', 'admin'),
('Juan Pérez', 'juan@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/TVG', 'customer');

INSERT INTO products (name, description, price, image, category, stock, rating, reviews) VALUES
('Detergente Líquido', 'Detergente líquido concentrado para ropa', 15000, 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=300&fit=crop', 'aseo', 50, 4.5, 120),
('Jabón en Barra', 'Jabón neutro para piel sensible', 5000, 'https://images.unsplash.com/photo-1600857062241-98e5dba7214f?w=400&h=300&fit=crop', 'aseo', 100, 4.0, 85),
('Desinfectante', 'Desinfectante líquido multiusos', 12000, 'https://images.unsplash.com/photo-1577720643272-265b67ad8d2c?w=400&h=300&fit=crop', 'aseo', 75, 4.8, 200),
('Arroz Blanco', 'Arroz blanco de grano largo premium', 25000, 'https://images.unsplash.com/photo-1586857287087-a7bf4d7d2c5f?w=400&h=300&fit=crop', 'alimentos', 80, 4.3, 150),
('Pasta Integral', 'Pasta integral alta en fibra', 8000, 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop', 'alimentos', 60, 4.6, 95),
('Aceite de Oliva', 'Aceite de oliva virgen extra', 45000, 'https://images.unsplash.com/photo-1474818646048-ec0e2e639787?w=400&h=300&fit=crop', 'alimentos', 40, 4.9, 180);
