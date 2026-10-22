import React from 'react';
import type { PickupSlotDay } from '../utils';

/** Alto de cada fila del tambor: debe coincidir con la ventana central.
 *  Compacto a propósito: el checkout es largo y la hora no debe dominarlo. */
const ITEM_HEIGHT = 40;

/** Filas visibles a la vez: la del medio es la hora elegida. */
const VISIBLE_ROWS = 3;

/** Hora del reloj de la tienda en formato corto (`8:00 AM`). */
function pickTimeLabel(date: Date): { hour: number; minute: string; period: string; text: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Havana',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';
  const hour = Number(get('hour')) || 0;
  const minute = get('minute') || '00';
  const period = get('dayPeriod').toUpperCase();
  return { hour, minute, period, text: `${hour}:${minute} ${period}`.trim() };
}

/**
 * Tambor de horas: una rueda de tres filas que gira como la del despertador
 * del teléfono. El día elegido se muestra arriba, la fila del centro es la
 * hora de recogida y cada rango dura 1 hora.
 */
export const ClockTimePicker: React.FC<{
  /** Días con sus rangos de 1 hora (ya calculados en `utils`). */
  days: PickupSlotDay[];
  /** Inicio ISO del rango elegido (cadena vacía si aún no hay ninguno). */
  value: string;
  onChange: (iso: string) => void;
}> = ({ days, value, onChange }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const settleTimer = React.useRef<number | null>(null);

  const dayOfValue = React.useMemo(
    () => days.find((day) => day.slots.some((slot) => slot.toISOString() === value))?.key,
    [days, value]
  );
  const [activeKey, setActiveKey] = React.useState(dayOfValue ?? days[0]?.key ?? '');

  React.useEffect(() => {
    if (!days.some((day) => day.key === activeKey)) {
      setActiveKey(dayOfValue ?? days[0]?.key ?? '');
    }
  }, [days, activeKey, dayOfValue]);

  const activeDay = days.find((day) => day.key === activeKey) ?? days[0];
  const slots = activeDay?.slots ?? [];
  const selectedIndex = Math.max(
    0,
    slots.findIndex((slot) => slot.toISOString() === value)
  );

  const scrollToIndex = React.useCallback((index: number, smooth = false) => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTo({ top: index * ITEM_HEIGHT, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  // Al cambiar de día (o al montar) el tambor se centra en la hora elegida;
  // si ese día aún no tenía hora, se propone la primera disponible.
  React.useLayoutEffect(() => {
    if (!slots.length) return;
    scrollToIndex(selectedIndex);
    const current = slots[selectedIndex];
    if (current && current.toISOString() !== value) {
      onChange(current.toISOString());
    }
    // Solo cuando cambia el día o la lista de huecos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, slots.length]);

  /** Al dejar de girar, la fila más cercana al centro pasa a ser la elegida. */
  const handleScroll = () => {
    const element = scrollRef.current;
    if (!element) return;
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const index = Math.min(slots.length - 1, Math.max(0, Math.round(element.scrollTop / ITEM_HEIGHT)));
      const slot = slots[index];
      if (slot && slot.toISOString() !== value) onChange(slot.toISOString());
    }, 110);
  };

  if (!activeDay || slots.length === 0) {
    return (
      <p className="text-sm text-danger">
        No hay rangos disponibles hoy. Escríbenos por WhatsApp.
      </p>
    );
  }

  const selected = slots[selectedIndex] ?? slots[0];
  const start = pickTimeLabel(selected);
  const end = pickTimeLabel(new Date(selected.getTime() + 60 * 60 * 1000));

  return (
    // Más estrecho y centrado: el tambor no necesita todo el ancho del
    // formulario y así el checkout se lee como una columna limpia.
    <div className="space-y-2 mx-auto w-full max-w-md">
      {/* Días: se elige el día y el tambor solo muestra sus horas. */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1" role="tablist" aria-label="Día de recogida">
        {days.map((day) => {
          const active = day.key === activeDay.key;
          return (
            <button
              key={day.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveKey(day.key)}
              className={`relative flex-shrink-0 rounded-full px-3 min-h-[36px] text-xs font-semibold transition ${
                active
                  ? 'liquid-tab-blob !rounded-full ring-2 ring-primary text-dark'
                  : 'liquid-badge text-dark hover:scale-[1.02]'
              }`}
            >
              {day.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl p-3 liquid-badge">
        {/* Resumen compacto: la hora elegida y el final del rango en una línea. */}
        <div className="flex items-baseline justify-between gap-2 px-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400">Recoges</p>
          <p className="font-display text-base font-extrabold text-primary-deep leading-tight text-right">
            {start.hour}:{start.minute}
            <span className="text-[10px] font-bold text-gray-400 ml-0.5">{start.period}</span>
            <span className="text-[11px] font-semibold text-gray-500"> – {end.text}</span>
          </p>
        </div>

        {/* Tambor: rueda de tres filas que gira al deslizar. */}
        {/* Tambor teñido con la paleta de la tienda activa (verde Mercado /
            topo Boutique): fondo, cantos y velos salen de las variables
            --c-primary-rgb y --c-soft-rgb, nunca de colores fijos. */}
        <div
          className="relative mt-2 rounded-xl overflow-hidden"
          style={{
            background:
              'linear-gradient(160deg, rgba(var(--c-primary-rgb), 0.08), rgba(var(--c-soft-rgb), 0.45))',
            border: '1px solid rgba(var(--c-primary-rgb), 0.22)',
          }}
        >
          {/* Velo superior e inferior: las filas se desvanecen en los bordes. */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-20 h-10"
            style={{ background: 'linear-gradient(to bottom, rgba(var(--c-soft-rgb), 0.96), rgba(var(--c-soft-rgb), 0))' }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-10"
            style={{ background: 'linear-gradient(to top, rgba(var(--c-soft-rgb), 0.96), rgba(var(--c-soft-rgb), 0))' }}
            aria-hidden
          />
          {/* Guía de la fila central: ahí queda la hora elegida. */}
          <div
            className="pointer-events-none absolute inset-x-1.5 top-1/2 -translate-y-1/2 z-10 rounded-xl"
            style={{
              height: ITEM_HEIGHT,
              background: 'rgba(var(--c-primary-rgb), 0.12)',
              border: '1px solid rgba(var(--c-primary-rgb), 0.35)',
            }}
            aria-hidden
          />

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            role="listbox"
            aria-label="Hora de recogida"
            className="time-drum relative z-0 overflow-y-auto snap-y snap-proximity"
            style={{
              height: ITEM_HEIGHT * VISIBLE_ROWS,
              scrollPaddingTop: ITEM_HEIGHT,
              scrollPaddingBottom: ITEM_HEIGHT,
            }}
          >
            <div style={{ height: ITEM_HEIGHT }} aria-hidden />
            {slots.map((slot, index) => {
              const slotStart = pickTimeLabel(slot);
              const slotEnd = pickTimeLabel(new Date(slot.getTime() + 60 * 60 * 1000));
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={slot.toISOString()}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(slot.toISOString());
                    scrollToIndex(index, true);
                  }}
                  className="w-full snap-center flex items-center justify-center border-b border-white/40 focus:outline-none"
                  style={{ height: ITEM_HEIGHT }}
                >
                  <span
                    className={`flex items-baseline gap-1.5 rounded-full px-3 py-0.5 transition-all duration-200 ${
                      isSelected
                        ? 'bg-primary/15 ring-1 ring-primary text-primary-deep font-display text-base scale-[1.03]'
                        : 'text-gray-400 text-[13px] font-semibold'
                    }`}
                  >
                    {slotStart.hour}:{slotStart.minute} {slotStart.period}
                    <span className="text-[10px] font-semibold opacity-80">
                      – {slotEnd.hour}:{slotEnd.minute} {slotEnd.period}
                    </span>
                  </span>
                </button>
              );
            })}
            <div style={{ height: ITEM_HEIGHT }} aria-hidden />
          </div>
        </div>

        <p className="text-[10px] text-gray-400 text-center mt-1.5">
          Desliza para elegir la hora · lun a sáb
        </p>
      </div>
    </div>
  );
};
