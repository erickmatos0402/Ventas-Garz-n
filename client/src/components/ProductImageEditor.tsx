import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Crop,
  Eraser,
  RotateCw,
  FlipHorizontal2,
  Undo2,
  RotateCcw,
  Check,
  Loader2,
  Sun,
  Contrast,
  AlertCircle,
  Move,
} from 'lucide-react';
import { LiquidTabs } from './LiquidTabs';

/** Tamaño máximo del resultado (lado mayor, en píxeles). */
const MAX_OUTPUT = 900;
/** Tamaño máximo con el que se procesa la imagen mientras se edita. */
const MAX_WORK = 1100;
/** Margen entre el marco de recorte y el borde del visor. */
const FRAME_MARGIN = 12;

const ASPECTS = [
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '4:5', label: '4:5', ratio: 4 / 5 },
  { id: '16:10', label: '16:10', ratio: 16 / 10 },
  { id: '3:4', label: '3:4', ratio: 3 / 4 },
] as const;

type AspectId = (typeof ASPECTS)[number]['id'];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(
        new Error(
          'No se pudo leer esta imagen. Sube la foto desde tu equipo o usa una ruta del sitio para poder editarla.'
        )
      );
    img.src = src;
  });
}

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Tu navegador no permite editar imágenes');
  return [canvas, ctx];
}

/** Dibuja una imagen ya cargada, reducida a `maxSize` en su lado mayor. */
function drawScaled(img: HTMLImageElement, maxSize: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const [canvas, ctx] = makeCanvas(img.width * scale, img.height * scale);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return [canvas, ctx];
}

/**
 * Guarda el lienzo eligiendo el formato según tenga transparencia o no:
 * PNG cuando el fondo se eliminó (para no perder el recorte) y JPEG en
 * fotos normales (data URL mucho más liviana en la base de datos).
 */
function canvasToDataUrl(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): string {
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 3; i < data.length; i += 4 * 3) {
    if (data[i] < 250) return canvas.toDataURL('image/png');
  }
  return canvas.toDataURL('image/jpeg', 0.86);
}

