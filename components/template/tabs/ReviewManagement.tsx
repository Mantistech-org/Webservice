'use client'

import { useState, useEffect } from 'react'

interface Props { clientToken: string }

interface Review {
  id: string
  author: string
  rating: number
  platform: string
  review_text: string | null
  review_date: string
}

interface ReviewRequest {
  id: string
  customer_name: string
  phone: string | null
  email: string | null
  method: string
  status: string
  sent_at: string
}

type SubTab = 'reviews' | 'send' | 'history'

const CARD: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid rgba(0,0,0,0.06)',
  borderRadius: 12,
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#00C27C',
  fontWeight: 600,
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 14,
  color: '#111827',
  border: '1px solid rgba(0,0,0,0.12)',
  borderRadius: 8,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  backgroundColor: '#ffffff',
}

function Stars({ n, onClick }: { n: number; onClick?: (rating: number) => void }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="14" height="14" viewBox="0 0 24 24"
          fill={i < n ? '#F59E0B' : 'none'}
          stroke={i < n ? '#F59E0B' : '#d1d5db'}
          strokeWidth="1.5"
          style={{ cursor: onClick ? 'pointer' : 'default', flexShrink: 0 }}
          onClick={() => onClick?.(i + 1)}
        >
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </span>
  )
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ReviewManagement({ clientToken }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('reviews')

  // Reviews tab
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalAuthor, setModalAuthor] = useState('')
  const [modalRating, setModalRating] = useState(5)
  const [modalPlatform, setModalPlatform] = useState('google')
  const [modalText, setModalText] = useState('')
  const [modalDate, setModalDate] = useState(new Date().toISOString().split('T')[0])
  const [modalSubmitting, setModalSubmitting] = useState(false)

  // Send Request tab
  const [reqName, setReqName] = useState('')
  const [reqPhone, setReqPhone] = useState('')
  const [reqEmail, setReqEmail] = useState('')
  const [reqMethod, setReqMethod] = useState<'sms' | 'email'>('sms')
  const [reqSubmitting, setReqSubmitting] = useState(false)
  const [reqSuccess, setReqSuccess] = useState(false)

  // Request History tab
  const [requests, setRequests] = useState<ReviewRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  useEffect(() => {
    if (!clientToken) { setReviewsLoading(false); return }
    fetch(`/api/client/${clientToken}/reviews`)
      .then(r => r.json())
      .then(data => { if (data.reviews) setReviews(data.reviews) })
      .catch(() => {})
      .finally(() => setReviewsLoading(false))
  }, [clientToken])

  useEffect(() => {
    if (subTab !== 'history' || historyLoaded || !clientToken) return
    setRequestsLoading(true)
    setHistoryLoaded(true)
    fetch(`/api/client/${clientToken}/review-requests`)
      .then(r => r.json())
      .then(data => { if (data.requests) setRequests(data.requests) })
      .catch(() => {})
      .finally(() => setRequestsLoading(false))
  }, [subTab, historyLoaded, clientToken])

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    setModalSubmitting(true)
    try {
      const res = await fetch(`/api/client/${clientToken}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: modalAuthor,
          rating: modalRating,
          platform: modalPlatform,
          review_text: modalText || undefined,
          review_date: modalDate,
        }),
      })
      const data = await res.json()
      if (data.review) {
        setReviews(prev => [data.review, ...prev])
        setModalOpen(false)
        setModalAuthor('')
        setModalRating(5)
        setModalPlatform('google')
        setModalText('')
        setModalDate(new Date().toISOString().split('T')[0])
      }
    } catch {}
    setModalSubmitting(false)
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault()
    setReqSubmitting(true)
    try {
      const res = await fetch(`/api/client/${clientToken}/review-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: reqName,
          phone: reqPhone || undefined,
          email: reqEmail || undefined,
          method: reqMethod,
        }),
      })
      const data = await res.json()
      if (data.request) {
        setRequests(prev => [data.request, ...prev])
        setReqSuccess(true)
        setReqName('')
        setReqPhone('')
        setReqEmail('')
        setReqMethod('sms')
      }
    } catch {}
    setReqSubmitting(false)
  }

  const totalReviews = reviews.length
  const avgRating = totalReviews
    ? reviews.reduce((s, r) => s + r.rating, 0) / totalReviews
    : 0
  const breakdown = [5, 4, 3, 2, 1].map(n => ({
    n,
    count: reviews.filter(r => r.rating === n).length,
  }))

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '12px 20px',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    color: active ? '#111827' : '#6b7280',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid #111827' : '2px solid transparent',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    marginBottom: -1,
    fontFamily: 'inherit',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Sub-tabs */}
      <div style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex' }}>
        <button onClick={() => setSubTab('reviews')} style={tabStyle(subTab === 'reviews')}>Reviews</button>
        <button onClick={() => setSubTab('send')} style={tabStyle(subTab === 'send')}>Send Request</button>
        <button onClick={() => setSubTab('history')} style={tabStyle(subTab === 'history')}>Request History</button>
      </div>

      {/* ── Reviews Tab ── */}
      {subTab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stat card */}
          {totalReviews > 0 && (
            <div style={{ ...CARD, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ ...LABEL_STYLE, marginBottom: 8, marginTop: 0 }}>Average Rating</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Stars n={Math.round(avgRating)} />
                    <span style={{ fontSize: 28, fontWeight: 700, color: '#111827', lineHeight: 1 }}>
                      {avgRating.toFixed(1)}
                    </span>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>
                      {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
                  {breakdown.map(({ n, count }) => (
                    <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#6b7280', width: 38, flexShrink: 0 }}>{n} star</span>
                      <div style={{ flex: 1, height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: totalReviews ? `${(count / totalReviews) * 100}%` : '0%',
                          backgroundColor: '#F59E0B',
                          borderRadius: 3,
                        }} />
                      </div>
                      <span style={{ fontSize: 12, color: '#6b7280', width: 16, textAlign: 'right', flexShrink: 0 }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ ...LABEL_STYLE, margin: 0 }}>All Reviews</p>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                padding: '8px 18px', fontSize: 13, fontWeight: 600,
                backgroundColor: '#111827', color: '#ffffff',
                border: 'none', borderRadius: 8, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Add Review
            </button>
          </div>

          {/* List */}
          {reviewsLoading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 14, color: '#9ca3af' }}>Loading...</div>
          ) : reviews.length === 0 ? (
            <div style={{ ...CARD, padding: 32, textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>
                No reviews yet. Send review requests to your customers to start collecting feedback.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {reviews.map((r) => (
                <div key={r.id} style={{ ...CARD, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{r.author}</span>
                        <Stars n={r.rating} />
                        <span style={{
                          fontSize: 11, fontWeight: 600, color: '#374151',
                          backgroundColor: 'rgba(0,0,0,0.05)',
                          borderRadius: 4, padding: '2px 8px',
                          textTransform: 'capitalize',
                        }}>
                          {r.platform}
                        </span>
                        <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 'auto' }}>
                          {formatDate(r.review_date)}
                        </span>
                      </div>
                      {r.review_text && (
                        <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{r.review_text}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Send Request Tab ── */}
      {subTab === 'send' && (
        <div style={{ ...CARD, padding: 24 }}>
          <p style={{ ...LABEL_STYLE, marginTop: 0, marginBottom: 20 }}>Send a Review Request</p>

          {reqSuccess ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#00C27C', marginBottom: 8 }}>
                Request sent successfully.
              </div>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
                The customer will receive a review request via {reqMethod === 'sms' ? 'SMS' : 'email'}.
              </p>
              <button
                onClick={() => setReqSuccess(false)}
                style={{
                  padding: '8px 20px', fontSize: 13, fontWeight: 600,
                  backgroundColor: '#111827', color: '#ffffff',
                  border: 'none', borderRadius: 8, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={submitRequest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  value={reqName}
                  onChange={e => setReqName(e.target.value)}
                  placeholder="Jane Smith"
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={reqPhone}
                  onChange={e => setReqPhone(e.target.value)}
                  placeholder="(614) 555-0100"
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={reqEmail}
                  onChange={e => setReqEmail(e.target.value)}
                  placeholder="jane@example.com"
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 10 }}>
                  Send Via
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['sms', 'email'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setReqMethod(m)}
                      style={{
                        padding: '8px 20px', fontSize: 13,
                        fontWeight: reqMethod === m ? 600 : 400,
                        backgroundColor: reqMethod === m ? '#111827' : 'transparent',
                        color: reqMethod === m ? '#ffffff' : '#6b7280',
                        border: reqMethod === m ? '1px solid #111827' : '1px solid rgba(0,0,0,0.12)',
                        borderRadius: 8, cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {m === 'sms' ? 'SMS' : 'Email'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 10 }}>
                  Message Preview
                </label>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{
                    backgroundColor: '#00C27C', color: '#ffffff',
                    fontSize: 14, lineHeight: 1.6,
                    padding: '10px 14px', borderRadius: '12px 12px 4px 12px',
                    maxWidth: '85%',
                  }}>
                    Hi {reqName || '[Customer Name]'}, thank you for choosing us. We hope your service went well.
                    If you have a moment, we would really appreciate a Google review — it helps families in the
                    area find reliable service: g.page/r/your-business/review
                  </div>
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={reqSubmitting}
                  style={{
                    padding: '10px 24px', fontSize: 13, fontWeight: 600,
                    backgroundColor: '#111827', color: '#ffffff',
                    border: 'none', borderRadius: 8,
                    cursor: reqSubmitting ? 'not-allowed' : 'pointer',
                    opacity: reqSubmitting ? 0.6 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  {reqSubmitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Request History Tab ── */}
      {subTab === 'history' && (
        <div style={{ ...CARD, overflow: 'hidden' }}>
          {requestsLoading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', fontSize: 14, color: '#9ca3af' }}>Loading...</div>
          ) : requests.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>No review requests sent yet.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  {['Customer', 'Method', 'Sent', 'Status'].map(h => (
                    <th
                      key={h}
                      style={{
                        padding: '12px 20px', textAlign: 'left',
                        fontSize: 11, fontWeight: 600, color: '#6b7280',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: i < requests.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                    <td style={{ padding: '14px 20px', fontSize: 14, color: '#111827', fontWeight: 500 }}>{r.customer_name}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#374151', textTransform: 'uppercase' }}>{r.method}</td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#6b7280' }}>
                      {new Date(r.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 600,
                        color: '#00C27C',
                        backgroundColor: 'rgba(0,194,124,0.1)',
                        borderRadius: 4, padding: '3px 10px',
                        textTransform: 'capitalize',
                      }}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Add Review Modal ── */}
      {modalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
          <div style={{
            backgroundColor: '#ffffff', borderRadius: 12,
            padding: 24, width: '100%', maxWidth: 480,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <p style={{ ...LABEL_STYLE, margin: 0 }}>Add Review</p>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  background: 'none', border: 'none', fontSize: 22,
                  color: '#6b7280', cursor: 'pointer', lineHeight: 1,
                  padding: 4, fontFamily: 'inherit',
                }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={submitReview} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Author Name
                </label>
                <input
                  type="text"
                  required
                  value={modalAuthor}
                  onChange={e => setModalAuthor(e.target.value)}
                  placeholder="Jane Smith"
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
                  Star Rating
                </label>
                <Stars n={modalRating} onClick={setModalRating} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Platform
                </label>
                <select
                  value={modalPlatform}
                  onChange={e => setModalPlatform(e.target.value)}
                  style={INPUT_STYLE}
                >
                  <option value="google">Google</option>
                  <option value="yelp">Yelp</option>
                  <option value="facebook">Facebook</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Review Text
                </label>
                <textarea
                  value={modalText}
                  onChange={e => setModalText(e.target.value)}
                  placeholder="Write the review text..."
                  rows={4}
                  style={{ ...INPUT_STYLE, resize: 'vertical' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={modalDate}
                  onChange={e => setModalDate(e.target.value)}
                  style={INPUT_STYLE}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: '8px 16px', fontSize: 13,
                    backgroundColor: 'transparent', color: '#6b7280',
                    border: '1px solid rgba(0,0,0,0.12)', borderRadius: 8,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  style={{
                    padding: '8px 20px', fontSize: 13, fontWeight: 600,
                    backgroundColor: '#111827', color: '#ffffff',
                    border: 'none', borderRadius: 8,
                    cursor: modalSubmitting ? 'not-allowed' : 'pointer',
                    opacity: modalSubmitting ? 0.6 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  {modalSubmitting ? 'Saving...' : 'Save Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
