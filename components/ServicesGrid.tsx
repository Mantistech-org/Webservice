import { ADDONS } from '@/types'

const ICONS: Record<string, string> = {
  'review-management': '⭐',
  'social-media-automation': '📱',
  'lead-generation': '🎯',
  'seo-optimization': '🔍',
  'ecommerce-automation': '🛒',
  'ad-creative-generation': '🎨',
  'website-chatbot': '💬',
  'email-marketing': '📧',
  'email-with-domain': '📨',
}

export default function ServicesGrid() {
  return (
    <section id="services" className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <div className="font-mono text-xs text-accent tracking-widest uppercase mb-4">
            Our Services
          </div>
          <h2 className="font-heading text-[clamp(2.5rem,6vw,4.5rem)] leading-tight text-white">
            Everything Your
            <br />
            <span className="text-teal">Business Needs</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {ADDONS.map((service) => (
            <div
              key={service.id}
              className="group bg-bg p-8 hover:bg-card transition-colors duration-300 cursor-default"
            >
              <div className="text-4xl mb-5 group-hover:scale-110 transition-transform duration-300 origin-left">
                {ICONS[service.id] ?? '✦'}
              </div>
              <h3 className="font-heading text-2xl text-white mb-3 group-hover:text-accent transition-colors">
                {service.label}
              </h3>
              <p className="text-sm text-muted leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
