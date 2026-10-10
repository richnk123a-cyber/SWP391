import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Check, X, Move, Palette } from 'lucide-react';

// ─── Shape configs ────────────────────────────────────────────────────────────
const SHAPES = [
  {
    id: 'square',
    label: 'Vuông',
    icon: '▪',
    hint: '1:1 – Phổ biến nhất',
    cropW: 264,
    cropH: 264,
    outW: 300,
    outH: 300,
  },
  {
    id: 'circle',
    label: 'Tròn',
    icon: '●',
    hint: '1:1 – Logo circular',
    cropW: 264,
    cropH: 264,
    outW: 300,
    outH: 300,
  },
  {
    id: 'rect',
    label: 'Ngang',
    icon: '▬',
    hint: '2:1 – Wordmark / Banner',
    cropW: 360,
    cropH: 180,
    outW: 440,
    outH: 220,
  },
];

const PRESET_COLORS = [
  { label: 'Trắng', value: '#ffffff' },
  { label: 'Trong suốt', value: 'transparent' },
  { label: 'Đen', value: '#0f172a' },
  { label: 'Xám nhạt', value: '#f1f5f9' },
  { label: 'Xanh dương', value: '#2563eb' },
  { label: 'Xanh đậm', value: '#1e3a8a' },
  { label: 'Xanh lá', value: '#059669' },
  { label: 'Đỏ', value: '#dc2626' },
  { label: 'Vàng cam', value: '#ea580c' },
  { label: 'Tím', value: '#7c3aed' },
];

const CANVAS_W = 480;
const CANVAS_H = 360;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function computeBaseScale(img, cropW, cropH) {
  return Math.max(cropW / img.naturalWidth, cropH / img.naturalHeight);
}

