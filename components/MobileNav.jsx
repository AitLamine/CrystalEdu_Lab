'use client'

export default function MobileNav({ activeTab, onTab, t, onOpenDrawer }) {
  const tabs = [
    { id: 'struct',   icon: '⬡', label: t('tabStruct').split(' ')[0] },
    { id: 'miller',   icon: '⊞', label: t('tabMillerShort') },
    { id: 'symmetry', icon: '⚛', label: t('tabSymmetry') },
    { id: 'gallery',  icon: '⊟', label: t('tabGalleryShort') },
    { id: 'controls', icon: '☰', label: t('labelControls') },
  ]

  return (
    <nav className="mobile-nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`mobile-nav-btn${activeTab === tab.id ? ' active' : ''}`}
          onClick={() => {
            if (tab.id === 'controls') {
              onOpenDrawer()
            } else {
              onTab(tab.id)
            }
          }}
        >
          <span className="icon">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
