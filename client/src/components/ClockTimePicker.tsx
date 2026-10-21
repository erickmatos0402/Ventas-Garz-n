import React from 'react';
import type { PickupSlotDay } from '../utils';

/** Alto de cada fila del tambor: debe coincidir con la ventana central. */
const ITEM_HEIGHT = 56;

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
    <div className="space-y-3">
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
              className={`relative flex-shrink-0 rounded-full px-4 min-h-[40px] text-sm font-semibold transition ${
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

      <div className="rounded-3xl p-4 sm:p-5 liquid-badge">
        {/* Resumen del rango elegido: desde qué hora y hasta qué hora. */}
        <div className="text-center px-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gray-400">Recoges entre</p>
          <p className="font-display text-3xl sm:text-4xl font-extrabold text-dark leading-tight">
            {start.hour}:{start.minute}
            <span className="text-sm font-bold text-gray-400 ml-1">{start.period}</span>
          </p>
          <p className="text-sm text-gray-500">
            hasta las <span className="font-semibold text-primary-deep">{end.text}</span>
          </p>
        </div>

        {/* Tambor: rueda de tres filas que gira al deslizar. */}
        <div className="relative mt-4 rounded-2xl border border-white/70 bg-white/40 overflow-hidden">
          {/* Velo superior e inferior: las filas se desvanecen en los bordes. */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-20 h-14"
            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.92), rgba(255,255,255,0))' }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-14"
            style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.92), rgba(255,255,255,0))' }}
            aria-hidden
          />
          {/* Guía de la fila central: ahí queda la hora elegida. */}
          <div
            className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2 z-10 rounded-2xl border border-white/80 bg-white/45"
            style={{ height: ITEM_HEIGHT }}
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
                  className="w-full snap-center flex items-center justify-center border-b border-white/60 focus:outline-none"
                  style={{ height: ITEM_HEIGHT }}
                >
                  <span
                    className={`flex items-baseline gap-2 rounded-full px-4 py-1.5 transition-all duration-200 ${
                      isSelected
                        ? 'bg-primary/15 ring-2 ring-primary text-primary-deep font-display text-2xl scale-[1.04]'
                        : 'text-gray-400 text-lg font-semibold'
                    }`}
                  >
                    {slotStart.hour}:{slotStart.minute} {slotStart.period}
                    <span className="text-xs font-semibold opacity-80">
                      – {slotEnd.hour}:{slotEnd.minute} {slotEnd.period}
                    </span>
                  </span>
                </button>
              );
            })}
            <div style={{ height: ITEM_HEIGHT }} aria-hidden />
          </div>
        </div>

        <p className="text-[11px] text-gray-400 text-center mt-2">
          Desliza para elegir la hora · horario de la tienda, lun a sáb
        </p>
      </div>
    </div>
  );
};