function computeMaxOffset(imgW, imgH, cropW, cropH) {
  return {
    x: Math.max(cropW / 2, Math.abs(imgW - cropW) / 2 + cropW * 0.4),
    y: Math.max(cropH / 2, Math.abs(imgH - cropH) / 2 + cropH * 0.4),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────
export function LogoCropperModal({ file, onApply, onCancel }) {
  const canvasRef = useRef(null);
  const imgRef    = useRef(null);
  const bsRef     = useRef(1); // baseScale
  const dragRef   = useRef(null);

  const [shapeId,       setShapeId]       = useState('square');
  const [bgColor,       setBgColor]       = useState('#ffffff');
  const [zoom,          setZoom]          = useState(1);
  const [offset,        setOffset]        = useState({ x: 0, y: 0 });
  const [dragging,      setDragging]      = useState(false);
  const [ready,         setReady]         = useState(false);
  const [removeWhiteBg, setRemoveWhiteBg] = useState(false);
  const filteredImgRef = useRef(null);

  const shape = SHAPES.find(s => s.id === shapeId);

  // ── Load image ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!file) return;
    let isCancelled = false;

    // Use FileReader instead of URL.createObjectURL to avoid premature revocation in StrictMode
    const reader = new FileReader();
    reader.onload = () => {
      if (isCancelled) return;
      const img = new Image();
      img.onload = () => {
        if (isCancelled) return;
        imgRef.current = img;
        bsRef.current  = computeBaseScale(img, shape.cropW, shape.cropH);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        setReady(true);
      };
      img.onerror = (err) => {
        console.error('Lỗi khi tải đối tượng ảnh trong Cropper:', err);
      };
      img.src = reader.result;
    };
    reader.onerror = (err) => {
      console.error('Lỗi khi đọc file logo:', err);
    };
    reader.readAsDataURL(file);

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  // ── Auto filter white background if requested ────────────────────────────────
  useEffect(() => {
    if (!imgRef.current) return;
    if (!removeWhiteBg) {
      filteredImgRef.current = null;
      return;
    }
    const img = imgRef.current;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.naturalWidth;
    tempCanvas.height = img.naturalHeight;
    const tCtx = tempCanvas.getContext('2d');
    tCtx.drawImage(img, 0, 0);

    try {
      const imgData = tCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];
        if (r > 230 && g > 230 && b > 230) {
          const brightness = (r + g + b) / 3;
          if (brightness > 245) {
            d[i + 3] = 0;
          } else {
            d[i + 3] = Math.round(((245 - brightness) / 15) * 255);
          }
        }
      }
      tCtx.putImageData(imgData, 0, 0);
      filteredImgRef.current = tempCanvas;
    } catch (e) {
      console.warn('Canvas filter failed:', e);
      filteredImgRef.current = null;
    }
  }, [removeWhiteBg, ready]);

  // ── Recompute base scale when shape changes ─────────────────────────────────
  useEffect(() => {
    if (!imgRef.current) return;
    bsRef.current = computeBaseScale(imgRef.current, shape.cropW, shape.cropH);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [shapeId, shape.cropW, shape.cropH]);

  // ── Draw canvas ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const img    = imgRef.current;
    const sourceDrawable = (removeWhiteBg && filteredImgRef.current) ? filteredImgRef.current : img;
    const { cropW, cropH, id } = shape;

    const drawScale = bsRef.current * zoom;
    const imgW = img.naturalWidth  * drawScale;
    const imgH = img.naturalHeight * drawScale;
    const imgX = CANVAS_W / 2 + offset.x - imgW / 2;
    const imgY = CANVAS_H / 2 + offset.y - imgH / 2;
    const cropX = (CANVAS_W - cropW) / 2;
    const cropY = (CANVAS_H - cropH) / 2;

    // 1. Clear
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // 2. Fill crop background if not transparent
    if (bgColor !== 'transparent') {
      ctx.save();
      ctx.fillStyle = bgColor;
      if (id === 'circle') {
        ctx.beginPath();
        ctx.ellipse(CANVAS_W / 2, CANVAS_H / 2, cropW / 2, cropH / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(cropX, cropY, cropW, cropH);
      }
      ctx.restore();
    }

    // 3. Draw image clipped to crop area
    ctx.save();
    if (id === 'circle') {
      ctx.beginPath();
      ctx.ellipse(CANVAS_W / 2, CANVAS_H / 2, cropW / 2, cropH / 2, 0, 0, Math.PI * 2);
      ctx.clip();
    } else {
      ctx.beginPath();
      ctx.rect(cropX, cropY, cropW, cropH);
      ctx.clip();
    }
    ctx.drawImage(sourceDrawable, imgX, imgY, imgW, imgH);
    ctx.restore();

    // 4. Dark overlay outside crop
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.58)';
    if (id === 'circle') {
      ctx.beginPath();
      ctx.rect(0, 0, CANVAS_W, CANVAS_H);
      ctx.ellipse(CANVAS_W / 2, CANVAS_H / 2, cropW / 2, cropH / 2, 0, 0, Math.PI * 2, true);
      ctx.fill('evenodd');
    } else {
      ctx.fillRect(0,                0,                     CANVAS_W,            cropY);
      ctx.fillRect(0,                cropY + cropH,         CANVAS_W,            CANVAS_H - cropY - cropH);
      ctx.fillRect(0,                cropY,                 cropX,               cropH);
      ctx.fillRect(cropX + cropW,    cropY,                 CANVAS_W - cropX - cropW, cropH);
    }
    ctx.restore();

    // 5. Grid / rule-of-thirds inside crop
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth   = 0.8;
    if (id === 'circle') {
      ctx.beginPath();
      ctx.ellipse(CANVAS_W / 2, CANVAS_H / 2, cropW / 2, cropH / 2, 0, 0, Math.PI * 2);
      ctx.clip();
    } else {
      ctx.rect(cropX, cropY, cropW, cropH);
      ctx.clip();
    }
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(cropX + cropW * i / 3, cropY);
      ctx.lineTo(cropX + cropW * i / 3, cropY + cropH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cropX, cropY + cropH * i / 3);
      ctx.lineTo(cropX + cropW, cropY + cropH * i / 3);
      ctx.stroke();
    }
    ctx.restore();

    // 6. Crop border
    ctx.save();
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth   = 2;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur  = 4;
    if (id === 'circle') {
      ctx.beginPath();
      ctx.ellipse(CANVAS_W / 2, CANVAS_H / 2, cropW / 2, cropH / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(cropX, cropY, cropW, cropH);
      // Corner handles
      const hs = 14;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth   = 3;
      ctx.shadowBlur  = 2;
      const corners = [
        [cropX,        cropY],
        [cropX + cropW, cropY],
        [cropX,        cropY + cropH],
        [cropX + cropW, cropY + cropH],
      ];
      const dirs = [
        [1, 1], [-1, 1], [1, -1], [-1, -1],
      ];
      corners.forEach(([cx, cy], i) => {
        const [dx, dy] = dirs[i];
        ctx.beginPath();
        ctx.moveTo(cx + dx * hs, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + dy * hs);
        ctx.stroke();
      });
    }
    ctx.restore();
  }, [ready, zoom, offset, shape, shapeId, bgColor, removeWhiteBg]);

  // ── Get canvas-space coords from mouse event ─────────────────────────────────
  const getCvCoords = (clientX, clientY) => {
    const canvas = canvasRef.current;
    const rect   = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top)  * (canvas.height / rect.height),
    };
  };

  // ── Clamp offset so image always covers crop box ─────────────────────────────
  const clampedOffset = useCallback((ox, oy, z) => {
    if (!imgRef.current) return { x: ox, y: oy };
    const img  = imgRef.current;
    const ds   = bsRef.current * z;
    const imgW = img.naturalWidth  * ds;
    const imgH = img.naturalHeight * ds;
    const max  = computeMaxOffset(imgW, imgH, shape.cropW, shape.cropH);
    return { x: clamp(ox, -max.x, max.x), y: clamp(oy, -max.y, max.y) };
  }, [shape.cropW, shape.cropH]);

  // ── Mouse / Touch drag ───────────────────────────────────────────────────────
  const onPointerDown = (e) => {
    e.preventDefault();
    const { x, y } = getCvCoords(e.clientX, e.clientY);
    dragRef.current = { startX: x, startY: y, ox: offset.x, oy: offset.y };
    setDragging(true);
  };

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current) return;
    const { x, y } = getCvCoords(e.clientX, e.clientY);
    const newX = dragRef.current.ox + (x - dragRef.current.startX);
    const newY = dragRef.current.oy + (y - dragRef.current.startY);
    setOffset(clampedOffset(newX, newY, zoom));
  }, [zoom, clampedOffset]);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
  }, []);

  // Touch equivalents
  const onTouchStart = (e) => {
    const t = e.touches[0];
    const { x, y } = getCvCoords(t.clientX, t.clientY);
    dragRef.current = { startX: x, startY: y, ox: offset.x, oy: offset.y };
    setDragging(true);
  };

  const onTouchMove = useCallback((e) => {
    e.preventDefault();
    if (!dragRef.current) return;
    const t = e.touches[0];
    const { x, y } = getCvCoords(t.clientX, t.clientY);
    const newX = dragRef.current.ox + (x - dragRef.current.startX);
    const newY = dragRef.current.oy + (y - dragRef.current.startY);
    setOffset(clampedOffset(newX, newY, zoom));
  }, [zoom, clampedOffset]);

  const onTouchEnd = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
  }, []);

  // ── Scroll wheel zoom ────────────────────────────────────────────────────────
  const onWheel = useCallback((e) => {
    e.preventDefault();
    setZoom(prev => {
      const next = clamp(prev * (1 - e.deltaY * 0.0012), MIN_ZOOM, MAX_ZOOM);
      setOffset(o => clampedOffset(o.x, o.y, next));
      return next;
    });
  }, [clampedOffset]);

  // ── Zoom control ─────────────────────────────────────────────────────────────
  const adjustZoom = (delta) => {
    setZoom(prev => {
      const next = clamp(prev + delta, MIN_ZOOM, MAX_ZOOM);
      setOffset(o => clampedOffset(o.x, o.y, next));
      return next;
    });
  };

  const handleZoomSlider = (e) => {
    const next = Number(e.target.value) / 100;
    setZoom(next);
    setOffset(o => clampedOffset(o.x, o.y, next));
  };

  // ── Reset & Fit modes ────────────────────────────────────────────────────────
  const handleReset = () => {
    if (!imgRef.current) return;
    bsRef.current = computeBaseScale(imgRef.current, shape.cropW, shape.cropH);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleFitContain = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const fitScale = Math.min(shape.cropW / img.naturalWidth, shape.cropH / img.naturalHeight) * 0.88;
    const newZoom = clamp(fitScale / bsRef.current, MIN_ZOOM, MAX_ZOOM);
    setZoom(newZoom);
    setOffset({ x: 0, y: 0 });
  };

  const handleFitCover = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const coverScale = Math.max(shape.cropW / img.naturalWidth, shape.cropH / img.naturalHeight);
    const newZoom = clamp(coverScale / bsRef.current, MIN_ZOOM, MAX_ZOOM);
    setZoom(newZoom);
    setOffset({ x: 0, y: 0 });
  };

  // ── Apply: render to offscreen canvas ────────────────────────────────────────
  const handleApply = () => {
    if (!imgRef.current) return;
    const img  = imgRef.current;
    const sourceDrawable = (removeWhiteBg && filteredImgRef.current) ? filteredImgRef.current : img;
    const { cropW, cropH, outW, outH, id } = shape;

    const drawScale = bsRef.current * zoom;
    const imgW = img.naturalWidth  * drawScale;
    const imgH = img.naturalHeight * drawScale;

    // Direct mapping to output canvas coordinates
    const scaleRatio = outW / cropW;
    const finalImgW = imgW * scaleRatio;
    const finalImgH = imgH * scaleRatio;
    const finalImgX = (outW - finalImgW) / 2 + (offset.x * scaleRatio);
    const finalImgY = (outH - finalImgH) / 2 + (offset.y * scaleRatio);

    const off = document.createElement('canvas');
    off.width  = outW;
    off.height = outH;
    const ctx  = off.getContext('2d');

    // 1. Fill background color if selected
    if (bgColor !== 'transparent') {
      ctx.save();
      ctx.fillStyle = bgColor;
      if (id === 'circle') {
        ctx.beginPath();
        ctx.ellipse(outW / 2, outH / 2, outW / 2, outH / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(0, 0, outW, outH);
      }
      ctx.restore();
    }

    // 2. Clip to shape
    ctx.save();
    if (id === 'circle') {
      ctx.beginPath();
      ctx.ellipse(outW / 2, outH / 2, outW / 2, outH / 2, 0, 0, Math.PI * 2);
      ctx.clip();
    } else {
      ctx.beginPath();
      ctx.rect(0, 0, outW, outH);
      ctx.clip();
    }

    // 3. Draw image cleanly with destination coordinates
    ctx.drawImage(sourceDrawable, finalImgX, finalImgY, finalImgW, finalImgH);
    ctx.restore();

    onApply(off.toDataURL('image/png'));
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onMouseMove={dragging ? onPointerMove : undefined}
      onMouseUp={dragging ? onPointerUp : undefined}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Chỉnh sửa Logo</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Kéo ảnh · Cuộn để zoom · Chọn kiểu khung</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Canvas area ── */}
        <div className="bg-[#1a1f2e] flex items-center justify-center overflow-hidden shrink-0"
          style={{ height: 320 }}>
          {ready ? (
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              style={{
                cursor: dragging ? 'grabbing' : 'grab',
                maxWidth: '100%',
                maxHeight: '100%',
                display: 'block',
                touchAction: 'none',
              }}
              onMouseDown={onPointerDown}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onWheel={onWheel}
            />
          ) : (
            <div className="text-slate-400 text-sm animate-pulse">Đang tải ảnh…</div>
          )}
        </div>

        {/* ── Controls ── */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto">

          {/* Shape selector */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Kiểu khung cắt</p>
            <div className="grid grid-cols-3 gap-2">
              {SHAPES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setShapeId(s.id)}
                  className={`py-2.5 px-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                    shapeId === s.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className={`text-base leading-none ${
                    s.id === 'rect' ? 'text-[20px]' : 'text-[18px]'
                  } ${shapeId === s.id ? 'text-blue-600' : 'text-slate-400'}`}>
                    {s.icon}
                  </span>
                  <span className="text-[11px] font-bold">{s.label}</span>
                  <span className="text-[9px] text-slate-400 font-normal">{s.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Background Color Palette */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Palette size={12} className="text-blue-600" /> Màu nền logo
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-slate-600 font-bold uppercase">
                  {bgColor === 'transparent' ? 'Trong suốt' : bgColor}
                </span>
                <label className="relative cursor-pointer flex items-center" title="Chọn màu bất kỳ từ bảng màu">
                  <span
                    className="w-5 h-5 rounded-full border border-slate-300 shadow-xs inline-block"
                    style={{ background: bgColor === 'transparent' ? '#ffffff' : bgColor }}
                  />
                  <input
                    type="color"
                    value={bgColor === 'transparent' ? '#ffffff' : bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map(c => {
                const isSelected = bgColor.toLowerCase() === c.value.toLowerCase();
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setBgColor(c.value)}
                    title={c.label}
                    className={`relative w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-blue-600 ring-2 ring-blue-400/40 shadow-xs scale-105' : 'border-slate-300'
                    }`}
                    style={{
                      background: c.value === 'transparent'
                        ? 'repeating-conic-gradient(#cbd5e1 0% 25%, #ffffff 0% 50%) 50% / 8px 8px'
                        : c.value
                    }}
                  >
                    {isSelected && (
                      <Check
                        size={12}
                        className={c.value === '#ffffff' || c.value === '#f1f5f9' || c.value === 'transparent' ? 'text-slate-800' : 'text-white'}
                        strokeWidth={3}
                      />
                    )}
                  </button>
                );
              })}

              {/* Custom Color Button */}
              <label
                className={`relative w-7 h-7 rounded-lg border-2 border-dashed border-slate-400 hover:border-blue-500 cursor-pointer flex items-center justify-center transition-transform hover:scale-110 bg-slate-50 ${
                  !PRESET_COLORS.some(p => p.value.toLowerCase() === bgColor.toLowerCase()) ? 'border-blue-600 ring-2 ring-blue-400/40' : ''
                }`}
                title="Bảng màu tùy chỉnh (Custom Color Picker)"
              >
                <Palette size={13} className="text-slate-600" />
                <input
                  type="color"
                  value={bgColor === 'transparent' ? '#ffffff' : bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="sr-only"
                />
              </label>
            </div>

            {/* Remove original white background toggle */}
            <div className="mt-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200">
              <label className="flex items-start gap-2.5 cursor-pointer text-left">
                <input
                  type="checkbox"
                  checked={removeWhiteBg}
                  onChange={(e) => setRemoveWhiteBg(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-4 h-4 shrink-0"
                />
                <div>
                  <span className="text-[11px] font-bold text-slate-800 block">
                    Tách nền trắng của ảnh gốc
                  </span>
                  <p className="text-[10px] text-slate-500 leading-snug mt-0.5">
                    Tự động làm trong suốt nền trắng trên ảnh tải lên để phủ màu nền đã chọn ({bgColor === 'transparent' ? 'Trong suốt' : bgColor}).
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Zoom & Framing controls */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Căn chỉnh & Phóng to</p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleFitContain}
                  className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-600 transition-colors border border-slate-200"
                  title="Thu nhỏ để logo lọt lòng và lộ đều màu nền xung quanh"
                >
                  📐 Vừa khung
                </button>
                <button
                  type="button"
                  onClick={handleFitCover}
                  className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-600 transition-colors border border-slate-200"
                  title="Phóng to lấp đầy toàn bộ khung ảnh"
                >
                  🔍 Lấp đầy
                </button>
                <span className="text-[11px] font-mono font-bold text-slate-500 ml-1">{Math.round(zoom * 100)}%</span>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => adjustZoom(-0.1)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0"
              >
                <ZoomOut size={14} className="text-slate-600" />
              </button>
              <input
                type="range"
                min={Math.round(MIN_ZOOM * 100)}
                max={Math.round(MAX_ZOOM * 100)}
                step={5}
                value={Math.round(zoom * 100)}
                onChange={handleZoomSlider}
                className="flex-1 accent-blue-600 h-1.5 rounded-full"
              />
              <button
                onClick={() => adjustZoom(0.1)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shrink-0"
              >
                <ZoomIn size={14} className="text-slate-600" />
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Move size={10} /> Kéo ảnh để căn chỉnh vị trí
            </span>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-blue-500 hover:text-blue-700 font-semibold transition-colors"
            >
              <RotateCcw size={10} /> Đặt lại
            </button>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex gap-2.5 px-5 py-3.5 border-t border-slate-100 shrink-0">
          <button
            onClick={onCancel}
            className="flex-1 btn btn-secondary text-xs font-bold py-2.5"
          >
            Hủy
          </button>
          <button
            onClick={handleApply}
            disabled={!ready}
            className="flex-1 btn btn-primary text-xs font-bold py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Check size={15} /> Áp dụng logo
          </button>
        </div>
      </div>
    </div>
  );
}
