'use client'
import { STRUCTS } from '@/lib/structs';

export default function StructControls({
  t, structKey, cellSize, showBonds, renderMode,
  onStructChange, onCellSize, onBonds, onRenderMode,
  structInfo,
}) {
  const infoRows = structInfo?.rows || [];
  const legendEntries = structInfo?.legend || [];

  const formatColor = (c) => {
    if (!c && c !== 0) return '#000';
    if (typeof c === 'number') return `#${c.toString(16).padStart(6,'0')}`;
    if (typeof c === 'string') return c;
    return '#000';
  };
  // Keep concise tree and include any newly added structures automatically
  const groups = {
    groupCubic: ['sc', 'bcc', 'fcc'],
    groupTetra: ['tet_p', 'tet_i'],
    groupOrtho: ['ort_p', 'ort_i', 'ort_f', 'ort_c'],
    groupHexa: ['hex_p'],
    groupTrig: ['rho_r'],
    groupMono: ['mon_p', 'mon_c'],
    groupTricl: ['tri_p'],
    groupIonic: ['hcp', 'cscl', 'nacl', 'zns', 'caf2', 'diamond'],
  };

  const remainingKeys = Object.keys(STRUCTS).filter(key => !Object.values(groups).flat().includes(key));
  return (
    <div id="ctrl-struct" className="controls active">
      <span className="ctrl-label">{t('labelStructure')}</span>
      <select value={structKey} onChange={e => onStructChange(e.target.value)}>
        {Object.entries(groups).map(([groupKey, keys]) => (
          <optgroup key={groupKey} label={t(groupKey)}>
            {keys.map(key => (
              <option key={key} value={key}>{STRUCTS[key]?.name || key}</option>
            ))}
          </optgroup>
        ))}
        {remainingKeys.length > 0 && (
          <optgroup label={t('groupOther') || 'Other'}>
            {remainingKeys.map(key => (
              <option key={key} value={key}>{STRUCTS[key]?.name || key}</option>
            ))}
          </optgroup>
        )}
      </select>

      <span className="ctrl-label">{t('labelSupercell')}</span>
      <div className="mode-toggle">
        {[1,2,3].map(n => (
          <button key={n} className={`mode-btn${cellSize===n?' active':''}`} onClick={() => onCellSize(n)}>{n}×{n}×{n}</button>
        ))}
      </div>

      <span className="ctrl-label">{t('labelBonds')}</span>
      <div className="mode-toggle">
        <button className={`mode-btn${showBonds?' active':''}`} onClick={() => onBonds(true)}>{t('bondsOn')}</button>
        <button className={`mode-btn${!showBonds?' active':''}`} onClick={() => onBonds(false)}>{t('bondsOff')}</button>
      </div>

      <span className="ctrl-label">{t('labelRenderMode')}</span>
      <div className="mode-toggle">
        <button className={`mode-btn${renderMode==='bs'?' active':''}`} onClick={() => onRenderMode('bs')}>{t('modeBallStick')}</button>
        <button className={`mode-btn${renderMode==='cpk'?' active':''}`} onClick={() => onRenderMode('cpk')}>{t('modeCPK')}</button>
      </div>

      {infoRows.length > 0 && (
        <div className="info-card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {infoRows.map(([label, value]) => (
                <tr key={label}>
                  <td style={{ padding: '3px 4px', fontWeight: 600, width: '40%' }}>{label}</td>
                  <td style={{ padding: '3px 4px' }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {legendEntries.length > 0 && (
        <div className="legend" style={{ marginTop: 8 }}>
          {legendEntries.map(([label, color]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: formatColor(color), display: 'inline-block', marginRight: 6, border: '1px solid var(--border)' }} />
              <span style={{ fontSize: '0.85rem' }}>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
