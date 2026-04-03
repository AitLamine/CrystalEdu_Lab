'use client'
export default function Footer({ onOpenFeedback }) {
  return (
    <footer className="app-footer">
      <div className="footer-left">
        <span className="footer-dev">Developed by <strong>Lahcen Ait Lamine</strong></span>
        <span className="footer-dot" />
        <span className="footer-version">CrystalEdu Lab · 2026</span>
      </div>
      <button className="footer-feedback-btn" onClick={onOpenFeedback}>
        ✉ Feedback
      </button>
    </footer>
  )
}
