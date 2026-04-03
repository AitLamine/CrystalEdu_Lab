'use client'
export default function Header({ lang, autoRot, theme = 'dark', sidebarOpen, isCompactMode, isSidebarPinned, onToggleLang, onToggleAutoRot, onToggleTheme, onToggleSidebarPin, t }) {
  return (
    <header className="header">
      <div className="header-dot" />
      <h1>CrystalEdu Lab</h1>
      <div className="header-dot" style={{ background: 'var(--accent2)' }} />
      <div style={{ flex: 1 }} />
      <button
        className="btn-action"
        onClick={onToggleLang}
        style={{ width: 'auto', marginTop: 0, padding: '5px 12px', fontSize: '0.68rem', marginRight: 6 }}
      >
        {lang === 'en' ? 'FR' : 'EN'}
      </button>
      <button
        className="btn-action"
        onClick={onToggleAutoRot}
        style={{ width: 'auto', marginTop: 0, padding: '5px 12px', fontSize: '0.68rem' }}
      >
        ⟳ {autoRot ? t('autoRotOn') : t('autoRotOff')}
      </button>
      <button
        className="btn-action"
        onClick={onToggleTheme}
        style={{ width: 'auto', marginTop: 0, padding: '5px 12px', fontSize: '0.68rem', marginLeft: 6 }}
      >
        {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
      </button>
      {isCompactMode && (
        <button
          className="btn-action"
          onClick={onToggleSidebarPin}
          style={{ width: 'auto', marginTop: 0, padding: '5px 12px', fontSize: '0.68rem', marginLeft: 6 }}
        >
          {isSidebarPinned ? '📌 Pinned' : '📍 Pin' }
        </button>
      )}
    </header>
  )
}
