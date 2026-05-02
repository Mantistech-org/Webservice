'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface LineItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface Invoice {
  id: string
  customer_name: string
  customer_email: string | null
  service_address: string | null
  line_items: LineItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  due_date: string | null
  notes: string | null
  stripe_payment_link: string | null
  status: string
  created_at: string
}

function fmt(n: number | string | null | undefined) {
  const num = parseFloat(String(n ?? 0))
  return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }
  catch { return String(d) }
}

export default function PublicInvoicePage() {
  const { invoiceToken } = useParams<{ invoiceToken: string }>()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!invoiceToken) return
    fetch(`/api/client/invoice/${invoiceToken}`)
      .then(r => r.json())
      .then(data => {
        if (data.invoice) setInvoice(data.invoice)
        else setError(data.error ?? 'Invoice not found')
      })
      .catch(() => setError('Failed to load invoice'))
      .finally(() => setLoading(false))
  }, [invoiceToken])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafaf8' }}>
        <p style={{ fontSize: 14, color: '#6b7280', fontFamily: 'sans-serif' }}>Loading invoice...</p>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafaf8' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 18, fontWeight: 600, color: '#111827', fontFamily: 'sans-serif' }}>Invoice Not Found</p>
          <p style={{ fontSize: 14, color: '#6b7280', marginTop: 8, fontFamily: 'sans-serif' }}>{error || 'This invoice does not exist or has been removed.'}</p>
        </div>
      </div>
    )
  }

  const lineItems: LineItem[] = Array.isArray(invoice.line_items) ? invoice.line_items : []
  const isPaid = invoice.status === 'paid'

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafaf8', padding: '48px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>Invoice</h1>
            {invoice.due_date && (
              <p style={{ fontSize: 14, color: '#6b7280', marginTop: 6 }}>
                Due {fmtDate(invoice.due_date)}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{
              display: 'inline-block',
              fontSize: 12,
              fontWeight: 600,
              padding: '4px 12px',
              borderRadius: 6,
              backgroundColor: isPaid ? 'rgba(0,194,124,0.12)' : 'rgba(124,58,237,0.10)',
              color: isPaid ? '#00C27C' : '#7c3aed',
            }}>
              {isPaid ? 'Paid' : invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Customer Info */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', margin: '0 0 12px' }}>Bill To</p>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#111827', margin: 0 }}>{invoice.customer_name}</p>
          {invoice.customer_email && <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0 0' }}>{invoice.customer_email}</p>}
          {invoice.service_address && <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0 0' }}>{invoice.service_address}</p>}
        </div>

        {/* Line Items */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</th>
                <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Qty</th>
                <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Unit Price</th>
                <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, i) => (
                <tr key={i} style={{ borderBottom: i < lineItems.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                  <td style={{ padding: '14px 20px', fontSize: 14, color: '#111827' }}>{item.description}</td>
                  <td style={{ padding: '14px 20px', fontSize: 14, color: '#6b7280', textAlign: 'right' }}>{item.quantity}</td>
                  <td style={{ padding: '14px 20px', fontSize: 14, color: '#6b7280', textAlign: 'right' }}>{fmt(item.unit_price)}</td>
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 500, color: '#111827', textAlign: 'right' }}>{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ minWidth: 200, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
                <span>Subtotal</span><span>{fmt(invoice.subtotal)}</span>
              </div>
              {parseFloat(String(invoice.tax_rate)) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280' }}>
                  <span>Tax ({invoice.tax_rate}%)</span><span>{fmt(invoice.tax_amount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: '#111827', paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.08)', marginTop: 4 }}>
                <span>Total Due</span><span>{fmt(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', margin: '0 0 8px' }}>Notes</p>
            <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{invoice.notes}</p>
          </div>
        )}

        {/* Pay Button */}
        {!isPaid && invoice.stripe_payment_link && (
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <a
              href={invoice.stripe_payment_link}
              style={{
                display: 'inline-block',
                backgroundColor: '#00C27C',
                color: '#ffffff',
                padding: '16px 40px',
                borderRadius: 10,
                fontSize: 16,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Pay Now — {fmt(invoice.total)}
            </a>
            {invoice.due_date && (
              <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 12 }}>Due by {fmtDate(invoice.due_date)}</p>
            )}
          </div>
        )}

        {isPaid && (
          <div style={{ textAlign: 'center', marginTop: 32, padding: 20, backgroundColor: 'rgba(0,194,124,0.08)', borderRadius: 10, border: '1px solid rgba(0,194,124,0.2)' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#00C27C', margin: 0 }}>Payment Received — Thank you!</p>
          </div>
        )}

      </div>
    </div>
  )
}
