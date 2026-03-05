'use client'

import { useState, useRef, useEffect } from 'react'

interface Props { sessionId: string }
interface Message { role: 'user' | 'assistant'; content: string }
interface BusinessContext { businessName: string; hours: string; services: string; faqs: string }

export default function WebsiteChatbot({ sessionId }: Props) {
  const [businessName, setBusinessName] = useState('')
  const [hours, setHours] = useState('')
  const [services, setServices] = useState('')
  const [faqs, setFaqs] = useState('')
  const [configured, setConfigured] = useState(false)
  const [context, setContext] = useState<BusinessContext | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleConfigure = (e: React.FormEvent) => {
    e.preventDefault()
    const ctx = { businessName, hours, services, faqs }
    setContext(ctx)
    setConfigured(true)
    setMessages([{ role: 'assistant', content: `Hi! I am the virtual assistant for ${businessName}. How can I help you today?` }])
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending || !context) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages); setInput(''); setSending(true); setError('')
    try {
      const res = await fetch('/api/demo/chatbot', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, messages: updatedMessages, businessContext: context }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setMessages((prev) => [...prev, { role: 'assistant', content: data.result.reply }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setSending(false) }
  }

  const inputClass = 'w-full bg-[#0e2030] border border-[#2d4052] text-[#f0f0f0] rounded px-4 py-3 font-mono text-sm placeholder:text-[#3a5570] focus:outline-none focus:border-[#5a7a9a] transition-colors'

  return (
    <div className="space-y-8">
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <p className="font-mono text-xs tracking-widest uppercase mb-1" style={{ color: '#8ab4cc' }}>Chatbot Setup</p>
            <h2 className="font-heading text-2xl text-primary">Configure Your Chatbot</h2>
          </div>
          {configured && <span className="font-mono text-xs border border-[#4ade80]/30 text-[#4ade80] px-3 py-1 rounded">Live</span>}
        </div>
        <div className="p-6">
          <form onSubmit={handleConfigure} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Business Name</label>
                <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Riverside Auto Repair" required className={inputClass} disabled={configured} />
              </div>
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Business Hours</label>
                <input type="text" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Mon-Fri 8am-6pm, Sat 9am-3pm" required className={inputClass} disabled={configured} />
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Services Offered</label>
              <textarea value={services} onChange={(e) => setServices(e.target.value)} placeholder="Oil changes, brake service, tire rotation, engine diagnostics, transmission repair" required rows={2} className={`${inputClass} resize-none`} disabled={configured} />
            </div>
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Top FAQs</label>
              <textarea value={faqs} onChange={(e) => setFaqs(e.target.value)} placeholder="How much is an oil change? ($49.99) Do you take walk-ins? (Yes) Do you work on European cars? (Yes)" required rows={3} className={`${inputClass} resize-none`} disabled={configured} />
            </div>
            {!configured ? (
              <button type="submit" className="font-mono text-sm px-6 py-3 rounded tracking-wider transition-opacity hover:opacity-80" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
                Configure and Launch Chatbot
              </button>
            ) : (
              <button type="button" onClick={() => { setConfigured(false); setMessages([]) }} className="font-mono text-xs border border-[#2d4052] text-muted px-4 py-2 rounded hover:border-[#4a6070] hover:text-primary transition-all">
                Reconfigure
              </button>
            )}
          </form>
        </div>
      </div>

      {configured && context && (
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <div className="bg-card border border-border rounded overflow-hidden shadow-lg">
              <div className="px-4 py-3 bg-[#0e2030] border-b border-border flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-[#162334] border border-[#2d4052] flex items-center justify-center font-heading text-sm text-primary">
                    {context.businessName[0]}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#4ade80] border-2 border-card" />
                </div>
                <div>
                  <div className="font-mono text-sm text-primary">{context.businessName}</div>
                  <div className="font-mono text-xs text-[#4ade80]">Online now</div>
                </div>
              </div>

              <div className="h-80 overflow-y-auto p-4 space-y-3 bg-[#0e2030]">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'rounded-br-none text-[#f0f0f0]'
                        : 'bg-card border border-border text-primary rounded-bl-none'
                    }`} style={msg.role === 'user' ? { backgroundColor: '#000000' } : {}}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-card border border-border px-3 py-2 rounded-lg rounded-bl-none flex items-center gap-1">
                      {[0, 150, 300].map((delay) => <span key={delay} className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: `${delay}ms` }} />)}
                    </div>
                  </div>
                )}
                {error && <div className="font-mono text-xs text-red-300 text-center">{error}</div>}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSend} className="p-3 border-t border-border bg-card flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask something..."
                  disabled={sending}
                  className="flex-1 bg-[#0e2030] border border-[#2d4052] text-[#f0f0f0] rounded px-3 py-2 font-mono text-sm placeholder:text-dim focus:outline-none focus:border-[#5a7a9a] transition-colors"
                />
                <button type="submit" disabled={sending || !input.trim()} className="px-4 py-2 rounded font-mono text-sm transition-opacity disabled:opacity-40 hover:opacity-80" style={{ backgroundColor: '#000000', color: '#f0f0f0' }}>
                  Send
                </button>
              </form>
            </div>
            <p className="font-mono text-xs text-dim text-center mt-3">Mantis Tech Chatbot</p>
          </div>
        </div>
      )}

      <p className="font-mono text-xs text-dim text-center">
        This chatbot is fully functional. The full version embeds directly on your website with your branding and connects to your booking system.
      </p>
    </div>
  )
}
