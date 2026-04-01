const services = [
  {
    title: 'Weather Activation System',
    description:
      'When a heat wave or cold snap is forecast for your service area, your platform activates automatically. Ads go live. Your customer list gets a text. Your Google profile updates. Every missed call gets an instant response. You just run the jobs.',
    highlight: true,
  },
  {
    title: 'Missed Call Auto-Reply',
    description:
      'When your phone goes unanswered during a surge, an automatic text goes to the caller within 60 seconds. They stay warm. You stay focused on the job in front of you.',
    highlight: false,
  },
  {
    title: 'Review Management',
    description:
      '91% of homeowners read reviews before calling an HVAC contractor. We automatically request reviews after every completed job, respond to feedback, and keep your Google rating climbing while you work.',
    highlight: false,
  },
  {
    title: 'SEO Optimization',
    description:
      'When a homeowner searches for HVAC repair in your city at 10pm, you need to show up. We continuously optimize your presence so you rank higher in local search and stay there.',
    highlight: false,
  },
  {
    title: 'SMS and Text Marketing',
    description:
      'Reach your entire customer list instantly with a single text. Maintenance reminders, seasonal offers, emergency availability announcements. Direct, personal, and read within minutes.',
    highlight: false,
  },
  {
    title: 'Automated Email Marketing',
    description:
      'Stay in front of past customers between service calls. Seasonal tune-up reminders, system replacement recommendations, and follow-ups that bring customers back before they call someone else.',
    highlight: false,
  },
  {
    title: 'Booking Calendar',
    description:
      'Let homeowners book appointments directly from your website or Google profile around the clock. Automatic confirmation and reminder texts reduce no-shows without you touching the phone.',
    highlight: false,
  },
  {
    title: 'Google Business Profile Management',
    description:
      'Your Google Business Profile is where most homeowners find you first. We keep it updated with posts, photos, accurate hours, and responses to questions so you always look active and available.',
    highlight: false,
  },
  {
    title: 'Custom HVAC Website',
    description:
      'A fast, mobile-optimized website built specifically for HVAC contractors in 48 hours. Designed to rank, built to convert, and connected to every tool in your platform from day one. Included on the Platform Plus plan.',
    highlight: false,
  },
]

export default function ServicesGrid() {
  return (
    <section id="services" className="py-24 px-6 bg-bg border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="mb-14">
          <p className="font-mono text-xs text-accent tracking-widest uppercase mb-3">
            The Platform
          </p>
          <h2 className="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight text-primary">
            Everything Running Before You Wake Up.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.title}
              className={`rounded p-8 border transition-colors duration-200 ${
                service.highlight
                  ? 'bg-card border-accent/40 hover:border-accent/60'
                  : 'bg-card border-border hover:border-border-light'
              }`}
            >
              <h3 className="font-heading text-lg text-primary mb-3">{service.title}</h3>
              <p className="text-sm text-teal leading-relaxed">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
