export default function BeforeAfter() {
  return (
    <section className="py-24 px-6 bg-card border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="mb-14 text-center">
          <h2 className="font-heading text-[clamp(2rem,5vw,3.5rem)] leading-tight text-primary">
            Before Mantis Tech. After Mantis Tech.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before */}
          <div className="bg-bg border border-border rounded p-10">
            <div className="font-mono text-xs text-muted tracking-widest uppercase mb-6">Before</div>
            <div className="space-y-5">
              <p className="text-base text-teal leading-relaxed">
                It is 9pm on a Tuesday. The forecast shows 97 degrees tomorrow.
              </p>
              <p className="text-base text-teal leading-relaxed">
                Your phone rings twice while you are under a crawlspace. You miss both.
              </p>
              <p className="text-base text-teal leading-relaxed">
                By the time you call back the first homeowner already booked someone else. The second one never answers.
              </p>
              <p className="text-base text-teal leading-relaxed">
                You wake up Wednesday to a full voicemail and no idea how many jobs you lost overnight.
              </p>
            </div>
          </div>

          {/* After */}
          <div className="bg-green-panel border border-green-border rounded p-10">
            <div className="font-mono text-xs text-accent tracking-widest uppercase mb-6">After</div>
            <div className="space-y-5">
              <p className="text-base text-teal leading-relaxed">
                It is 9pm on a Tuesday. The forecast shows 97 degrees tomorrow. Mantis Tech already saw it coming.
              </p>
              <p className="text-base text-teal leading-relaxed">
                Your ads activated. Your customer list got a text. Every missed call got a response in under 60 seconds.
              </p>
              <p className="text-base text-primary leading-relaxed font-medium">
                You did not do any of it.
              </p>
              <p className="text-base text-teal leading-relaxed">
                You wake up Wednesday to a full schedule.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
