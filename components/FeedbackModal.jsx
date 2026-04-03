'use client'
import { useState } from 'react'

const FORMSPREE = 'https://formspree.io/f/xzdjdnyb'

export default function FeedbackModal({ open, onClose, t }) {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [message, setMessage] = useState('')
  const [rating, setRating]   = useState(0)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  function handleSubmit() {
    if (!message.trim()) { setError(t('fbErrEmpty')); return }
    setError('')
    onClose()
    fetch(FORMSPREE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: name || '(anonymous)',
        email: email || '(not provided)',
        rating: rating ? `${rating}/5` : '(not rated)',
        message,
      }),
    }).catch(() => {})
    setSuccess(true)
    setTimeout(() => { setSuccess(false); setName(''); setEmail(''); setMessage(''); setRating(0) }, 400)
  }

  if (!open) return null

  return (
    <div className="feedback-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="feedback-modal">
        <div className="fm-header">
          <span className="fm-title">✉ Send Feedback</span>
          <button className="fm-close" onClick={onClose}>✕</button>
        </div>
        <p className="fm-desc">We&apos;d love to hear your thoughts on CrystalEdu Lab.</p>

        {!success ? (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
              <div style={{ flex: 1 }}>
                <span className="ctrl-label" style={{ marginTop: 0 }}>Name <span style={{ color: 'var(--dim)', fontSize: '0.65rem', textTransform: 'none' }}>(optional)</span></span>
                <input className="fm-input" type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <span className="ctrl-label" style={{ marginTop: 0 }}>Email <span style={{ color: 'var(--dim)', fontSize: '0.65rem', textTransform: 'none' }}>(optional)</span></span>
                <input className="fm-input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <span className="ctrl-label">Rating</span>
            <div className="mode-toggle" style={{ marginBottom: 8 }}>
              {[1,2,3,4,5].map(i => (
                <button key={i} className={`mode-btn${rating >= i ? ' active' : ''}`} onClick={() => setRating(i)}>
                  {'★'.repeat(i)}
                </button>
              ))}
            </div>

            <span className="ctrl-label">Message <span style={{ color: 'var(--accent)' }}>*</span></span>
            <textarea className="fm-textarea" placeholder="Your feedback..." value={message} onChange={e => setMessage(e.target.value)} />

            {error && <div style={{ color: '#ff6b6b', fontSize: '0.72rem', marginTop: 4 }}>{error}</div>}

            <button className="btn-action" onClick={handleSubmit} style={{ marginTop: 10, borderColor: 'var(--accent)', color: 'var(--accent)' }}>
              ✉ Send Feedback
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>✓</div>
            <div style={{ color: 'var(--green)', fontFamily: 'Share Tech Mono, monospace', fontSize: '1rem', marginBottom: 6 }}>Sent!</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text)', marginBottom: 14 }}>Thank you for your feedback!</p>
            <button className="btn-action" onClick={() => setSuccess(false)}>Send Another</button>
          </div>
        )}
      </div>
    </div>
  )
}