/** Color de referencia del fondo: esquinas y puntos medios de los bordes. */
function borderColors(data: Uint8ClampedArray, width: number, height: number): number[][] {
  const points: [number, number][] = [
    [2, 2],
    [width - 3, 2],
    [2, height - 3],
    [width - 3, height - 3],
    [Math.floor(width / 2), 2],
    [Math.floor(width / 2), height - 3],
    [2, Math.floor(height / 2)],
    [width - 3, Math.floor(height / 2)],
  ];
  return points.map(([x, y]) => {
    const i = (y * width + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  });
}

/**
 * Quita el fondo por similitud de color: rellena desde los bordes todo lo
 * que se parezca al color de las esquinas (tolerancia ajustable) y deja
 * esos píxeles transparentes. Solo elimina zonas CONECTADAS al borde, así
 * un detalle del mismo color dentro del producto se conserva.
 */
async function removeBackgroundFrom(src: string, tolerance: number): Promise<string> {
  const img = await loadImage(src);
  const [canvas, ctx] = drawScaled(img, MAX_WORK);
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const refs = borderColors(data, width, height);
  // 0..100 → distancia RGB máxima 0..240 (el blanco y el negro quedan a 441).
  const threshold = (tolerance / 100) * 240;
  const thresholdSq = threshold * threshold;

  const matches = (index: number) => {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    for (const [rr, gg, bb] of refs) {
      const dr = r - rr;
      const dg = g - gg;
      const db = b - bb;
      if (dr * dr + dg * dg + db * db <= thresholdSq) return true;
    }
    return false;
  };

  const visited = new Uint8Array(width * height);
  const stack: number[] = [];

  const seed = (x: number, y: number) => {
    const pixel = y * width + x;
    if (!visited[pixel] && matches(pixel * 4)) {
      visited[pixel] = 1;
      stack.push(pixel);
    }
  };

  for (let x = 0; x < width; x += 1) {
    seed(x, 0);
    seed(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    seed(0, y);
    seed(width - 1, y);
  }

  while (stack.length) {
    const pixel = stack.pop() as number;
    data[pixel * 4 + 3] = 0;
    const x = pixel % width;
    const y = (pixel - x) / width;

    if (x > 0) seed(x - 1, y);
    if (x < width - 1) seed(x + 1, y);
    if (y > 0) seed(x, y - 1);
    if (y < height - 1) seed(x, y + 1);
  }

  ctx.putImageData(imageData, 0, 0);
  return canvasToDataUrl(canvas, ctx);
}

interface ProductImageEditorProps {
  /** Imagen actual del producto (ruta del sitio, URL o data URL). */
  src: string;
  productName?: string;
  onApply: (dataUrl: string) => void;
  onClose: () => void;
}

/**
 * ProductImageEditor — taller de imagen del panel de administración.
 *
 * Todo ocurre en el navegador, sin servicios externos: recorte con zoom y
 * encuadre (arrastrando), quitar fondo por similitud de color, giro, espejo,
 * brillo y contraste, con deshacer. Al aplicar devuelve un PNG/JPEG en data
 * URL listo para guardarse en el producto.
 */
export const ProductImageEditor: React.FC<ProductImageEditorProps> = ({
  src,
  productName,
  onApply,
  onClose,
}) => {
  const [workSrc, setWorkSrc] = useState(src);
  const [history, setHistory] = useState<string[]>([]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<AspectId>('1:1');
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [tolerance, setTolerance] = useState(22);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [busy, setBusy] = useState<'crop' | 'background' | 'transform' | 'save' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewport, setViewport] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // El visor es cuadrado y se mide: el marco y el encuadre se calculan en
  // píxeles reales para que el recorte coincida exactamente con lo que se ve.
  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;
    const measure = () => setViewport(element.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const pushHistory = useCallback((next: string) => {
    setHistory((list) => [...list, workSrc]);
    setWorkSrc(next);
    setOffset({ x: 0, y: 0 });
    setZoom(1);
  }, [workSrc]);

  const geometry = useMemo(() => {
    const ratio = ASPECTS.find((item) => item.id === aspect)?.ratio ?? 1;
    const scale = viewport && size.width ? (viewport / Math.max(size.width, size.height)) * zoom : 1;
    const dispW = size.width * scale;
    const dispH = size.height * scale;
    const avail = Math.max(40, viewport - FRAME_MARGIN * 2);

    let frameW = avail;
    let frameH = avail / ratio;
    if (frameH > avail) {
      frameH = avail;
      frameW = avail * ratio;
    }
    // El marco nunca es más grande que la foto: lo que se recorta siempre
    // existe en la imagen (nada de rellenos vacíos).
    if (frameW > dispW) {
      frameW = dispW;
      frameH = frameW / ratio;
    }
    if (frameH > dispH) {
      frameH = dispH;
      frameW = frameH * ratio;
    }

    return {
      scale,
      dispW,
      dispH,
      frameW,
      frameH,
      frameX: (viewport - frameW) / 2,
      frameY: (viewport - frameH) / 2,
      maxX: Math.max(0, (dispW - frameW) / 2),
      maxY: Math.max(0, (dispH - frameH) / 2),
    };
  }, [aspect, size, viewport, zoom]);

  // Mantén el encuadre dentro de la foto al cambiar zoom o proporción.
  useEffect(() => {
    setOffset((prev) => {
      const x = clamp(prev.x, -geometry.maxX, geometry.maxX);
      const y = clamp(prev.y, -geometry.maxY, geometry.maxY);
      return x === prev.x && y === prev.y ? prev : { x, y };
    });
  }, [geometry.maxX, geometry.maxY]);

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    setSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  const startDrag = (event: React.PointerEvent<HTMLImageElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
  };

  const moveDrag = (event: React.PointerEvent<HTMLImageElement>) => {
    if (!dragRef.current) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    setOffset({
      x: clamp(dragRef.current.ox + dx, -geometry.maxX, geometry.maxX),
      y: clamp(dragRef.current.oy + dy, -geometry.maxY, geometry.maxY),
    });
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const handleCrop = async () => {
    if (!size.width || !geometry.scale) return;
    setBusy('crop');
    setError(null);
    try {
      const img = await loadImage(workSrc);
      const sourceX = (geometry.frameX - (viewport - geometry.dispW) / 2 - offset.x) / geometry.scale;
      const sourceY = (geometry.frameY - (viewport - geometry.dispH) / 2 - offset.y) / geometry.scale;
      const sourceW = geometry.frameW / geometry.scale;
      const sourceH = geometry.frameH / geometry.scale;

      const safeX = clamp(sourceX, 0, Math.max(0, img.width - sourceW));
      const safeY = clamp(sourceY, 0, Math.max(0, img.height - sourceH));
      const safeW = Math.min(sourceW, img.width);
      const safeH = Math.min(sourceH, img.height);

      const scale = Math.min(1, MAX_OUTPUT / Math.max(safeW, safeH));
      const [canvas, ctx] = makeCanvas(safeW * scale, safeH * scale);
      ctx.drawImage(img, safeX, safeY, safeW, safeH, 0, 0, canvas.width, canvas.height);
      pushHistory(canvasToDataUrl(canvas, ctx));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo recortar la imagen');
    } finally {
      setBusy(null);
    }
  };

  const handleRemoveBackground = async () => {
    setBusy('background');
    setError(null);
    try {
      const result = await removeBackgroundFrom(workSrc, tolerance);
      pushHistory(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo quitar el fondo');
    } finally {
      setBusy(null);
    }
  };

  const handleTransform = async (kind: 'rotate' | 'flip') => {
    setBusy('transform');
    setError(null);
    try {
      const img = await loadImage(workSrc);
      const scale = Math.min(1, MAX_WORK / Math.max(img.width, img.height));
      const width = Math.round(img.width * scale);
      const height = Math.round(img.height * scale);

      const [canvas, ctx] = makeCanvas(
        kind === 'rotate' ? height : width,
        kind === 'rotate' ? width : height
      );

      ctx.translate(canvas.width / 2, canvas.height / 2);
      if (kind === 'rotate') ctx.rotate(Math.PI / 2);
      else ctx.scale(-1, 1);
      ctx.drawImage(img, -width / 2, -height / 2, width, height);

      pushHistory(canvasToDataUrl(canvas, ctx));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo transformar la imagen');
    } finally {
      setBusy(null);
    }
  };

  const handleUndo = () => {
    if (!history.length) return;
    setWorkSrc(history[history.length - 1]);
    setHistory(history.slice(0, -1));
    setOffset({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleReset = () => {
    setWorkSrc(src);
    setHistory([]);
    setOffset({ x: 0, y: 0 });
    setZoom(1);
    setBrightness(100);
    setContrast(100);
    setTolerance(22);
    setError(null);
  };

  const handleApply = async () => {
    setBusy('save');
    setError(null);
    try {
      const img = await loadImage(workSrc);
      const scale = Math.min(1, MAX_OUTPUT / Math.max(img.width, img.height));
      const [canvas, ctx] = makeCanvas(img.width * scale, img.height * scale);
      // `filter` del canvas aplica el ajuste de luz y contraste de una vez.
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      onApply(canvasToDataUrl(canvas, ctx));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo aplicar la edición');
      setBusy(null);
    }
  };

  const busyLabel =
    busy === 'crop'
      ? 'Recortando…'
      : busy === 'background'
        ? 'Quitando fondo…'
        : busy === 'transform'
          ? 'Transformando…'
          : busy === 'save'
            ? 'Aplicando…'
            : '';

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-primary-ink/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="relative glass-strong rounded-3xl p-4 sm:p-6 w-full max-w-3xl max-h-[92dvh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="heading-eyebrow">Ajustar imagen</p>
            <h3 className="font-display text-lg sm:text-xl font-bold text-dark truncate">
              {productName || 'Foto del producto'}
            </h3>
          </div>
          <button onClick={onClose} className="tap-icon text-gray-400 hover:text-dark transition flex-shrink-0" aria-label="Cerrar editor">
            <X size={22} />
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,300px)] md:items-start">
          {/* Visor cuadrado con el marco de recorte */}
          <div className="min-w-0">
            <div
              ref={viewportRef}
              className="relative w-full aspect-square max-w-[420px] mx-auto rounded-2xl overflow-hidden border border-white/70 select-none"
              style={{
                backgroundColor: '#e7e2da',
                backgroundImage:
                  'linear-gradient(45deg, rgba(0,0,0,0.07) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.07) 75%), linear-gradient(45deg, rgba(0,0,0,0.07) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.07) 75%)',
                backgroundSize: '22px 22px',
                backgroundPosition: '0 0, 11px 11px',
              }}
            >
              {workSrc && viewport > 0 && (
                <img
                  src={workSrc}
                  alt="Vista previa editable"
                  draggable={false}
                  onLoad={handleImageLoad}
                  onPointerDown={startDrag}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  className="absolute max-w-none cursor-grab active:cursor-grabbing"
                  style={{
                    width: geometry.dispW,
                    height: geometry.dispH,
                    left: `calc(50% + ${offset.x}px)`,
                    top: `calc(50% + ${offset.y}px)`,
                    transform: 'translate(-50%, -50%)',
                    filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                    touchAction: 'none',
                  }}
                />
              )}

              {/* Marco de recorte: fuera de él todo se oscurece */}
              {viewport > 0 && (
                <div
                  aria-hidden
                  className="absolute pointer-events-none rounded-[0.35rem] border-2 border-white/95"
                  style={{
                    left: geometry.frameX,
                    top: geometry.frameY,
                    width: geometry.frameW,
                    height: geometry.frameH,
                    boxShadow: '0 0 0 9999px rgba(8, 10, 12, 0.46)',
                  }}
                >
                  <span className="absolute left-1/3 top-0 bottom-0 w-px bg-white/35" />
                  <span className="absolute left-2/3 top-0 bottom-0 w-px bg-white/35" />
                  <span className="absolute top-1/3 left-0 right-0 h-px bg-white/35" />
                  <span className="absolute top-2/3 left-0 right-0 h-px bg-white/35" />
                </div>
              )}

              {!size.width && (
                <div className="absolute inset-0 grid place-items-center text-gray-500 text-sm">
                  Cargando imagen…
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
              <Move size={13} aria-hidden />
              Arrastra la foto para encuadrarla · aleja o acerca con el zoom
            </div>

            <div className="mt-3 flex items-center gap-3">
              <span className="text-xs font-bold text-dark whitespace-nowrap">Zoom</span>
              <input
                type="range"
                min={1}
                max={4}
                step={0.05}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="flex-1 accent-[var(--c-primary)]"
                aria-label="Zoom del recorte"
              />
              <span className="text-xs text-gray-500 w-10 text-right">{zoom.toFixed(1)}×</span>
            </div>
          </div>

          {/* Controles */}
          <div className="space-y-3 min-w-0">
            <div>
              <p className="text-xs font-bold text-dark mb-1.5">Proporción del recorte</p>
              <LiquidTabs
                items={ASPECTS.map((item) => ({ id: item.id, label: item.label }))}
                activeId={aspect}
                onChange={(id) => setAspect(id as AspectId)}
                size="sm"
              />
            </div>

            <button
              type="button"
              onClick={() => void handleCrop()}
              disabled={busy !== null || !size.width}
              className="btn-liquid w-full py-2.5 inline-flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {busy === 'crop' ? <Loader2 size={15} className="animate-spin" /> : <Crop size={15} />}
              Recortar
            </button>

            <div className="liquid-badge rounded-2xl p-3">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-xs font-bold text-dark flex items-center gap-1.5">
                  <Eraser size={14} /> Quitar fondo
                </p>
                <span className="text-[11px] text-gray-500">{tolerance}%</span>
              </div>
              <input
                type="range"
                min={4}
                max={60}
                step={1}
                value={tolerance}
                onChange={(event) => setTolerance(Number(event.target.value))}
                className="w-full accent-[var(--c-primary)]"
                aria-label="Sensibilidad para quitar el fondo"
              />
              <p className="text-[10px] text-gray-500 leading-snug mb-2">
                Sube la sensibilidad si el fondo tiene sombras; bájala si borra parte del producto.
              </p>
              <button
                type="button"
                onClick={() => void handleRemoveBackground()}
                disabled={busy !== null}
                className="btn-liquid-ghost w-full py-2 text-sm inline-flex items-center justify-center gap-2 text-dark disabled:opacity-60"
              >
                {busy === 'background' ? <Loader2 size={15} className="animate-spin" /> : <Eraser size={15} />}
                Eliminar fondo
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void handleTransform('rotate')}
                disabled={busy !== null}
                className="btn-liquid-ghost py-2.5 text-sm inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <RotateCw size={15} /> Girar
              </button>
              <button
                type="button"
                onClick={() => void handleTransform('flip')}
                disabled={busy !== null}
                className="btn-liquid-ghost py-2.5 text-sm inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <FlipHorizontal2 size={15} /> Espejo
              </button>
            </div>

            <div className="liquid-badge rounded-2xl p-3 space-y-2.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-dark flex items-center gap-1.5">
                    <Sun size={13} /> Brillo
                  </span>
                  <span className="text-[11px] text-gray-500">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={150}
                  value={brightness}
                  onChange={(event) => setBrightness(Number(event.target.value))}
                  className="w-full accent-[var(--c-primary)]"
                  aria-label="Brillo"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-dark flex items-center gap-1.5">
                    <Contrast size={13} /> Contraste
                  </span>
                  <span className="text-[11px] text-gray-500">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={150}
                  value={contrast}
                  onChange={(event) => setContrast(Number(event.target.value))}
                  className="w-full accent-[var(--c-primary)]"
                  aria-label="Contraste"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!history.length || busy !== null}
                className="btn-liquid-ghost py-2.5 text-sm inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Undo2 size={15} /> Deshacer
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={busy !== null}
                className="btn-liquid-ghost py-2.5 text-sm inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <RotateCcw size={15} /> Original
              </button>
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger text-danger px-3 py-2.5 rounded-2xl flex items-start gap-2 text-xs">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {busyLabel && (
              <p className="text-[11px] text-gray-500 text-center flex items-center justify-center gap-1.5">
                <Loader2 size={13} className="animate-spin" /> {busyLabel}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col min-[400px]:flex-row gap-2.5">
          <button
            type="button"
            onClick={() => void handleApply()}
            disabled={busy !== null || !size.width}
            className="btn-liquid flex-1 py-3 inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy === 'save' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            Usar esta imagen
          </button>
          <button type="button" onClick={onClose} className="btn-liquid-ghost px-6 py-3 text-dark">
            Cancelar
          </button>
        </div>
      </motion.div>
    </div>
  );
};
