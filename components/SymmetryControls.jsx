'use client'

import { useState, useRef, useEffect, useCallback } from 'react';

// ── Symmetry Operations Database ──────────────────────────────────────────────
const SYMMETRY_OPERATIONS = {
  // PROPER ROTATIONS
  '1': {
    name: 'Identity (1)',
    type: 'proper',
    order: 1,
    axis: null,
    transform: (x, y, z) => [x, y, z],
    positions: 1,
    above: 1,
    below: 0,
    description: 'No transformation - identity operation'
  },
  '2//Oz': {
    name: '2-fold rotation // Oz',
    type: 'proper',
    order: 2,
    axis: 'c',
    transform: (x, y, z) => [-x, -y, z],
    positions: 2,
    above: 2,
    below: 0,
    description: '180° rotation around z-axis'
  },
  '2//Oy': {
    name: '2-fold rotation // Oy',
    type: 'proper',
    order: 2,
    axis: 'b',
    transform: (x, y, z) => [-x, y, -z],
    positions: 2,
    above: 1,
    below: 1,
    description: '180° rotation around y-axis'
  },
  '3': {
    name: '3-fold rotation (C3)',
    type: 'proper',
    order: 3,
    axis: 'c',
    transform: (x, y, z) => {
      // 120° rotation around z-axis
      const cos = Math.cos(2 * Math.PI / 3);
      const sin = Math.sin(2 * Math.PI / 3);
      return [x * cos - y * sin, x * sin + y * cos, z];
    },
    positions: 3,
    above: 3,
    below: 0,
    description: '120° rotation around z-axis'
  },
  '4': {
    name: '4-fold rotation (C4)',
    type: 'proper',
    order: 4,
    axis: 'c',
    transform: (x, y, z) => [-y, x, z],
    positions: 4,
    above: 4,
    below: 0,
    description: '90° rotation around z-axis'
  },
  '6': {
    name: '6-fold rotation (C6)',
    type: 'proper',
    order: 6,
    axis: 'c',
    transform: (x, y, z) => {
      // 60° rotation around z-axis
      const cos = Math.cos(Math.PI / 3);
      const sin = Math.sin(Math.PI / 3);
      return [x * cos - y * sin, x * sin + y * cos, z];
    },
    positions: 6,
    above: 6,
    below: 0,
    description: '60° rotation around z-axis'
  },

  // IMPROPER ROTATIONS
  '1̄': {
    name: 'Inversion (1̄)',
    type: 'improper',
    order: 1,
    axis: null,
    transform: (x, y, z) => [-x, -y, -z],
    positions: 2,
    above: 1,
    below: 1,
    description: 'Inversion through origin'
  },
  '2̄//Oz': {
    name: 'Mirror ⊥ Oz (2̄ // Oz)',
    type: 'improper',
    order: 2,
    axis: 'c',
    transform: (x, y, z) => [x, y, -z],
    positions: 2,
    above: 1,
    below: 1,
    description: 'Reflection across xy-plane'
  },
  '2̄//Oy': {
    name: 'Mirror ⊥ Oy (2̄ // Oy)',
    type: 'improper',
    order: 2,
    axis: 'b',
    transform: (x, y, z) => [x, -y, z],
    positions: 2,
    above: 2,
    below: 0,
    description: 'Reflection across xz-plane'
  },
  '3̄': {
    name: '3-fold improper (3̄)',
    type: 'improper',
    order: 6,
    axis: 'c',
    transform: (x, y, z) => {
      // C3 rotation + inversion
      const cos = Math.cos(2 * Math.PI / 3);
      const sin = Math.sin(2 * Math.PI / 3);
      const rx = x * cos - y * sin;
      const ry = x * sin + y * cos;
      return [-rx, -ry, -z];
    },
    positions: 6,
    above: 3,
    below: 3,
    description: 'C3 rotation + inversion',
    compound: true
  },
  '4̄': {
    name: '4-fold improper (4̄)',
    type: 'improper',
    order: 4,
    axis: 'c',
    transform: (x, y, z) => [-y, x, -z],
    positions: 4,
    above: 2,
    below: 2,
    description: 'C4 rotation + inversion',
    compound: true
  },
  '6̄': {
    name: '6-fold improper (6̄)',
    type: 'improper',
    order: 6,
    axis: 'c',
    transform: (x, y, z) => {
      // C6 rotation + inversion
      const cos = Math.cos(Math.PI / 3);
      const sin = Math.sin(Math.PI / 3);
      const rx = x * cos - y * sin;
      const ry = x * sin + y * cos;
      return [-rx, -ry, -z];
    },
    positions: 6,
    above: 3,
    below: 3,
    description: 'C6 rotation + inversion',
    compound: true
  }
};

