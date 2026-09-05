'use client'
import { useState } from 'react'

const FORMSPREE = 'https://formspree.io/f/xzdjdnyb'

export default function FeedbackModal({ open, onClose, t }) {
  const [name, setName]             = useState('')
  const [email, setEmail]           = useState('')
  const [message, setMessage]       = useState('')
  const [rating, setRating]         = useState(0)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (submitting) return
    if (!message.trim()) { setError(t('fbErrEmpty')); return }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(FORMSPREE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: name || '(anonymous)',
          // Formspree validates a present "email" field as an actual email address
          // and rejects the whole submission with a 422 otherwise — omit the key
          // entirely (rather than a placeholder string) when none was given.
          email: email || undefined,
          rating: rating ? `${rating}/5` : '(not rated)',
          message,
        }),
      })
      if (!res.ok) { setError(t('fbErrServer')); return }
      setSuccess(true)
      setName(''); setEmail(''); setMessage(''); setRating(0)
    } catch {
      setError(t('fbErrNetwork'))
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    setError('')
    setSuccess(false)
    onClose()
  }

  if (!open) return null

  return (
    <div className="feedback-overlay open" onClick={e => { if (e.target === e.currentTarget) handleClose() }}>
      <div className="feedback-modal">
        <div className="fm-header">
          <span className="fm-title">{t('fbTitle')}</span>
          <button className="fm-close" onClick={handleClose}>✕</button>
        </div>
        <p className="fm-desc">{t('fbDesc')}</p>

        {!success ? (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
              <div style={{ flex: 1 }}>
                <span className="ctrl-label" style={{ marginTop: 0 }}>{t('fbName')} <span style={{ color: 'var(--dim)', fontSize: '0.65rem', textTransform: 'none' }}>{t('fbOptional')}</span></span>
                <input className="fm-input" type="text" placeholder={t('fbNamePlaceholder')} value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <span className="ctrl-label" style={{ marginTop: 0 }}>{t('fbEmail')} <span style={{ color: 'var(--dim)', fontSize: '0.65rem', textTransform: 'none' }}>{t('fbOptional')}</span></span>
                <input className="fm-input" type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <span className="ctrl-label">{t('fbRating')}</span>
            <div className="mode-toggle" style={{ marginBottom: 8 }}>
              {[1,2,3,4,5].map(i => (
                <button key={i} className={`mode-btn${rating >= i ? ' active' : ''}`} onClick={() => setRating(i)}>
                  {'★'.repeat(i)}
                </button>
              ))}
            </div>

            <span className="ctrl-label">{t('fbMessage')} <span style={{ color: 'var(--accent)' }}>*</span></span>
            <textarea className="fm-textarea" placeholder={t('fbMessagePlaceholder')} value={message} onChange={e => setMessage(e.target.value)} />

            {error && <div style={{ color: '#ff6b6b', fontSize: '0.72rem', marginTop: 4 }}>{error}</div>}

            <button
              className="btn-action"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ marginTop: 10, borderColor: 'var(--accent)', color: 'var(--accent)', opacity: submitting ? 0.6 : 1, cursor: submitting ? 'default' : 'pointer' }}
            >
              {submitting ? t('fbSending') : t('fbTitle')}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>✓</div>
            <div style={{ color: 'var(--green)', fontFamily: 'Share Tech Mono, monospace', fontSize: '1rem', marginBottom: 6 }}>{t('fbSentTitle')}</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text)', marginBottom: 14 }}>{t('fbThankYou')}</p>
            <button className="btn-action" onClick={() => setSuccess(false)}>{t('fbSendAnother')}</button>
          </div>
        )}
      </div>
    </div>
  )
}
