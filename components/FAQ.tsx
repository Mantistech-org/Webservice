'use client'

import { useState } from 'react'

const faqs = [
  {
    question: 'What exactly is the Weather Activation System?',
    answer:
      'We monitor National Weather Service forecasts for your service area around the clock. When a significant temperature event is detected — a heat wave, hard freeze, or rapid temperature drop — your platform activates automatically. Your ads go live, your past customer list receives a text, your Google Business Profile updates, and any missed calls receive an instant text response. You do not have to do anything.',
  },
  {
    question: 'How quickly does everything go live?',
    answer:
      'Platform Only customers are typically live within 48 hours of submitting the intake form. Platform Plus customers have their custom HVAC website built and connected within the same 48-hour window.',
  },
  {
    question: 'Do I need to have a website already to use Platform Only?',
    answer:
      'No, our tools work with or without your current website.',
  },
  {
    question: 'How does the missed call auto-reply work?',
    answer:
      'When your phone goes unanswered, the caller receives an automatic text within 60 seconds letting them know you received their call and will be in touch shortly. This keeps the lead warm and significantly reduces the chance they call someone else before you get back to them.',
  },
  {
    question: 'How does the review system work?',
    answer:
      'After a job is completed, the platform automatically sends a review request to the homeowner. We also monitor your Google reviews and respond to incoming feedback on your behalf. You review and approve responses before they go out, or you can enable auto-responses for straightforward feedback.',
  },
  {
    question: 'Is there a contract or long-term commitment?',
    answer:
      'No. Both plans are month-to-month. You can cancel at any time and your platform will remain active through the end of your billing period.',
  },
  {
    question: 'What does the free consultation involve?',
    answer:
      'It is a 15-minute call. We take a look at your current online presence before the call so we can show you exactly what we would do differently for your business. No pressure, no pitch deck. Just an honest look at where you stand and what the platform would do for you specifically.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index))
  }

  return (
    <section className="bg-bg py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-12 text-center">
          <p className="font-mono text-xs text-accent tracking-widest uppercase mb-4">
            Questions
          </p>
          <h2 className="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight text-primary">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="divide-y divide-border">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div key={index}>
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="w-full flex items-center justify-between gap-6 py-5 text-left group"
                  aria-expanded={isOpen}
                >
                  <span className="text-base text-primary leading-snug group-hover:text-accent transition-colors duration-200">
                    {faq.question}
                  </span>
                  <span
                    className="shrink-0 w-6 h-6 rounded-full border border-border flex items-center justify-center transition-all duration-200 group-hover:border-accent"
                    aria-hidden="true"
                  >
                    {isOpen ? (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="text-accent"
                      >
                        <line x1="1" y1="6" x2="11" y2="6" />
                      </svg>
                    ) : (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="text-muted group-hover:text-accent transition-colors duration-200"
                      >
                        <line x1="6" y1="1" x2="6" y2="11" />
                        <line x1="1" y1="6" x2="11" y2="6" />
                      </svg>
                    )}
                  </span>
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="pb-5 text-sm text-muted leading-relaxed pr-10">
                    {faq.answer}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
