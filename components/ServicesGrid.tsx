import { ADDONS } from '@/types'

export default function ServicesGrid() {
  return (
    <section id="services" className="py-24 px-6 bg-card border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14">
          <p className="font-mono text-xs text-accent tracking-widest uppercase mb-3">
            Our Services
          </p>
          <h2 className="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight text-primary">
            Everything Your Business Needs
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Booking Calendar — included free on all plans */}
          <div className="bg-card border border-accent/30 rounded p-8 hover:border-accent/50 transition-colors duration-200 relative">
            <span className="absolute top-4 right-4 font-mono text-xs text-[#16a34a] border border-[#16a34a]/40 bg-[#16a34a]/5 px-2 py-0.5 rounded">
              Included Free
            </span>
            <h3 className="font-heading text-lg text-primary mb-3">Booking Calendar</h3>
            <p className="text-sm text-teal leading-relaxed">An automated booking calendar that lets customers schedule appointments directly from your website with automatic confirmation emails. Included free on all plans.</p>
          </div>

          {ADDONS.map((service) => (
            <div
              key={service.id}
              className="bg-card border border-border rounded p-8 hover:border-border-light transition-colors duration-200"
            >
              <h3 className="font-heading text-lg text-primary mb-3">{service.label}</h3>
              <p className="text-sm text-teal leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
