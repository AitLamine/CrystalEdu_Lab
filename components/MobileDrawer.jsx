'use client'

export default function MobileDrawer({ open, onClose, children, t }) {
  if (!open) return null
  return (
    <div className="mobile-drawer open">
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer-panel">
        <div className="drawer-header">
          <span>{t('labelControls')}</span>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
