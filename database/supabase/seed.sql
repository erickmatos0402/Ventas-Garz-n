-- ============================================================================
-- Ventas Garzón — catálogo inicial
--
-- Ejecuta este archivo DESPUÉS de schema.sql. Solo inserta si la tabla
-- public.products está vacía, así que es seguro volver a ejecutarlo.
--
-- Para convertirte en administrador: regístrate en la app y luego ejecuta
--   update public.profiles set role = 'admin' where email = 'tu@correo.com';
-- ============================================================================

do $$
begin
  if exists (select 1 from public.products) then
    raise notice 'public.products ya tiene datos; no se carga el catálogo inicial';
    return;
  end if;

  insert into public.products (store, name, description, price, image, fallback_image, category, subcategory, stock, rating, reviews, discount, emoji) values
    ('market', 'Shampoo Hidratante 400ml', 'Shampoo con aceite de coco para todo tipo de cabello. Fórmula suave y con aroma fresco.', 7600, '/img/products/shampoo.jpg', '/img/products/shampoo.svg', 'aseo', null, 24, 4.6, 38, 15, '🧴'),
    ('market', 'Jabón de Baño x3', 'Pack de 3 jabones de tocador con glicerina hidratante. Espuma cremosa y aroma duradero.', 5600, '/img/products/jabon-bano.jpg', '/img/products/jabon-bano.svg', 'aseo', null, 42, 4.4, 26, 30, '🧼'),
    ('market', 'Pasta Dental 100ml', 'Crema dental con flúor para protección anticaries y aliento fresco todo el día.', 3900, '/img/products/pasta-dental.jpg', '/img/products/pasta-dental.svg', 'aseo', null, 50, 4.7, 44, null, '🦷'),
    ('market', 'Jabón de Lavar Barra x2', 'Jabón de lavar en barra, extra rendidor para el lavado a mano de toda la familia.', 3200, '/img/products/jabon-lavar.jpg', '/img/products/jabon-lavar.svg', 'aseo', null, 60, 4.5, 33, 20, '🧽'),
    ('market', 'Caldito de Pollo', 'Caldo de pollo casero, listo para servir o usar de base en sopas y guisos.', 12500, '/img/products/caldito-pollo.jpg', null, 'alimentos', null, 18, 4.8, 21, 10, '🍲'),
    ('market', 'Jugos Naturales 1L', 'Jugos naturales de fruta fresca, sin azúcar añadida. Idea para el desayuno de la casa.', 8500, '/img/products/jugos.jpg', null, 'alimentos', null, 30, 4.6, 19, 25, '🧃'),
    ('market', 'Refrescos Surtidos x6', 'Pack de 6 refrescos bien fríos para compartir. Surtido de los sabores favoritos.', 4800, '/img/products/refrescos.jpg', null, 'alimentos', null, 65, 4.4, 27, null, '🥤'),
    ('market', 'Puré de Tomate 210g', 'Puré de tomate concentrado, ideal para salsas, guisos y arroces. Sabor casero.', 2600, '/img/products/pure-tomate.jpg', '/img/products/pure-tomate.svg', 'alimentos', null, 70, 4.5, 40, null, '🥫'),
    ('market', 'Sopitas con Fideo x14', 'Presentación familiar de sopa de fideo. Lista en minutos, sabor de siempre.', 3400, '/img/products/sopita-instantanea.jpg', '/img/products/sopitas.svg', 'alimentos', null, 80, 4.7, 58, 15, '🍜'),
    ('market', 'Sazón Casera 250g', 'Mezcla de especias casera para sazonar carnes, sopas y guisos. Sabor de la abuela.', 6200, '/img/products/sazon.jpg', null, 'alimentos', null, 45, 4.9, 31, null, '🧂'),
    ('boutique', 'Vestido Floral Midi', 'Vestido midi con estampado floral en tonos suaves. Tela fresca y caída preciosa. Talla M.', 28000, '/img/boutique/real/vestido-floral.webp', null, 'aseo', 'conjuntos', 1, 4.9, 12, 30, '👗'),
    ('boutique', 'Camisa de Lino Crudo', 'Camisa de lino respirable, corte relajado. Perfecta para el calor de Santiago. Talla L.', 19500, '/img/boutique/real/camisa-lino.webp', null, 'aseo', 'superior', 1, 4.7, 8, null, '👔'),
    ('boutique', 'Jeans Rectos Clásicos', 'Mezclilla resistente con corte recto atemporal. Como nuevos. Talla 32.', 22000, '/img/boutique/real/jeans.webp', null, 'aseo', 'inferior', 1, 4.8, 15, 20, '👖'),
    ('boutique', 'Blusa de Seda Vintage', 'Blusa de seda con corte clásico de los 90. Pieza única degarage. Talla S.', 16000, '/img/boutique/real/blusa-seda.webp', null, 'aseo', 'superior', 1, 4.6, 6, null, '👚'),
    ('boutique', 'Chaqueta Denim Oversize', 'Chaqueta de mezclilla oversize, lavado medio. Combinable con todo. Talla M.', 26000, '/img/boutique/real/chaqueta-denim.webp', null, 'aseo', 'superior', 1, 4.9, 11, 15, '🧥'),
    ('boutique', 'Falda Plisada Coctel', 'Falda plisada con movimiento elegante, ideal para ocasiones especiales. Talla M.', 17500, '/img/boutique/real/falda.webp', null, 'aseo', 'inferior', 1, 4.5, 5, null, '🩱'),
    ('boutique', 'Sombrero de Paja Amplio', 'Sombrero de paja natural con ala ancha. Sombra y estilo en la playa o la ciudad.', 12000, '/img/boutique/real/sombrero.webp', null, 'alimentos', 'accesorios', 2, 4.7, 9, null, '👒'),
    ('boutique', 'Bolso de Cuero Curso', 'Bolso de cuero genuino con herrajes dorados. Curado con cariño, gran capacidad.', 34000, '/img/boutique/real/bolso.webp', null, 'alimentos', 'accesorios', 1, 5, 14, 25, '👜'),
    ('boutique', 'Bufanda de Punto', 'Bufanda tejida a mano, suave y abrigadora. Hecho con puntada artesanal.', 9500, '/img/boutique/real/bufanda.webp', null, 'alimentos', 'accesorios', 3, 4.8, 7, null, '🧣'),
    ('boutique', 'Tacones Clásicos 38', 'Zapatos de tacón clásico en tono neutro. Altura perfecta para toda la noche. Talla 38.', 21000, '/img/boutique/real/zapatos.webp', null, 'alimentos', 'accesorios', 1, 4.6, 10, null, '👠'),
    ('boutique', 'Collar de Piedras Azules', 'Collar con piedras naturales engarzadas. Pieza statement artesanal.', 14000, '/img/boutique/real/collar.webp', null, 'alimentos', 'accesorios', 2, 4.9, 13, null, '📿'),
    ('boutique', 'Gafas de Sol Retro', 'Gafas con montura rosa retro y protección UV. Estilo de los 70 auténtico.', 8500, '/img/boutique/real/gafas.webp', null, 'alimentos', 'accesorios', 4, 4.4, 6, 10, '🕶️');
end $$;
