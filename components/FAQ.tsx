'use client'

import { useState } from 'react'

const faqs = [
  {
    question: 'Do I own my website?',
    answer:
      'Yes, completely. Everything we build is yours. Your domain, your content, and your website files belong to you. If you ever decide to leave, we will hand everything over without question.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes. There are no long-term contracts. You can cancel your monthly subscription at any time and your site will remain active through the end of the billing period.',
  },
  {
    question: 'How long does it take to get my site built?',
    answer:
      'Most websites are ready for your review within 48 hours of submitting your intake form. More complex projects with many pages or custom features may take a bit longer, and we will let you know upfront.',
  },
  {
    question: 'What if I want changes after my site is live?',
    answer:
      'Unlimited change requests are included on all plans. Just log in to your dashboard, describe what you want updated, and our team will handle it, typically within 24 to 48 hours.',
  },
  {
    question: 'Do I need to buy a domain?',
    answer:
      'No. Domain registration and hosting are included on every plan. We take care of the technical setup so you never have to think about it.',
  },
  {
    question: 'What happens after I submit the intake form?',
    answer:
      'Our team reviews your submission and builds a fully custom website based on your answers. You will receive an email with a preview link within 48 hours so you can review and approve before anything goes live.',
  },
  {
    question: 'Do you work with any type of business?',
    answer:
      'We work with local and service-based businesses of all kinds. Restaurants, law firms, gyms, salons, contractors, medical practices, real estate agents, and more. If you serve customers, we can help you grow online.',
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
            Support
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
                        stroke="#00ff88"
                        strokeWidth="2"
                        strokeLinecap="round"
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
