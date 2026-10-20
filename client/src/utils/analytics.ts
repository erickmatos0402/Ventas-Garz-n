import type { AdminOrder } from '../services/orders';

/** Punto de la gráfica: una barra (día, semana o mes). */
export interface SeriesPoint {
  key: string;
  label: string;
  /** Ingresos de pedidos entregados (ventas confirmadas). */
  revenue: number;
  /** Pedidos entregados en el periodo. */
  orders: number;
}

export interface SalesSummary {
  revenue: number;
  delivered: number;
  pending: number;
  cancelled: number;
  averageTicket: number;
}

/** Huso de la tienda: los días se agrupan por su calendario local. */
const STORE_TIME_ZONE = 'America/Havana';

/** Día del calendario de la tienda (`YYYY-MM-DD`). */
function storeDayKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: STORE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function keyToUtcDate(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function shiftDayKey(key: string, days: number): string {
  const date = keyToUtcDate(key);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function startOfWeekKey(key: string): string {
  // 0 = domingo; la semana de la tienda empieza el lunes.
  const weekday = keyToUtcDate(key).getUTCDay();
  return shiftDayKey(key, weekday === 0 ? -6 : 1 - weekday);
}

const shortDate = (key: string) =>
  new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    keyToUtcDate(key)
  );

const weekdayLabel = (key: string) =>
  new Intl.DateTimeFormat('es-CO', { weekday: 'short', timeZone: 'UTC' }).format(keyToUtcDate(key));

const monthLabel = (key: string) =>
  new Intl.DateTimeFormat('es-CO', { month: 'short', timeZone: 'UTC' }).format(
    keyToUtcDate(`${key}-01`)
  );

/** Solo las ventas confirmadas (pedido entregado) suman ingresos. */
function confirmedRevenue(orders: AdminOrder[]): AdminOrder[] {
  return orders.filter((order) => order.status === 'delivered');
}

function fillSeries(
  orders: AdminOrder[],
  keys: { key: string; label: string }[],
  keyOf: (order: AdminOrder) => string
): SeriesPoint[] {
  const buckets = new Map(keys.map((entry) => [entry.key, { ...entry, revenue: 0, orders: 0 }]));
  for (const order of confirmedRevenue(orders)) {
    const bucket = buckets.get(keyOf(order));
    if (!bucket) continue;
    bucket.revenue += Number(order.total) || 0;
    bucket.orders += 1;
  }
  return keys.map((entry) => buckets.get(entry.key)!);
}

/** Últimos `days` días (incluido hoy), con los días sin ventas en cero. */
export function buildDailySeries(orders: AdminOrder[], days = 14): SeriesPoint[] {
  const today = storeDayKey(new Date());
  const keys = Array.from({ length: days }, (_, index) => {
    const key = shiftDayKey(today, index - (days - 1));
    return { key, label: `${weekdayLabel(key)} ${shortDate(key)}` };
  });
  return fillSeries(orders, keys, (order) => storeDayKey(new Date(order.created_at)));
}

/** Últimas `weeks` semanas completas (lunes a domingo). */
export function buildWeeklySeries(orders: AdminOrder[], weeks = 8): SeriesPoint[] {
  const currentWeek = startOfWeekKey(storeDayKey(new Date()));
  const keys = Array.from({ length: weeks }, (_, index) => {
    const key = shiftDayKey(currentWeek, (index - (weeks - 1)) * 7);
    return { key, label: `${shortDate(key)}` };
  });
  return fillSeries(orders, keys, (order) =>
    startOfWeekKey(storeDayKey(new Date(order.created_at)))
  );
}

/** Últimos `months` meses del calendario. */
export function buildMonthlySeries(orders: AdminOrder[], months = 6): SeriesPoint[] {
  const today = storeDayKey(new Date());
  const [year, month] = today.split('-').map(Number);
  const keys = Array.from({ length: months }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - (months - 1 - index), 1));
    const key = date.toISOString().slice(0, 7);
    return { key, label: monthLabel(key) };
  });
  return fillSeries(orders, keys, (order) =>
    storeDayKey(new Date(order.created_at)).slice(0, 7)
  );
}

/** Totales del periodo para las tarjetas superiores. */
export function summarizeOrders(orders: AdminOrder[]): SalesSummary {
  const delivered = orders.filter((order) => order.status === 'delivered');
  const revenue = delivered.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  return {
    revenue,
    delivered: delivered.length,
    pending: orders.filter((order) => order.status === 'pending' || order.status === 'processing').length,
    cancelled: orders.filter((order) => order.status === 'cancelled').length,
    averageTicket: delivered.length ? Math.round(revenue / delivered.length) : 0,
  };
}
