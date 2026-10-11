import { query, ensureDatabaseExists } from './index.js';
import { hashPassword } from '../utils/helpers.js';

export async function setupDatabase() {
  try {
    console.log('Setting up database...');

    // Crear la base de datos si no existe (evita error ECONNREFUSED la primera vez)
    await ensureDatabaseExists();

    // Users table
    await query(`
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
    `);

    // Products table
    await query(`
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
    `);

    // Orders table
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        total DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        shipping_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Order items table
    await query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes
    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);`);
    await query(`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);`);

    // Seed admin user
    const adminEmail = 'admin@ventasgarzon.com';
    const adminPassword = 'Admin@1234';
    const adminName = 'Administrador Ventas Garzón';
    const hashedAdminPassword = await hashPassword(adminPassword);

    await query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'admin') ON CONFLICT (email) DO NOTHING;`,
      [adminName, adminEmail, hashedAdminPassword]
    );

    // Seed demo customer
    const customerEmail = 'juan@example.com';
    const hashedCustomerPassword = await hashPassword('Customer@123');

    await query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'customer') ON CONFLICT (email) DO NOTHING;`,
      ['Juan Pérez', customerEmail, hashedCustomerPassword]
    );

    // Seed demo products (usa las fotos locales del proyecto /Fotos)
    const demoProducts = [
      {
        name: 'Detergente Líquido',
        description: 'Detergente líquido concentrado para ropa, rinde hasta 40 lavadas.',
        price: 15000,
        image: '/img/prod1.jpg',
        category: 'aseo',
        stock: 50,
        rating: 4.5,
        reviews: 120,
      },
      {
        name: 'Jabón en Barra',
        description: 'Jabón neutro para piel sensible, pack por unidad.',
        price: 5000,
        image: '/img/prod2.jpg',
        category: 'aseo',
        stock: 100,
        rating: 4.0,
        reviews: 85,
      },
      {
        name: 'Desinfectante Multiusos',
        description: 'Desinfectante líquido multiusos, aroma fresco, 1 litro.',
        price: 12000,
        image: '/img/prod3.jpg',
        category: 'aseo',
        stock: 75,
        rating: 4.8,
        reviews: 200,
      },
      {
        name: 'Arroz Blanco',
        description: 'Arroz blanco de grano largo premium, bolsa de 1 kg.',
        price: 25000,
        image: '/img/prod4.jpg',
        category: 'alimentos',
        stock: 80,
        rating: 4.3,
        reviews: 150,
      },
      {
        name: 'Pasta Integral',
        description: 'Pasta integral alta en fibra, 500 gramos.',
        price: 8000,
        image: '/img/prod5.jpg',
        category: 'alimentos',
        stock: 60,
        rating: 4.6,
        reviews: 95,
      },
      {
        name: 'Aceite de Oliva',
        description: 'Aceite de oliva virgen extra, botella de 500 ml.',
        price: 45000,
        image: '/img/prod6.jpg',
        category: 'alimentos',
        stock: 40,
        rating: 4.9,
        reviews: 180,
      },
      {
        name: 'Suavizante de Telas',
        description: 'Suavizante concentrado para ropas, aroma floral, 1 litro.',
        price: 13500,
        image: '/img/prod7.jpg',
        category: 'aseo',
        stock: 65,
        rating: 4.4,
        reviews: 110,
      },
      {
        name: 'Café Molido',
        description: 'Café molido tostado natural, paquete de 250 gramos.',
        price: 22000,
        image: '/img/prod8.jpg',
        category: 'alimentos',
        stock: 55,
        rating: 4.7,
        reviews: 160,
      },
      {
        name: 'Shampoo Hidratante',
        description: 'Shampoo hidratante para todo tipo de cabello, 400 ml.',
        price: 16500,
        image: '/img/prod9.jpg',
        category: 'aseo',
        stock: 45,
        rating: 4.5,
        reviews: 90,
      },
      {
        name: 'Leche en Polvo',
        description: 'Leche en polvo entera fortificada, lata de 400 gramos.',
        price: 28000,
        image: '/img/prod10.jpg',
        category: 'alimentos',
        stock: 35,
        rating: 4.6,
        reviews: 130,
      },
    ];

    const countResult = await query<{ count: number }>(`SELECT COUNT(*)::int AS count FROM products;`);
    if (countResult.rows[0].count === 0) {
      for (const p of demoProducts) {
        await query(
          `INSERT INTO products (name, description, price, image, category, stock, rating, reviews)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
          [p.name, p.description, p.price, p.image, p.category, p.stock, p.rating, p.reviews]
        );
      }
      console.log(`✅ ${demoProducts.length} productos de ejemplo insertados`);
    }

    console.log('Database setup completed successfully');
    console.log('Admin seeded:', adminEmail);
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
}
