import React from 'react';
import { motion } from 'framer-motion';
import type { PickupSlotDay } from '../utils';

/** Alto de cada fila del tambor: debe coincidir con la ventana central. */
const ITEM_HEIGHT = 48;

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
 * Reloj de alarma de iOS: un tambor que gira en la rueda del medio en vez
 * de mostrar la lista completa de horarios. Solo se ven las horas cercanas
 * a la seleccionada, con el día elegido arriba y una esfera de reloj que
 * resume el rango de 1 hora.
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
        <div className="flex items-center gap-4">
          {/* Esfera tipo reloj: manecilla en la hora de inicio y arco del rango. */}
          <AlarmDial hour={start.hour} />

          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.22em] text-gray-400">Recoges entre</p>
            <p className="font-display text-2xl sm:text-3xl font-extrabold text-dark leading-tight">
              {start.hour}:{start.minute}
              <span className="text-sm font-bold text-gray-400 ml-1">{start.period}</span>
            </p>
            <p className="text-sm text-gray-500">
              hasta las <span className="font-semibold text-primary-deep">{end.text}</span>
            </p>
          </div>
        </div>

        {/* Tambor: ventana de 3 filas que gira como la rueda de la alarma. */}
        <div className="relative mt-4">
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 z-10 rounded-2xl border border-white/80 bg-white/55 shadow-glass"
            style={{ height: ITEM_HEIGHT }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-20"
            style={{ height: ITEM_HEIGHT, background: 'linear-gradient(to bottom, rgba(250,252,252,0.95), rgba(250,252,252,0))' }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20"
            style={{ height: ITEM_HEIGHT, background: 'linear-gradient(to top, rgba(250,252,252,0.95), rgba(250,252,252,0))' }}
            aria-hidden
          />

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            role="listbox"
            aria-label="Hora de recogida"
            className="relative z-0 h-[144px] overflow-y-auto no-scrollbar snap-y snap-mandatory"
            style={{ scrollPaddingTop: ITEM_HEIGHT }}
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
                  className={`w-full snap-center flex items-center justify-center font-display text-xl font-bold transition ${
                    isSelected ? 'text-primary-deep scale-105' : 'text-gray-400'
                  }`}
                  style={{ height: ITEM_HEIGHT }}
                >
                  {slotStart.hour}:{slotStart.minute} {slotStart.period}
                  <span className="text-xs font-semibold text-gray-400 ml-2">
                    – {slotEnd.hour}:{slotEnd.minute} {slotEnd.period}
                  </span>
                </button>
              );
            })}
            <div style={{ height: ITEM_HEIGHT }} aria-hidden />
          </div>
        </div>

        <p className="text-[11px] text-gray-400 text-center mt-2">
          Desliza el reloj para elegir la hora · horario de la tienda, lun a sáb
        </p>
      </div>
    </div>
  );
};

/**
 * Esfera del reloj con la manecilla en la hora elegida y un arco que marca
 * la ventana de 1 hora, como la carátula del despertador.
 */
const AlarmDial: React.FC<{ hour: number }> = ({ hour }) => {
  const R = 30;
  const center = 40;
  const startDeg = ((hour % 12) + 0) * 30 - 90;
  const endDeg = startDeg + 30;
  const point = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return [center + R * Math.cos(rad), center + R * Math.sin(rad)] as const;
  };
  const [x1, y1] = point(startDeg);
  const [x2, y2] = point(endDeg);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/85 border border-white shadow-inner flex-shrink-0"
    >
      <svg viewBox="0 0 80 80" className="absolute inset-0 w-full h-full" aria-hidden>
        <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(5,36,43,0.08)" strokeWidth="2" />
        <path
          d={`M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`}
          fill="none"
          stroke="var(--c-primary)"
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.35"
        />
        {[0, 3, 6, 9].map((tick) => {
          const deg = tick * 30;
          const [tx, ty] = point(deg);
          return <circle key={tick} cx={tx} cy={ty} r="1.6" fill="rgba(5,36,43,0.35)" />;
        })}
        {/* Manecilla de la hora (el minutero queda en punto, :00). */}
        <line
          x1="40"
          y1="40"
          x2="40"
          y2="19"
          stroke="var(--c-primary-deep)"
          strokeWidth="3.2"
          strokeLinecap="round"
          transform={`rotate(${hour * 30} 40 40)`}
        />
        <circle cx="40" cy="40" r="3" fill="var(--c-primary-deep)" />
      </svg>
    </motion.div>
  );
};
