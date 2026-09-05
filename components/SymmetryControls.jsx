'use client'

import { useState, useRef, useEffect, useCallback } from 'react';
import { SYMMETRY_OPERATIONS } from '@/lib/symmetryOperations';

// Renders labels like "4̄" or "2̄//Oz" with the overbar drawn as a precise CSS
// border instead of relying on the Unicode combining-macron character: fonts
// have no mark-attachment data for macron-over-digit (that's tuned for
// letters), so the browser places it inconsistently — often not centered —
// depending on font/OS. Drawing it ourselves keeps it exactly centered above
// just the digit everywhere.
function OverbarLabel({ text }) {
  const m = text.match(/^(\d)[\u0300-\u036f]?(.*)$/);
  if (!m) return <>{text}</>;
  const [, digit, rest] = m;
  return (
    <span style={{ whiteSpace: 'nowrap' }}>
      <span style={{ position: 'relative', display: 'inline-block' }}>
        {digit}
        <span style={{ position: 'absolute', top: '-0.2em', left: 0, right: 0, borderTop: '1.4px solid currentColor' }} />
      </span>
      {rest}
    </span>
  );
}

export default function SymmetryControls({
  t,
  startPoint,
  onStartPoint,
  selectedOperation,
  onOperationSelect,
  selectedAxis,
  onAxisSelect,
  axisAutoSynced,
  onApplyOperation,
  onReset,
  onUndo,
  onBack,
  operationsLog,
  stepMode,
  onStepModeToggle,
  stepFreshEntry,
  currentStep,
  onCurrentStep,
  // Application Mode props
  currentBasePoint,
  onBasePointChange,
  savedAtoms,
  onSavedAtomsChange,
  previewAtom,
  onPreviewAtomChange,
  selectedAngle,
  onAngleChange,
  angleMode,
  onAngleModeChange,
  onApplyRotation,
  onApplyInversion,
  onSavePosition,
  onDiscardPreview,
  showConfirmBar,
  onShowConfirmBar,
  animationSpeed,
  onAnimationSpeedChange,
  projectionZoom,
  onProjectionZoomChange,
}) {
  // ── Operation Buttons ──────────────────────────────────────────────────────
  const properOps = ['1', '2//Oz', '2//Oy', '3', '4', '6'];
  const improperOps = ['1̄', '2̄//Oz', '2̄//Oy', '3̄', '4̄', '6̄'];
  // Right after entering Step-by-Step, no operation has actually been chosen
  // yet (only the default point is shown), so suppress the "1" highlight
  // that would otherwise make it look already clicked.
  const suppressOpHighlight = stepMode && stepFreshEntry;

  return (
    <div id="ctrl-symmetry" className="controls active">
      <span className="ctrl-label">{t('labelSymmetry')}</span>

      {/* Operation Selector */}
      <span className="ctrl-label">{t('labelSelectOperation')}</span>

      {/* Proper Rotations */}
      <div style={{marginBottom:8}}>
        <div style={{fontSize:'11px', fontWeight:500, color:'var(--text)', marginBottom:4}}>{t('symProper')}</div>
        <div className="mode-toggle" style={{flexWrap:'wrap', gap:4}}>
          {properOps.map(op => (
            <button
              key={op}
              className={`mode-btn${selectedOperation===op && !suppressOpHighlight?' active':''}`}
              onClick={() => onOperationSelect(op)}
              style={{fontSize:'11px', padding:'4px 2px', flex:'1 1 30%', whiteSpace:'nowrap'}}
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      {/* Improper Rotations */}
      <div style={{marginBottom:8}}>
        <div style={{fontSize:'11px', fontWeight:500, color:'var(--text)', marginBottom:4}}>{t('symImproper')}</div>
        <div className="mode-toggle" style={{flexWrap:'wrap', gap:4}}>
          {improperOps.map(op => (
            <button
              key={op}
              className={`mode-btn${selectedOperation===op && !suppressOpHighlight?' active':''}`}
              onClick={() => onOperationSelect(op)}
              style={{fontSize:'11px', padding:'4px 2px', flex:'1 1 30%'}}
            >
              <OverbarLabel text={op} />
            </button>
          ))}
        </div>
      </div>

      {/* Step-by-Step toggle: off by default (operations apply immediately
          on selection below); switching this on resets to the default
          starting position and reveals the step-building controls. */}
      <div style={{marginBottom:8}}>
        <span className="ctrl-label">{t('labelApplicationMode')}</span>
        <div className="mode-toggle">
          <button className={`mode-btn${stepMode?' active':''}`} onClick={onStepModeToggle}>{t('modeStepByStep')}</button>
        </div>
        {stepMode && (
          <div style={{marginTop:4, fontSize:'11px', color:'var(--dim)'}}>
            {t('logStepLabel', { n: currentStep })}: {currentStep === 1 ? t('stepApplyOperation') : t('stepShowResult')}
          </div>
        )}
      </div>

      {/* Rotation axis picker — only in Step-by-Step mode, applies to whichever operation is selected */}
      {stepMode && (
        <div style={{marginBottom:8}}>
          <span className="ctrl-label">{t('labelRotationAxis')}</span>
          <div className="mode-toggle">
            {['a','b','c'].map(ax => (
              <button
                key={ax}
                className={`mode-btn${selectedAxis===ax && !axisAutoSynced?' active':''}`}
                onClick={() => onAxisSelect(ax)}
              >
                {{ a: 'x', b: 'y', c: 'z' }[ax]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Visual separator */}
      {/* Everything below is only relevant while building up a rotation
          step by step — selecting an operation above already shows its
          full result immediately, so no parameters are needed otherwise. */}
      {stepMode && (
        <>
          <hr style={{border:'none', borderTop:'1px solid var(--border)', margin:'12px 0'}} />

          {/* Animation Speed Control */}
          <div style={{marginBottom:8}}>
            <span className="ctrl-label">{t('labelAnimSpeed')}</span>
            <div className="mode-toggle">
              <button className={`mode-btn${animationSpeed === 'slow' ? ' active' : ''}`} onClick={() => onAnimationSpeedChange('slow')}>{t('speedSlow')}</button>
              <button className={`mode-btn${animationSpeed === 'normal' ? ' active' : ''}`} onClick={() => onAnimationSpeedChange('normal')}>{t('speedNormal')}</button>
              <button className={`mode-btn${animationSpeed === 'fast' ? ' active' : ''}`} onClick={() => onAnimationSpeedChange('fast')}>{t('speedFast')}</button>
            </div>
          </div>

          {/* Angle Selector UI */}
          <div style={{marginBottom:8, padding:'8px', border:'1px solid var(--border)', borderRadius:'4px', background:'var(--panel-bg)'}}>
            <div style={{fontSize:'11px', fontWeight:500, color:'var(--text)', marginBottom:6}}>{t('labelAngle')}</div>

            {angleMode === 'preset' ? (
              <>
                <div className="mode-toggle" style={{flexWrap:'wrap', gap:4, marginBottom:6}}>
                  {[60, 90, 120, 180].map(angle => (
                    <button
                      key={angle}
                      className={`mode-btn${selectedAngle === angle ? ' active' : ''}`}
                      onClick={() => onAngleChange(angle)}
                      style={{fontSize:'11px', padding:'4px 8px', flex: '1 1 22%'}}
                    >
                      {angle}°
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => onAngleModeChange('custom')}
                  style={{width:'100%', padding:'4px', fontSize:'10px', color:'var(--dim)', background:'transparent', border:'none', cursor:'pointer', textDecoration:'underline'}}
                >
                  {t('btnCustomAngle')}
                </button>
              </>
            ) : (
              <>
                <div style={{display:'flex', gap:4, marginBottom:6}}>
                  <input
                    type="number"
                    min="1"
                    max="359"
                    value={selectedAngle}
                    onChange={e => onAngleChange(Math.max(1, Math.min(359, Number(e.target.value) || 0)))}
                    onBlur={e => {
                      const val = Number(e.target.value);
                      if (val < 1 || val > 359) onAngleChange(120);
                    }}
                    style={{flex:1, padding:'4px', border:'1px solid var(--border)', borderRadius:'4px', fontSize:'12px'}}
                  />
                  <span style={{padding:'4px 8px', fontSize:'11px', color:'var(--dim)'}}>°</span>
                </div>
                <button
                  onClick={() => onAngleModeChange('preset')}
                  style={{width:'100%', padding:'4px', fontSize:'10px', color:'var(--dim)', background:'transparent', border:'none', cursor:'pointer', textDecoration:'underline'}}
                >
                  {t('btnUsePreset')}
                </button>
              </>
            )}
          </div>

          {/* Dual Operation Buttons */}
          <div className="ops-row" style={{marginBottom:6, gap:6}}>
            <button
              className="mode-btn"
              onClick={() => {
                try {
                  onApplyRotation(selectedAngle);
                } catch (error) {
                  console.error('SymmetryControls: error in onApplyRotation', error);
                  alert(`Error applying rotation: ${error.message || 'Unknown error occurred'}`);
                }
              }}
              style={{flex:1, background:'#378ADD', display:'flex', alignItems:'center', justifyContent:'center', gap:4, fontSize:'11px'}}
            >
              ↻ {t('btnRotate')} {selectedAngle}°
            </button>
            <button
              className="mode-btn"
              onClick={() => {
                try {
                  onApplyInversion();
                } catch (error) {
                  console.error('SymmetryControls: error in onApplyInversion', error);
                  alert(`Error applying inversion: ${error.message || 'Unknown error occurred'}`);
                }
              }}
              style={{flex:1, background:'#c8921a', display:'flex', alignItems:'center', justifyContent:'center', gap:4, fontSize:'11px'}}
            >
              ⊙ {t('labelInversion')}
            </button>
          </div>
        </>
      )}

      {stepMode && (
        <>
          {/* Operation Buttons (Reset, Undo, Back, Save) */}
          <div className="ops-row" style={{marginBottom:6, flexWrap:'wrap', gap: 6}}>
            <button className="mode-btn" onClick={onReset} style={{fontSize:'11px'}}>{t('symReset')}</button>
            <button className="mode-btn" onClick={onUndo} style={{fontSize:'11px'}} disabled={operationsLog.length === 0}>{t('symUndo')}</button>
            <button
              className="mode-btn"
              onClick={onBack}
              style={{fontSize:'11px', opacity: savedAtoms?.length > 0 ? 1 : 0.4, cursor: savedAtoms?.length > 0 ? 'pointer' : 'not-allowed'}}
              disabled={!savedAtoms || savedAtoms.length === 0}
            >
              {t('btnBack')}
            </button>
            <button
              className="mode-btn"
              onClick={onSavePosition}
              style={{fontSize:'11px', background:'#28a745', color:'white'}}
            >
              {t('btnSavePosition')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Stereographic Projection Canvas Component ────────────────────────────────
export function StereographicProjection({ t, selectedOperation, operationsLog, startPoint, savedAtoms, previewAtom, currentBasePoint, stepMode, projectionZoom = 1, onProjectionZoomChange = () => {} }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const normalizePoint = (point) => {
    if (Array.isArray(point) && point.length >= 3) {
      return [point[0], point[1], point[2]];
    }
    if (point && typeof point === 'object' && 'x' in point && 'y' in point && 'z' in point) {
      return [point.x, point.y, point.z];
    }
    return null;
  };

  const effectivePoint = normalizePoint(currentBasePoint) || normalizePoint(startPoint);

  // Function that draws the projection content on the canvas
  const drawProjection = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !startPoint) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const centerX = (canvas.width / dpr) / 2;
    const centerY = (canvas.height / dpr) / 2;
    const baseRadius = Math.max(24, Math.min(centerX, centerY) - 20);
    const radius = baseRadius * projectionZoom;

    // Marker symbol size and line width scale with the circle's current
    // radius (a percentage, not a fixed pixel count) so × / ○ markers
    // shrink proportionally as the window/panel is resized — matching how
    // markers in the 3D view stay proportionally consistent with the scene
    // instead of becoming relatively oversized in a smaller window.
    const markerCrossSize = radius * 0.06;
    const markerCircleSize = radius * 0.07;
    const markerLineWidth = Math.max(1.5, radius * 0.024);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // Draw projection circle
    ctx.strokeStyle = '#666';
    ctx.lineWidth = selectedOperation === '2̄//Oz' ? 3 : 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Fixed axis-orientation legend, top-left corner of the white square:
    // horizontal = b, vertical = a, out-of-page (toward viewer) = c.
    {
      const ox = 32, oy = 32, armLen = 28, headLen = 6;
      ctx.save();
      ctx.strokeStyle = '#000';
      ctx.fillStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.font = 'bold 12px Arial';

      const drawAxisArrow = (dx, dy, label, labelDx, labelDy) => {
        const tx = ox + dx, ty = oy + dy;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        const ang = Math.atan2(ty - oy, tx - ox);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - headLen * Math.cos(ang - Math.PI / 6), ty - headLen * Math.sin(ang - Math.PI / 6));
        ctx.lineTo(tx - headLen * Math.cos(ang + Math.PI / 6), ty - headLen * Math.sin(ang + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, tx + labelDx, ty + labelDy);
      };

      drawAxisArrow(armLen, 0, 'y', 10, 0);  // horizontal → b (right)
      drawAxisArrow(0, armLen, 'x', 0, 10);  // vertical → a (down)

      // c: toward viewer, drawn as a circled dot at the corner where a/b
      // originate (standard out-of-page symbol)
      ctx.beginPath();
      ctx.arc(ox, oy, 5, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ox, oy, 1.6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText('z', ox - 8, oy - 8);

      ctx.restore();
    }

    // Draw axis indicators
    if (selectedOperation === '2̄//Oy') {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();
    }
    if (selectedOperation === '2//Oy') {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.stroke();
    }

    const op = SYMMETRY_OPERATIONS[selectedOperation];
    if (op) {
      ctx.fillStyle = op.type === 'improper' ? '#999' : '#000';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let symbol = '•';
      if (op.order === 3) symbol = '▲';
      else if (op.order === 4) symbol = '◆';
      else if (op.order === 6) symbol = '⬡';
      else if (selectedOperation === '1̄') symbol = '○';

      ctx.fillText(symbol, centerX, centerY);
    }

    // Always project onto the a–b (xy) plane, with c pointing toward the
    // viewer — the stereographic circle should always represent that same
    // fixed plane, regardless of which operation/axis is currently selected.
    const cylinderAxis = 'c';

    // Pull marker positions in a bit from the true projected radius so a
    // point lying exactly in the equatorial plane (height=0) doesn't render
    // right on top of the circle's border stroke.
    const MARKER_INSET = 0.9;

    const projectPoint = (point) => {
      const [x, y, z] = Array.isArray(point) ? point : [point.x, point.y, point.z];
      if (isNaN(x) || isNaN(y) || isNaN(z)) return null;

      // Horizontal screen axis = b (y), vertical screen axis = a (x), with a
      // pointing down the screen — this keeps (a,b,c) a right-handed set
      // given b = right and c = toward the viewer (b × c = a).
      const planeX = y, planeY = -x, height = z;

      const r_plane = Math.sqrt(planeX * planeX + planeY * planeY);
      const r_total = Math.sqrt(planeX * planeX + planeY * planeY + height * height);
      if (r_total === 0) return null;

      const zn = height / r_total;
      // Treat -0 as the negative side, not the positive one: JS evaluates
      // `-0 >= 0` as true, which would otherwise draw an inverted point
      // (whose z can become exactly -0 when the original was +0) as
      // "above" again instead of on the opposite side of the plane.
      const znIsAbove = !Object.is(zn, -0) && zn >= 0;
      const projRadius = ((radius * r_plane) / (r_total + (znIsAbove ? height : -height))) * MARKER_INSET;
      const angle = Math.atan2(planeY, planeX);
      const px = centerX + projRadius * Math.cos(angle);
      const py = centerY - projRadius * Math.sin(angle);

      return { px, py, isAbove: znIsAbove };
    };

    const drawCross = (px, py, size = 10, color = '#ff0000', lineWidth = 4, fill = null) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(px - size, py - size);
      ctx.lineTo(px + size, py + size);
      ctx.moveTo(px + size, py - size);
      ctx.lineTo(px - size, py + size);
      ctx.stroke();
      if (fill) {
        ctx.fillStyle = fill;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(px - size, py - size, size * 2, size * 2);
        ctx.globalAlpha = 1.0;
      }
    };

    const drawCircle = (px, py, size = 12, color = '#ff0000', lineWidth = 4, fill = null) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, 2 * Math.PI);
      ctx.stroke();
      if (fill) {
        ctx.fillStyle = fill;
        ctx.globalAlpha = 0.4;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    };

    const drawAtomPoint = (projection) => {
      if (!projection) return;
      if (projection.isAbove) drawCross(projection.px, projection.py, markerCrossSize, '#ff0000', markerLineWidth);
      else drawCircle(projection.px, projection.py, markerCircleSize, '#ff0000', markerLineWidth);
    };

    if (savedAtoms && Array.isArray(savedAtoms) && savedAtoms.length > 0) {
      savedAtoms.forEach(atom => {
        const proj = projectPoint(atom);
        drawAtomPoint(proj);
      });
    }

    // While Rotate/Inversion is animating, effectivePoint is deliberately
    // still the OLD (pre-animation) position — only previewAtom moves. Skip
    // drawing effectivePoint's own marker for as long as previewAtom has
    // visibly diverged from it, so only the single animating marker (drawn
    // below) is shown instead of two — the frozen starting mark plus the
    // one sweeping past it. Inversion suppresses it for the whole animation
    // (progress 0 included) since the animated marker sits at that exact
    // spot at t=0 too.
    const isAnimatingAway = previewAtom && previewAtom.isPreview && (previewAtom.isInversion || (() => {
      const [ax, ay, az] = Array.isArray(previewAtom) ? previewAtom : [previewAtom.x, previewAtom.y, previewAtom.z];
      const [bx, by, bz] = Array.isArray(effectivePoint) ? effectivePoint : [effectivePoint.x, effectivePoint.y, effectivePoint.z];
      return Math.abs(ax - bx) >= 1e-6 || Math.abs(ay - by) >= 1e-6 || Math.abs(az - bz) >= 1e-6;
    })());

    if (effectivePoint && !isAnimatingAway) {
      const proj = projectPoint(effectivePoint);
      if (proj) {
        const baseFill = 'rgba(255,0,0,0.15)';
        if (proj.isAbove) {
          drawCross(proj.px, proj.py, markerCrossSize, '#ff0000', markerLineWidth, baseFill);
        } else {
          drawCircle(proj.px, proj.py, markerCircleSize, '#ff0000', markerLineWidth, baseFill);
        }
      }
    }

    if (previewAtom && previewAtom.isInversion) {
      // Map only the well-defined start point once, then slide in a
      // straight line to its exact reflection through the circle's center —
      // re-projecting intermediate raw coordinates (which pass near the
      // origin, where direction/angle is undefined) made the marker jump
      // around instead of sliding smoothly through the middle.
      const startProj = projectPoint(previewAtom.from);
      if (startProj) {
        const progress = previewAtom.progress ?? 1;
        const endPx = 2 * centerX - startProj.px;
        const endPy = 2 * centerY - startProj.py;
        const px = startProj.px + (endPx - startProj.px) * progress;
        const py = startProj.py + (endPy - startProj.py) * progress;
        const isAbove = progress < 0.5 ? startProj.isAbove : !startProj.isAbove;
        if (isAbove) drawCross(px, py, markerCrossSize, '#ff0000', markerLineWidth);
        else drawCircle(px, py, markerCircleSize, '#ff0000', markerLineWidth);
      }
    } else {
      const animatedPoint = (previewAtom && previewAtom.isPreview) ? previewAtom : null;
      if (animatedPoint) {
        const isAlreadySaved = savedAtoms.some(saved => {
          const [ax, ay, az] = Array.isArray(animatedPoint) ? animatedPoint : [animatedPoint.x, animatedPoint.y, animatedPoint.z];
          return Math.abs(saved.x - ax) < 1e-6 && Math.abs(saved.y - ay) < 1e-6 && Math.abs(saved.z - az) < 1e-6;
        });
        if (!isAlreadySaved) {
          const proj = projectPoint(animatedPoint);
          drawAtomPoint(proj);
        }
      }
    }

    const uniqueSavedAtoms = (savedAtoms || []).filter((atom, index, arr) => {
      const [x0, y0, z0] = Array.isArray(atom) ? atom : [atom.x, atom.y, atom.z];
      return index === arr.findIndex(other => {
        const [x1, y1, z1] = Array.isArray(other) ? other : [other.x, other.y, other.z];
        return Math.abs(x0 - x1) < 1e-6 && Math.abs(y0 - y1) < 1e-6 && Math.abs(z0 - z1) < 1e-6;
      });
    });

    uniqueSavedAtoms.forEach(atom => {
      const proj = projectPoint(atom);
      drawAtomPoint(proj);
    });

    // Direct mode only: show the full computed orbit for the selected
    // operation. Step-by-Step already draws effectivePoint/previewAtom
    // individually above — drawing the operation's orbit here too would
    // re-plot the same (stale, pre-animation) point a second time.
    if (!stepMode && op && effectivePoint) {
      const previewPoints = generateOrbitPoints(effectivePoint, op, selectedOperation);
      previewPoints.forEach(point => {
        const proj = projectPoint(point);
        drawAtomPoint(proj);
      });
    }
  }, [selectedOperation, startPoint, savedAtoms, previewAtom, projectionZoom, effectivePoint, stepMode]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Keep canvas square and fill available container space
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const size = Math.max(150, Math.floor(Math.min(containerWidth, containerHeight)));

    // Set device-pixel-ratio aware dimensions for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    drawProjection();
  }, [drawProjection]);

  // Helper function to generate orbit points
  const generateOrbitPoints = (startPoint, operation, operationKey) => {
    const points = [startPoint];

    if (operation.order === 1) {
      return points; // Identity only
    }

    let currentPoint = startPoint;
    for (let i = 1; i < operation.order; i++) {
      currentPoint = operation.transform(...currentPoint);
      points.push(currentPoint);
    }

    // 2̄//Oz is explicitly exempted from dedup — see the matching note in
    // AppShell.jsx's generateOrbitPoints for why.
    if (operationKey === '2̄//Oz') return points;

    // Remove duplicates
    return points.filter((point, index, arr) => {
      return !arr.slice(0, index).some(p =>
        Math.abs(p[0] - point[0]) < 1e-6 &&
        Math.abs(p[1] - point[1]) < 1e-6 &&
        Math.abs(p[2] - point[2]) < 1e-6
      );
    });
  };

  useEffect(() => {
    drawProjection();
  }, [drawProjection]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      onProjectionZoomChange(prev => Math.min(10, Math.max(0.1, prev + delta)));
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [onProjectionZoomChange]);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver(() => resizeCanvas());
    resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas]);

  return (
    <div style={{padding:16, background:'var(--panel)', borderRadius:8, border:'1px solid var(--border)', flex:1, minHeight:0, display:'flex', flexDirection:'column'}}>
      <div ref={containerRef} style={{width:'100%', flex:1, minHeight:0, display:'flex', justifyContent:'center', alignItems:'center', position:'relative'}}>
      <canvas
        id="stereo-canvas"
        ref={canvasRef}
        width={400}
        height={400}
        style={{border:'1px solid var(--border)', borderRadius:4, background:'white', width:'100%', height:'100%', maxWidth:'100%', maxHeight:'100%'}}
      />
      </div>
      <div style={{marginTop:8, fontSize:'11px', color:'var(--dim)', flexShrink:0}}>
        <div>{t('captionAboveBelow')}</div>
      </div>
    </div>
  );
}
