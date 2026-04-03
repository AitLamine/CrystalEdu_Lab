'use client'

export default function GalleryControls({ t, galleryCellSize, onCellSize }) {
  return (
    <div id="ctrl-gallery" className="controls active">
      <span className="ctrl-label" style={{ marginTop: 6 }}>{t('gallerySectionTitle')}</span>
      <p style={{ fontSize: '0.72rem', color: 'var(--dim)', marginTop: 4, lineHeight: 1.5 }}>
        {t('galleryDesc')}
      </p>
    </div>
  )
}
