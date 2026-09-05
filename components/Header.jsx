'use client'
export default function Header({ lang, autoRot, theme = 'dark', onToggleLang, onToggleAutoRot, onToggleTheme, t }) {
  return (
    <header className="header">
      <div className="header-dot" />
      <h1>CrystalEdu Lab</h1>
      <div className="header-dot" style={{ background: 'var(--accent2)' }} />
      <div style={{ flex: 1 }} />
      <button
        className="btn-action"
        onClick={onToggleLang}
        style={{ width: 'auto', marginTop: 0, padding: '5px 12px', fontSize: '0.68rem' }}
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
      {/* Icon only (no text label) to save width on narrow screens — the
          sun/moon symbol alone is understood, and the full translated
          label is still exposed via title/aria-label for accessibility. */}
      <button
        className="btn-action"
        onClick={onToggleTheme}
        title={theme === 'dark' ? t('themeLight') : t('themeDark')}
        aria-label={theme === 'dark' ? t('themeLight') : t('themeDark')}
        style={{ width: 'auto', marginTop: 0, padding: '5px 10px', fontSize: '0.68rem' }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </header>
  )
}
