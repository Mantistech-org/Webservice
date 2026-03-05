'use client'

import { useState, useRef, useEffect } from 'react'

interface Props { sessionId: string }

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface BusinessContext {
  businessName: string
  hours: string
  services: string
  faqs: string
}

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleConfigure = (e: React.FormEvent) => {
    e.preventDefault()
    const ctx = { businessName, hours, services, faqs }
    setContext(ctx)
    setConfigured(true)
    setMessages([
      {
        role: 'assistant',
        content: `Hi! I am the virtual assistant for ${businessName}. How can I help you today?`,
      },
    ])
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending || !context) return

    const userMsg: Message = { role: 'user', content: input.trim() }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setSending(true)
    setError('')

    try {
      const res = await fetch('/api/demo/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          messages: updatedMessages,
          businessContext: context,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setMessages((prev) => [...prev, { role: 'assistant', content: data.result.reply }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Config form */}
      <div className="bg-card border border-border rounded">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <p className="font-mono text-xs text-accent tracking-widest uppercase mb-1">Chatbot Setup</p>
            <h2 className="font-heading text-2xl text-primary">Configure Your Chatbot</h2>
          </div>
          {configured && (
            <span className="font-mono text-xs text-accent border border-accent/30 bg-accent/5 px-3 py-1 rounded">Live</span>
          )}
        </div>
        <div className="p-6">
          <form onSubmit={handleConfigure} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Business Name</label>
                <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Riverside Auto Repair" required className="form-input" disabled={configured} />
              </div>
              <div>
                <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Business Hours</label>
                <input type="text" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Mon-Fri 8am-6pm, Sat 9am-3pm, Closed Sunday" required className="form-input" disabled={configured} />
              </div>
            </div>
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Services Offered</label>
              <textarea value={services} onChange={(e) => setServices(e.target.value)} placeholder="Oil changes, brake service, tire rotation, engine diagnostics, transmission repair, AC service" required rows={2} className="form-input resize-none" disabled={configured} />
            </div>
            <div>
              <label className="font-mono text-xs text-muted tracking-widest uppercase block mb-2">Top FAQs</label>
              <textarea value={faqs} onChange={(e) => setFaqs(e.target.value)} placeholder="How much does an oil change cost? ($49.99) Do you accept walk-ins? (Yes, but appointments get priority) Do you work on European cars? (Yes)" required rows={3} className="form-input resize-none" disabled={configured} />
            </div>
            {!configured && (
              <button type="submit" className="bg-accent text-black font-mono text-sm px-6 py-3 rounded tracking-wider hover:opacity-90 transition-opacity">
                Configure and Launch Chatbot
              </button>
            )}
            {configured && (
              <button
                type="button"
                onClick={() => { setConfigured(false); setMessages([]) }}
                className="font-mono text-xs border border-border text-muted px-4 py-2 rounded hover:border-accent hover:text-accent transition-all"
              >
                Reconfigure
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Chat window */}
      {configured && context && (
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <div className="bg-card border border-border rounded overflow-hidden shadow-lg">
              {/* Chat header */}
              <div className="px-4 py-3 bg-bg border-b border-border flex items-center gap-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center font-heading text-sm text-accent">
                    {context.businessName[0]}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent border-2 border-card" />
                </div>
                <div>
                  <div className="font-mono text-sm text-primary">{context.businessName}</div>
                  <div className="font-mono text-xs text-accent">Online now</div>
                </div>
              </div>

              {/* Messages */}
              <div className="h-80 overflow-y-auto p-4 space-y-3 bg-bg">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-lg text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-accent text-black rounded-br-none'
                          : 'bg-card border border-border text-primary rounded-bl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="bg-card border border-border px-3 py-2 rounded-lg rounded-bl-none flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                {error && (
                  <div className="font-mono text-xs text-red-400 text-center">{error}</div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-3 border-t border-border bg-card flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask something..."
                  disabled={sending}
                  className="flex-1 bg-bg border border-border text-primary rounded px-3 py-2 font-mono text-sm placeholder:text-dim focus:outline-none focus:border-accent transition-colors"
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="bg-accent text-black px-4 py-2 rounded font-mono text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  Send
                </button>
              </form>
            </div>
            <p className="font-mono text-xs text-dim text-center mt-3">
              Powered by Mantis Tech AI
            </p>
          </div>
        </div>
      )}

      <p className="font-mono text-xs text-dim text-center">
        This chatbot is fully functional and powered by real AI. The full version embeds directly on your website with your branding and connects to your booking system.
      </p>
    </div>
  )
}
