import { ADDONS } from '@/types'

export default function Ticker() {
  const services = ADDONS.map((a) => a.label)
  const doubled = [...services, ...services]

  return (
    <div className="relative border-y border-border bg-card overflow-hidden py-4">
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-card to-transparent z-10" />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-card to-transparent z-10" />

      <div className="ticker-track">
        {doubled.map((service, i) => (
          <div
            key={`${service}-${i}`}
            className="flex items-center gap-6 px-6 whitespace-nowrap"
          >
            <span className="font-heading text-xl tracking-widest text-white uppercase">
              {service}
            </span>
            <span className="text-accent text-xl font-heading" aria-hidden>
              //
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
