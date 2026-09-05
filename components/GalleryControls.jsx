'use client'

export default function GalleryControls({ t, galleryCellSize, onCellChange }) {
  return (
    <div id="ctrl-gallery" className="controls active">
      <span className="ctrl-label" style={{ marginTop: 6 }}>{t('gallerySectionTitle')}</span>
      <p style={{ fontSize: '0.72rem', color: 'var(--dim)', marginTop: 4, lineHeight: 1.5 }}>
        {t('galleryDesc')}
      </p>

      <span className="ctrl-label">{t('labelCellRep')}</span>
      <div className="mode-toggle">
        {[1, 2, 3].map(n => (
          <button
            key={n}
            className={`mode-btn${galleryCellSize === n ? ' active' : ''}`}
            onClick={() => onCellChange(n)}
          >
            {n}×{n}×{n}
          </button>
        ))}
      </div>
    </div>
  )
}
