import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Loader2,
  MessageSquare,
  ShoppingCart,
  Star,
  Trash2,
} from 'lucide-react';
import { SlideUp } from '../utils/animations';
import { formatPrice, formatDate } from '../utils';
import { useAuthStore, useCartStore, useCatalogStore, useThemeStore } from '../store';
import { getDiscountedPrice } from '../data/mockData';
import { reviewService } from '../services/reviews';
import { ProductReview } from '../types';
import { useImageWithFallback } from '../hooks/useImageWithFallback';

/** Fila de estrellas (rellenas hasta `value`). */
const Stars: React.FC<{ value: number; size?: number }> = ({ value, size = 16 }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${value} de 5 estrellas`}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={size}
        className={star <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
      />
    ))}
  </span>
);

export const ProductReviewsPage: React.FC = () => {
  const { id = '' } = useParams();
  const theme = useThemeStore((s) => s.theme);
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const products = useCatalogStore((s) => s.products);
  const catalogLoaded = useCatalogStore((s) => s.loaded);
  const catalogLoading = useCatalogStore((s) => s.loading);
  const fetchProducts = useCatalogStore((s) => s.fetchProducts);
  const cart = useCartStore(theme);
  const { addItem } = cart();

  const product = useMemo(() => products.find((p) => p.id === id), [products, id]);
  const { src, failed, onError } = useImageWithFallback(product?.image, product?.fallbackImage);

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');

  const myReview = user ? reviews.find((review) => review.userId === user.id) : undefined;

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!catalogLoaded && !catalogLoading) void fetchProducts();
  }, [catalogLoaded, catalogLoading, fetchProducts]);

  const loadReviews = async () => {
    if (!id) return;
    setReviewsLoading(true);
    setReviewsError('');
    try {
      setReviews(await reviewService.listByProduct(id));
    } catch (err) {
      setReviewsError(err instanceof Error ? err.message : 'No se pudieron cargar las reseñas');
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    void loadReviews();
    // `id` cambia al navegar entre fichas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // La reseña propia precarga el formulario para poder editarla.
  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment);
    }
  }, [myReview]);

  const summary = useMemo(() => {
    if (reviews.length === 0) return { average: 0, count: 0 };
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return { average: total / reviews.length, count: reviews.length };
  }, [reviews]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaved(false);

    if (!user) {
      setFormError('Inicia sesión para calificar el producto y dejar tu comentario');
      return;
    }
    if (rating < 1) {
      setFormError('Elige una calificación de 1 a 5 estrellas');
      return;
    }

    setSaving(true);
    try {
      await reviewService.save({
        productId: id,
        userId: user.id,
        rating,
        comment,
      });
      await loadReviews();
      // Los promedios viven en `products`: se refrescan para las tarjetas.
      void fetchProducts(true);
      setSaved(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar tu reseña');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!myReview) return;
    setFormError('');
    try {
      await reviewService.remove(myReview.id);
      setRating(0);
      setComment('');
      await loadReviews();
      void fetchProducts(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'No se pudo eliminar tu reseña');
    }
  };

  const handleAdd = () => {
    if (!product || product.stock === 0) return;
    addItem(product, 1);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  };

  if (!catalogLoaded && catalogLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4">
        <p className="text-gray-500">Cargando producto…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4 py-16">
        <div className="glass-strong rounded-3xl p-6 sm:p-8 max-w-md text-center w-full">
          <MessageSquare size={40} className="mx-auto mb-4 text-primary/50" />
          <h1 className="font-display text-2xl font-extrabold text-dark mb-2">Producto no encontrado</h1>
          <p className="text-gray-500 mb-6">Puede que ya no esté disponible en el catálogo.</p>
          <Link to="/products" className="btn-liquid inline-flex items-center justify-center w-full py-3">
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  const outOfStock = product.stock === 0;

  return (
    <div className="min-h-dvh pt-8 sm:pt-16 pb-24 sm:pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary-deep hover:underline mb-6"
        >
          <ArrowLeft size={16} />
          Volver a la tienda
        </Link>

        <SlideUp>
          <div className="glass-strong rounded-3xl p-4 sm:p-6 grid sm:grid-cols-[180px_1fr] gap-4 sm:gap-6">
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white/70 border border-white/80 flex items-center justify-center">
              <span className="text-5xl">{product.emoji || '🛍️'}</span>
              {src && !failed && (
                <img
                  src={src}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  onError={onError}
                />
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-dark mb-1">
                {product.name}
              </h1>
              <p className="text-gray-500 text-sm mb-3">{product.description}</p>

              <div className="flex items-center gap-2 mb-3">
                <Stars value={summary.average} size={18} />
                <span className="text-sm text-gray-500">
                  {summary.count === 0
                    ? 'Sin reseñas todavía'
                    : `${summary.average.toFixed(1)} · ${summary.count} ${summary.count === 1 ? 'reseña' : 'reseñas'}`}
                </span>
              </div>

              <div className="flex flex-wrap items-end gap-3 mb-4">
                <p className="text-2xl font-bold text-primary-deep">{formatPrice(getDiscountedPrice(product))}</p>
                {product.discount ? (
                  <p className="text-sm text-gray-400 line-through mb-1">{formatPrice(product.price)}</p>
                ) : null}
                <span className={`text-xs font-semibold ${outOfStock ? 'text-danger' : 'text-gray-500'}`}>
                  {outOfStock ? 'Agotado' : `${product.stock} disponibles`}
                </span>
              </div>

              {product.restockDays != null ? (
                <div className="liquid-badge rounded-2xl px-4 py-2.5 text-sm text-gray-600 mb-4">
                  {outOfStock ? 'Espera de abastecimiento' : 'Próxima reposición'}: aproximadamente{' '}
                  <span className="font-bold text-primary-deep">
                    {product.restockDays} {product.restockDays === 1 ? 'día' : 'días'}
                  </span>
                  .
                </div>
              ) : outOfStock ? (
                <div className="liquid-badge rounded-2xl px-4 py-2.5 text-sm text-gray-600 mb-4">
                  Agotado: esperando abastecimiento. Escríbenos por WhatsApp para confirmar la llegada.
                </div>
              ) : null}

              <div className="mt-auto">
                <motion.button
                  whileTap={{ scale: outOfStock ? 1 : 0.98 }}
                  onClick={handleAdd}
                  disabled={outOfStock}
                  className="btn-liquid inline-flex items-center justify-center gap-2 px-6 py-3 disabled:cursor-not-allowed"
                >
                  {justAdded ? <CheckCircle size={17} /> : <ShoppingCart size={17} />}
                  {outOfStock ? 'Agotado' : justAdded ? '¡Añadido!' : 'Agregar al carrito'}
                </motion.button>
              </div>
            </div>
          </div>
        </SlideUp>

        <div className="grid lg:grid-cols-[1fr_380px] gap-6 mt-8 items-start">
          {/* Reseñas publicadas */}
          <section className="glass-panel rounded-3xl p-5 sm:p-6">
            <h2 className="font-display text-xl font-bold text-dark mb-4">
              Opiniones de compra
            </h2>

            {reviewsLoading ? (
              <p className="text-sm text-gray-500">Cargando reseñas…</p>
            ) : reviewsError ? (
              <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-2xl flex items-start gap-2 text-sm">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <span>{reviewsError}</span>
              </div>
            ) : reviews.length === 0 ? (
              <div className="liquid-badge rounded-2xl p-6 text-center text-sm text-gray-500">
                Este producto todavía no tiene reseñas. Si ya lo compraste, sé la primera persona en opinar.
              </div>
            ) : (
              <ul className="space-y-4">
                {reviews.map((review) => (
                  <li key={review.id} className="liquid-badge rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-dark truncate">
                          {review.authorName}
                          {user?.id === review.userId && (
                            <span className="ml-2 text-[11px] font-semibold text-primary-deep">(tu reseña)</span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Stars value={review.rating} size={13} />
                          <span className="text-[11px] text-gray-400">{formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                      {user?.id === review.userId && (
                        <button
                          type="button"
                          onClick={handleDelete}
                          className="text-danger hover:bg-white/70 rounded-full p-2 transition flex-shrink-0"
                          aria-label="Eliminar mi reseña"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{review.comment}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Formulario: requiere sesión */}
          <section className="glass-strong rounded-3xl p-5 sm:p-6 lg:sticky lg:top-24">
            <h2 className="font-display text-xl font-bold text-dark mb-1">
              {myReview ? 'Editar tu reseña' : 'Califica este producto'}
            </h2>
            <p className="text-xs text-gray-500 mb-4">Cuéntanos cómo fue tu experiencia de compra.</p>

            {!user ? (
              <div className="liquid-badge rounded-2xl p-4 text-sm text-gray-600">
                <p className="mb-3">Necesitas iniciar sesión para calificar y comentar.</p>
                <Link
                  to={`/login?next=${encodeURIComponent(`/products/${id}`)}`}
                  className="btn-liquid inline-flex w-full items-center justify-center py-3"
                >
                  Iniciar sesión o registrarse
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <span className="block text-sm font-bold text-dark mb-1.5">Calificación</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        aria-label={`${star} estrellas`}
                        aria-pressed={rating === star}
                        className="p-1 rounded-full transition hover:scale-110"
                      >
                        <Star
                          size={26}
                          className={
                            star <= (hoverRating || rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="review-comment" className="block text-sm font-bold text-dark mb-1.5">
                    Tu comentario
                  </label>
                  <textarea
                    id="review-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    maxLength={1000}
                    required
                    minLength={5}
                    placeholder="¿Qué te pareció el producto y la atención?"
                    className="w-full px-4 py-3 rounded-2xl bg-white/60 border border-white/70 outline-none focus:ring-2 focus:ring-primary/60 text-sm resize-none"
                  />
                </div>

                {formError && (
                  <div className="bg-danger/10 border border-danger text-danger px-4 py-3 rounded-2xl flex items-start gap-2 text-sm">
                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                {saved && (
                  <div className="bg-primary/10 border border-primary/40 text-primary-deep px-4 py-3 rounded-2xl flex items-start gap-2 text-sm">
                    <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
                    <span>¡Gracias! Tu reseña ya está publicada.</span>
                  </div>
                )}
                {(saved || !!myReview) && (
                  <p className="text-[11px] text-gray-400">
                    Publicada como <span className="font-semibold">{user.name}</span>.
                  </p>
                )}

                <motion.button
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={saving || authLoading}
                  className="btn-liquid w-full py-3 flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 size={17} className="animate-spin" /> : <MessageSquare size={17} />}
                  {saving ? 'Publicando…' : myReview ? 'Guardar cambios' : 'Publicar reseña'}
                </motion.button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
