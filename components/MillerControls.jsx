'use client'

const DIR_PRESETS = [
  {uvw:[1,0,0]},{uvw:[0,1,0]},{uvw:[0,0,1]},{uvw:[1,1,0]},
  {uvw:[1,0,1]},{uvw:[0,1,1]},{uvw:[1,1,1]},{uvw:[-1,1,0]},
  {uvw:[2,1,0]},{uvw:[1,2,1]}
]
const PLANE_PRESETS = [
  {hkl:[1,0,0]},{hkl:[0,1,0]},{hkl:[0,0,1]},{hkl:[1,1,0]},
  {hkl:[1,0,1]},{hkl:[0,1,1]},{hkl:[1,1,1]},{hkl:[1,1,2]},
  {hkl:[2,1,0]},{hkl:[-1,1,0]}
]

function fmt(n) {
  if (n === 0) return '0'
  if (n < 0) return String(Math.abs(n)) + '\u0305'
  return String(n)
}

export default function MillerControls({
  t, millerSub, millerCells, millerOrigin,
  millerU, millerV, millerW,
  millerH, millerK, millerL,
  onSubTab, onCells, onOrigin,
  onUVW, onHKL,
  infoDir, noteDir, infoPlane, notePlane,
}) {
  return (
    <div id="ctrl-miller" className="controls active">
      <div className="sub-tabs">
        <button className={`sub-tab${millerSub==='dir'?' active':''}`} onClick={() => onSubTab('dir')}>{t('millerDirTab')}</button>
        <button className={`sub-tab${millerSub==='plane'?' active':''}`} onClick={() => onSubTab('plane')}>{t('millerPlaneTab')}</button>
      </div>

      <span className="ctrl-label">{t('labelCellRep')}</span>
      <div className="mode-toggle">
        {[1,2,3].map(n => (
          <button key={n} className={`mode-btn${millerCells===n?' active':''}`} onClick={() => onCells(n)}>{n}x{n}x{n}</button>
        ))}
      </div>

      <span className="ctrl-label">{t('labelOriginCorner')}</span>
      <select value={millerOrigin.join(',')} onChange={e => onOrigin(e.target.value)} style={{ marginBottom: 4 }}>
        <option value="0,0,0">[0 0 0] — default</option>
        <option value="1,0,0">[1 0 0]</option>
        <option value="0,1,0">[0 1 0]</option>
        <option value="0,0,1">[0 0 1]</option>
        <option value="1,1,0">[1 1 0]</option>
        <option value="1,0,1">[1 0 1]</option>
        <option value="0,1,1">[0 1 1]</option>
        <option value="1,1,1">[1 1 1]</option>
      </select>

      {millerSub === 'dir' && (
        <div>
          <span className="ctrl-label">{t('labelDirIdx')}</span>
          <div className="idx-row">
            <label className="idx-label">u</label>
            <input className="idx-input" type="number" value={millerU} min="-4" max="4"
              onChange={e => onUVW('u', e.target.value)} />
            <label className="idx-label">v</label>
            <input className="idx-input" type="number" value={millerV} min="-4" max="4"
              onChange={e => onUVW('v', e.target.value)} />
            <label className="idx-label">w</label>
            <input className="idx-input" type="number" value={millerW} min="-4" max="4"
              onChange={e => onUVW('w', e.target.value)} />
          </div>
          <div className="presets">
            {DIR_PRESETS.map((p, i) => (
              <div key={i} className={`chip${millerU==p.uvw[0]&&millerV==p.uvw[1]&&millerW==p.uvw[2]?' sel':''}`}
                onClick={() => onUVW('preset', p.uvw)}>
                [{p.uvw.map(fmt).join(' ')}]
              </div>
            ))}
          </div>
          {infoDir && <div className="miller-display" dangerouslySetInnerHTML={{ __html: infoDir }} />}
          {noteDir && <div className="miller-note">{noteDir}</div>}
        </div>
      )}

      {millerSub === 'plane' && (
        <div>
          <span className="ctrl-label">{t('labelPlaneIdx')}</span>
          <div className="idx-row">
            <label className="idx-label">h</label>
            <input className="idx-input" type="number" value={millerH} min="-4" max="4"
              onChange={e => onHKL('h', e.target.value)} />
            <label className="idx-label">k</label>
            <input className="idx-input" type="number" value={millerK} min="-4" max="4"
              onChange={e => onHKL('k', e.target.value)} />
            <label className="idx-label">l</label>
            <input className="idx-input" type="number" value={millerL} min="-4" max="4"
              onChange={e => onHKL('l', e.target.value)} />
          </div>
          <div className="presets">
            {PLANE_PRESETS.map((p, i) => (
              <div key={i} className={`chip${millerH==p.hkl[0]&&millerK==p.hkl[1]&&millerL==p.hkl[2]?' sel':''}`}
                onClick={() => onHKL('preset', p.hkl)}>
                ({p.hkl.map(fmt).join(' ')})
              </div>
            ))}
          </div>
          {infoPlane && <div className="miller-display" dangerouslySetInnerHTML={{ __html: infoPlane }} />}
          {notePlane && <div className="miller-note">{notePlane}</div>}
        </div>
      )}
    </div>
  )
}