export default function SymmetryControls({
  t,
  startPoint,
  onStartPoint,
  selectedOperation,
  onOperationSelect,
  onApplyOperation,
  onReset,
  onUndo,
  onBack,
  operationsLog,
  stepMode,
  onStepMode,
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
}) {
  const canvasRef = useRef(null);
  const savedAtomsRef = useRef([]);
  const selectedOperationRef = useRef(selectedOperation);
  const startPointRef = useRef(startPoint);
  const previewAtomRef = useRef(previewAtom);
  const currentBasePointRef = useRef(currentBasePoint);

  const basePoint = (currentBasePoint && Array.isArray(currentBasePoint) && currentBasePoint.length === 3)
    ? currentBasePoint
    : startPoint;

  // ── Stereographic Projection Drawing ────────────────────────────────────────
  const drawStereographicProjection = () => {
    console.log('[DRAW] drawStereographicProjection called');
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.max(24, Math.min(centerX, centerY) - 20) * projectionZoom;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw projection circle
    const circleBoldOps = ['2̄//Oz', '6̄'];
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = circleBoldOps.includes(selectedOperation) ? 3 : 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw axis indicators for specific operations
    if (selectedOperation === '2//Oy') {
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.stroke();
    }
    if (selectedOperation === '2̄//Oy') {
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();
    }

    // Draw center symbol according to operation
    drawCenterSymbol(ctx, centerX, centerY, radius, selectedOperation);

    // Determine cylinder axis based on operation
    let cylinderAxis = 'c';
    if (selectedOperation.includes('Oy')) cylinderAxis = 'b';
    if (selectedOperation.includes('Ox')) cylinderAxis = 'a';

    // Helper function to project point stereographically
    const projectPoint = (point) => {
      const [x, y, z] = Array.isArray(point) ? point : [point.x, point.y, point.z];
      if (isNaN(x) || isNaN(y) || isNaN(z)) return null;

      let planeX, planeY, height;
      if (cylinderAxis === 'c') {
        planeX = x;
        planeY = y;
        height = z;
      } else if (cylinderAxis === 'b') {
        planeX = x;
        planeY = z;
        height = y;
      } else { // 'a'
        planeX = y;
        planeY = z;
        height = x;
      }

      const r_plane = Math.sqrt(planeX * planeX + planeY * planeY);
      const r_total = Math.sqrt(planeX * planeX + planeY * planeY + height * height);
      if (r_total === 0) return null;

      const xn = planeX / r_total;
      const yn = planeY / r_total;
      const zn = height / r_total;

      let projRadius;
      if (zn >= 0) {
        projRadius = (radius * r_plane) / (r_total + height);
      } else {
        projRadius = (radius * r_plane) / (r_total - height);
      }
      let angle = Math.atan2(planeY, planeX);
      const px = centerX + projRadius * Math.cos(angle);
      const py = centerY - projRadius * Math.sin(angle);  // Note: - for correct orientation

      return { px, py, isAbove: zn >= 0 };
    };

    // Helper to draw cross (×) symbol
    const drawCross = (px, py, size = 10, color = '#e03030', lineWidth = 3) => {
      ctx.strokeStyle = '#e03030';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(px - size, py - size);
      ctx.lineTo(px + size, py + size);
      ctx.moveTo(px + size, py - size);
      ctx.lineTo(px - size, py + size);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    // Helper to draw circle (○) symbol
    const drawCircle = (px, py, size = 10, color = '#e03030', lineWidth = 3) => {
      ctx.strokeStyle = '#e03030';
      ctx.lineWidth = 3;
      ctx.fillStyle = '#ffffff';
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(px, py, size, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fill();
      ctx.setLineDash([]);
    };

    const drawOverlapSymbol = (px, py) => {
      drawCircle(px, py, 12, '#e03030', 3);
      drawCross(px, py, 10, '#e03030', 3);
    };

    const drawCenterSymbol = (ctx, CX, CY, R, op) => {
      ctx.strokeStyle = '#111111';
      ctx.fillStyle = '#111111';
      ctx.lineWidth = 2;
      const drawTriangle = (filled, size = 14) => {
        const h = Math.sqrt(3) / 2 * size;
        ctx.beginPath();
        ctx.moveTo(CX, CY - (2 / 3) * h);
        ctx.lineTo(CX - size / 2, CY + (1 / 3) * h);
        ctx.lineTo(CX + size / 2, CY + (1 / 3) * h);
        ctx.closePath();
        if (filled) ctx.fill(); else ctx.stroke();
      };
      const drawDiamond = (filled, size = 12) => {
        ctx.beginPath();
        ctx.moveTo(CX, CY - size / 2);
        ctx.lineTo(CX + size / 2, CY);
        ctx.lineTo(CX, CY + size / 2);
        ctx.lineTo(CX - size / 2, CY);
        ctx.closePath();
        if (filled) ctx.fill(); else ctx.stroke();
      };
      const drawHexagon = (filled, size = 14) => {
        const r = size / 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const theta = Math.PI / 3 * i - Math.PI / 6;
          const x = CX + r * Math.cos(theta);
          const y = CY + r * Math.sin(theta);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        if (filled) ctx.fill(); else ctx.stroke();
      };

      if (op === '2//Oz') {
        ctx.beginPath();
        ctx.ellipse(CX, CY, 7, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (op === '2//Oy') {
        ctx.beginPath();
        ctx.ellipse(CX - R, CY, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(CX + R, CY, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (op === '3') {
        drawTriangle(true);
      } else if (op === '4') {
        drawDiamond(true, 12);
      } else if (op === '6') {
        drawHexagon(true, 14);
      } else if (op === '3̄') {
        drawTriangle(false);
      } else if (op === '4̄') {
        drawDiamond(false, 14);
        ctx.beginPath();
        ctx.ellipse(CX, CY, 2.5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (op === '6̄') {
        drawHexagon(false, 16);
        drawTriangle(true, 8);
      }
    };
    // Draw all saved atoms (solid red) and starting point
    const points = [];
    if (savedAtoms && Array.isArray(savedAtoms)) {
      savedAtoms.forEach(atom => {
        const proj = projectPoint(atom);
        if (!proj) return;
        points.push({ ...proj, isPreview: false });
      });
    }
    if (points.length === 0 && startPoint) {
      const proj = projectPoint(startPoint);
      if (proj) points.push({ ...proj, isPreview: false });
    }

    const used = new Array(points.length).fill(false);
    for (let i = 0; i < points.length; i++) {
      if (used[i]) continue;
      const p = points[i];
      if (!p.isAbove) continue;
      const partnerIndex = points.findIndex((q, j) => j !== i && !used[j] && !q.isAbove && Math.hypot(q.px - p.px, q.py - p.py) < 6);
      if (partnerIndex !== -1) {
        const q = points[partnerIndex];
        drawOverlapSymbol(p.px, p.py, p.isPreview || q.isPreview);
        used[i] = true;
        used[partnerIndex] = true;
      }
    }

    for (let i = 0; i < points.length; i++) {
      if (used[i]) continue;
      const p = points[i];
      if (p.isAbove) drawCross(p.px, p.py, 10, '#e03030', 2, p.isPreview);
      else drawCircle(p.px, p.py, 12, '#e03030', 2, p.isPreview);
    }

    // Draw moving preview atom (while animation runs or final before save)
    const animatedPoint = (previewAtom && previewAtom.isPreview) ? previewAtom : null;
    if (animatedPoint) {
      // Check if this point is already saved (to avoid duplicate drawing)
      const isAlreadySaved = savedAtoms.some(saved => {
        const [ax, ay, az] = Array.isArray(animatedPoint) ? animatedPoint : [animatedPoint.x, animatedPoint.y, animatedPoint.z];
        return Math.abs(saved.x - ax) < 1e-6 && Math.abs(saved.y - ay) < 1e-6 && Math.abs(saved.z - az) < 1e-6;
      });
      if (!isAlreadySaved) {
        const proj = projectPoint(animatedPoint);
        if (proj) {
          if (proj.isAbove) {
            drawCross(proj.px, proj.py, 10, '#e03030', 2, true);
          } else {
            drawCircle(proj.px, proj.py, 12, '#e03030', 2, true);
          }
        }
      }
    }

    // Draw points from operations log
    // REMOVED - now rendering savedAtoms and previewAtom instead
  };

  useEffect(() => {
    savedAtomsRef.current = savedAtoms;
    selectedOperationRef.current = selectedOperation;
    startPointRef.current = startPoint;
    previewAtomRef.current = previewAtom;
    currentBasePointRef.current = currentBasePoint;
  }, [savedAtoms, selectedOperation, startPoint, previewAtom, currentBasePoint]);

  useEffect(() => {
    drawStereographicProjection();
  }, [selectedOperation, savedAtoms, previewAtom, startPoint, currentBasePoint, projectionZoom, drawStereographicProjection]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setProjectionZoom(prev => Math.min(3, Math.max(0.5, prev + delta)));
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => { canvas.removeEventListener('wheel', onWheel); };
  }, []);

  // ── Operation Buttons ──────────────────────────────────────────────────────
  const properOps = ['1', '2//Oz', '2//Oy', '3', '4', '6'];
  const improperOps = ['1̄', '2̄//Oz', '2̄//Oy', '3̄', '4̄', '6̄'];

  return (
    <div id="ctrl-symmetry" className="controls active">
      <span className="ctrl-label">{t('labelSymmetry')}</span>

      <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:8}}>
        <button className="mode-btn" onClick={() => onProjectionZoomChange?.(z => Math.min(3, z + 0.1))}>+ Zoom</button>
        <button className="mode-btn" onClick={() => onProjectionZoomChange?.(z => Math.max(0.5, z - 0.1))}>- Zoom</button>
        <button className="mode-btn" onClick={() => onProjectionZoomChange?.(1)}>Reset</button>
        <span style={{marginLeft:'auto', color:'var(--dim)', fontSize:'0.75rem'}}>Zoom {Math.round((projectionZoom || 1) * 100)}%</span>
      </div>

      {/* Starting Point Input */}
      <span className="ctrl-label">{t('labelStartPoint')}</span>
      <div style={{ display:'flex', gap:4, marginBottom:8 }}>
        {['x','y','z'].map((dim,i) => (
          <input key={dim} type="number" step="0.01" min="0" max="1" value={startPoint[i].toFixed(2)} onChange={e => {
              const value = Math.max(0, Math.min(1, Number(e.target.value) || 0));
              const next = [...startPoint]; next[i] = value;
              onStartPoint(next);
            }}
            style={{ width: '33%', padding:'4px', border:'1px solid var(--border)', borderRadius:'4px', fontSize:'12px' }}
          />
        ))}
      </div>

      {/* Operation Selector */}
      <span className="ctrl-label">Select Operation</span>

      {/* Proper Rotations */}
      <div style={{marginBottom:8}}>
        <div style={{fontSize:'11px', fontWeight:500, color:'var(--text)', marginBottom:4}}>{t('symProper')}</div>
        <div className="mode-toggle" style={{flexWrap:'wrap', gap:4}}>
          {properOps.map(op => (
            <button
              key={op}
              className={`mode-btn${selectedOperation===op?' active':''}`}
              onClick={() => onOperationSelect(op)}
              style={{fontSize:'11px', padding:'4px 6px'}}
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
              className={`mode-btn${selectedOperation===op?' active':''}`}
              onClick={() => onOperationSelect(op)}
              style={{fontSize:'11px', padding:'4px 6px'}}
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      {/* Step Mode for All Operations */}
      <div style={{marginBottom:8}}>
        <span className="ctrl-label">Application Mode</span>
        <div className="mode-toggle">
          <button className={`mode-btn${!stepMode?' active':''}`} onClick={() => {
            onStepMode(false);
            onOperationSelect('1'); // Reset to identity
            onSavedAtomsChange([]); // Clear saved atoms
            onBasePointChange([...startPoint]); // Reset to starting point
            onPreviewAtomChange(null); // Clear preview
          }}>Direct</button>
          <button className={`mode-btn${stepMode?' active':''}`} onClick={() => {
            onStepMode(true);
            onOperationSelect('1'); // Reset to identity
            onSavedAtomsChange([]); // Clear saved atoms
            onBasePointChange([...startPoint]); // Reset to starting point
            onPreviewAtomChange(null); // Clear preview
          }}>Step-by-Step</button>
        </div>
        {stepMode && (
          <div style={{marginTop:4, fontSize:'11px', color:'var(--dim)'}}>
            Step {currentStep}: {currentStep === 1 ? 'Apply operation' : 'Show result'}
          </div>
        )}
      </div>

      {/* Visual separator */}
      <hr style={{border:'none', borderTop:'1px solid var(--border)', margin:'12px 0'}} />

      {/* Animation Speed Control */}
      <div style={{marginBottom:8}}>
        <span className="ctrl-label">Animation Speed</span>
        <div className="mode-toggle">
          <button className={`mode-btn${animationSpeed === 'slow' ? ' active' : ''}`} onClick={() => onAnimationSpeedChange('slow')}>Slow</button>
          <button className={`mode-btn${animationSpeed === 'normal' ? ' active' : ''}`} onClick={() => onAnimationSpeedChange('normal')}>Normal</button>
          <button className={`mode-btn${animationSpeed === 'fast' ? ' active' : ''}`} onClick={() => onAnimationSpeedChange('fast')}>Fast</button>
        </div>
      </div>

      {/* Angle Selector UI */}
      <div style={{marginBottom:8, padding:'8px', border:'1px solid var(--border)', borderRadius:'4px', background:'var(--panel-bg)'}}>
        <div style={{fontSize:'11px', fontWeight:500, color:'var(--text)', marginBottom:6}}>Angle</div>
        
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
              Custom angle ▾
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
              Use preset ▴
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
          ↻ Rotate {selectedAngle}°
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
          ⊙ Inversion
        </button>
      </div>

      {/* Confirm Bar Container (Fixed Height) */}
      <div style={{ minHeight: '0px', transition: 'min-height 0.2s ease' }}>
      </div>

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
          ← Back
        </button>
        <button
          className="mode-btn"
          onClick={onSavePosition}
          style={{fontSize:'11px', background:'#28a745', color:'white'}}
        >
          ✓ Save Position
        </button>
        {!stepMode && (
          <button className="mode-btn" onClick={() => onApplyOperation(selectedOperation, null)} style={{flex:1, background:'#378add', fontSize:'11px'}}>{t('symApply')}</button>
        )}
      </div>

      {/* Enhanced Operations Log */}
      {operationsLog && operationsLog.length > 0 && (
        <div style={{marginTop:8, padding:'8px', border:'1px solid var(--border)', borderRadius:'4px', maxHeight:'150px', overflowY:'auto', fontSize:'10px'}}>
          <div style={{fontWeight:500, marginBottom:4, color:'var(--text)', fontSize:'11px'}}>Operations Log</div>
          <div style={{marginBottom:6, padding:'4px', background:'var(--panel-bg)', borderRadius:'3px', fontSize:'10px', color:'var(--dim)'}}>
            Current point: ({basePoint[0].toFixed(2)}, {basePoint[1].toFixed(2)}, {basePoint[2].toFixed(2)})
          </div>
          {operationsLog.slice(0,10).map((entry,i) => (
            <div key={i} style={{fontSize:'10px', padding:'3px 0', borderBottom:'0.5px solid var(--border)', color:'var(--dim)', lineHeight:'1.3'}}>
              {entry.step ? `Step ${entry.step}` : `Op ${i+1}`} | <span style={{fontWeight:500}}>{entry.operation || entry.description}</span>
              {entry.from && entry.to && ` | ${entry.from} → ${entry.to}`}
              {entry.isAbovePlane !== undefined && ` | ${entry.isAbovePlane ? '×' : '○'}`}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Stereographic Projection Canvas Component ────────────────────────────────
export function StereographicProjection({ selectedOperation, operationsLog, startPoint, savedAtoms, previewAtom, currentBasePoint, projectionZoom = 1, onProjectionZoomChange = () => {} }) {
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

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // Draw projection circle
    ctx.strokeStyle = '#666';
    ctx.lineWidth = selectedOperation === '2̄//Oz' ? 3 : 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

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

    let cylinderAxis = 'c';
    if (selectedOperation.includes('Oy')) cylinderAxis = 'b';
    if (selectedOperation.includes('Ox')) cylinderAxis = 'a';

    const projectPoint = (point) => {
      const [x, y, z] = Array.isArray(point) ? point : [point.x, point.y, point.z];
      if (isNaN(x) || isNaN(y) || isNaN(z)) return null;

      let planeX, planeY, height;
      if (cylinderAxis === 'c') {
        planeX = x;
        planeY = y;
        height = z;
      } else if (cylinderAxis === 'b') {
        planeX = x;
        planeY = z;
        height = y;
      } else {
        planeX = y;
        planeY = z;
        height = x;
      }

      const r_plane = Math.sqrt(planeX * planeX + planeY * planeY);
      const r_total = Math.sqrt(planeX * planeX + planeY * planeY + height * height);
      if (r_total === 0) return null;

      const zn = height / r_total;
      const projRadius = (radius * r_plane) / (r_total + (zn >= 0 ? height : -height));
      const angle = Math.atan2(planeY, planeX);
      const px = centerX + projRadius * Math.cos(angle);
      const py = centerY - projRadius * Math.sin(angle);

      return { px, py, isAbove: zn >= 0 };
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
      if (projection.isAbove) drawCross(projection.px, projection.py, 10, '#ff0000', 4);
      else drawCircle(projection.px, projection.py, 12, '#ff0000', 4);
    };

    if (savedAtoms && Array.isArray(savedAtoms) && savedAtoms.length > 0) {
      savedAtoms.forEach(atom => {
        const proj = projectPoint(atom);
        drawAtomPoint(proj);
      });
    }

    if (effectivePoint) {
      const proj = projectPoint(effectivePoint);
      if (proj) {
        const baseFill = 'rgba(255,0,0,0.15)';
        if (proj.isAbove) {
          drawCross(proj.px, proj.py, 10, '#ff0000', 4, baseFill);
        } else {
          drawCircle(proj.px, proj.py, 12, '#ff0000', 4, baseFill);
        }
      }
    }

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

    if (op && effectivePoint) {
      const previewPoints = generateOrbitPoints(effectivePoint, op);
      previewPoints.forEach(point => {
        const proj = projectPoint(point);
        drawAtomPoint(proj);
      });
    }
  }, [selectedOperation, operationsLog, startPoint, savedAtoms, previewAtom, currentBasePoint, projectionZoom, effectivePoint]);

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
  const generateOrbitPoints = (startPoint, operation) => {
    const points = [startPoint];

    if (operation.positions === 1) {
      return points; // Identity only
    }

    let currentPoint = startPoint;
    for (let i = 1; i < operation.positions; i++) {
      currentPoint = operation.transform(...currentPoint);
      points.push(currentPoint);
    }

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
      onProjectionZoomChange(prev => Math.min(3, Math.max(0.5, prev + delta)));
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
    <div style={{padding:16, background:'var(--panel)', borderRadius:8, border:'1px solid var(--border)'}}>
      <h3 style={{margin:'0 0 12px 0', fontSize:'14px', color:'var(--text)'}}>Stereographic Projection</h3>
      <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:8}}>
        <button className='mode-btn' onClick={() => onProjectionZoomChange(prev => Math.min(3, Math.max(0.5, prev + 0.1)))}>+ Zoom</button>
        <button className='mode-btn' onClick={() => onProjectionZoomChange(prev => Math.min(3, Math.max(0.5, prev - 0.1)))}>- Zoom</button>
        <button className='mode-btn' onClick={() => onProjectionZoomChange(1)}>Reset</button>
        <span style={{marginLeft:'auto', color:'var(--dim)', fontSize:'0.75rem'}}>Zoom {Math.round(projectionZoom * 100)}%</span>
      </div>
      <div ref={containerRef} style={{width:'100%', height:'calc(100% - 90px)', minHeight:260, display:'flex', justifyContent:'center', alignItems:'center'}}>
      <canvas
        id="stereo-canvas"
        ref={canvasRef}
        width={400}
        height={400}
        style={{border:'1px solid var(--border)', borderRadius:4, background:'white', width:'100%', height:'100%', maxWidth:'100%', maxHeight:'100%'}}
      />
      </div>
      <div style={{marginTop:8, fontSize:'11px', color:'var(--dim)'}}>
        <div>× = Above plane (red crosses)</div>
        <div>○ = Below plane (blue circles)</div>
        {operationsLog.length === 0 && <div style={{marginTop:4, fontStyle:'italic'}}>Select an operation to see preview</div>}
      </div>
    </div>
  );
}
