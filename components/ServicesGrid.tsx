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
