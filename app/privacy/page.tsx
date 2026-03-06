import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Privacy Policy | Mantis Tech',
  description:
    'Learn how Mantis Tech collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main className="pt-16 bg-bg min-h-screen">
        <div className="max-w-3xl mx-auto py-24 px-6">
          <div className="mb-12">
            <p className="font-mono text-xs text-accent tracking-widest uppercase mb-4">
              Legal
            </p>
            <h1 className="font-heading text-[clamp(2.5rem,5vw,3.5rem)] leading-tight text-primary">
              Privacy Policy
            </h1>
            <p className="font-mono text-xs text-muted mt-4">
              Last updated: March 2026
            </p>
          </div>

          <div className="space-y-10 text-sm text-muted leading-relaxed">
            <p>
              Mantis Tech (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates mantistech.io and related
              services. This Privacy Policy explains what information we collect, how we use it, and
              your rights regarding that information. By using our services, you agree to the
              practices described here.
            </p>

            <section>
              <h2 className="font-heading text-xl text-primary mb-3">What We Collect</h2>
              <p className="mb-3">
                We collect information you provide directly to us and information generated through
                your use of our services.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-primary">Account and intake data:</strong> When you submit
                  our intake form or create an account, we collect your name, email address, phone
                  number, business name, business type, location, and project details.
                </li>
                <li>
                  <strong className="text-primary">Payment data:</strong> Billing information is
                  collected and processed by Stripe. We do not store your full card number or payment
                  credentials on our servers.
                </li>
                <li>
                  <strong className="text-primary">Communications:</strong> Messages you send through
                  our contact form, dashboard, or email are stored so we can respond and maintain
                  service records.
                </li>
                <li>
                  <strong className="text-primary">Usage data:</strong> We may collect standard
                  server log information such as IP address, browser type, pages visited, and
                  timestamps. This is used for security monitoring and service improvement.
                </li>
                <li>
                  <strong className="text-primary">Cookies:</strong> We use cookies to maintain
                  session state, remember preferences, and analyze general site usage. See the
                  Cookies section below for more detail.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-xl text-primary mb-3">How We Use It</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>To build and deliver your website and associated services.</li>
                <li>To communicate with you about your project, billing, and support requests.</li>
                <li>To process payments through Stripe.</li>
                <li>To send transactional emails such as dashboard access links, project updates,
                  and invoices.</li>
                <li>To detect, investigate, and prevent fraud or abuse.</li>
                <li>To improve and develop our services.</li>
              </ul>
              <p className="mt-3">
                We do not sell your personal information to third parties. We do not use your data
                for advertising purposes on external platforms.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl text-primary mb-3">Third Party Services</h2>
              <p className="mb-3">
                We use the following third-party services to operate our platform. Each service has
                its own privacy policy governing how they handle data.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-primary">Stripe</strong> processes all payment transactions.
                  Your card details are submitted directly to Stripe and are subject to{' '}
                  <a
                    href="https://stripe.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline underline-offset-4"
                  >
                    Stripe&apos;s Privacy Policy
                  </a>
                  .
                </li>
                <li>
                  <strong className="text-primary">Resend</strong> is used to send transactional
                  emails including intake confirmations, dashboard links, and support replies. Email
                  content may pass through Resend&apos;s infrastructure.
                </li>
                <li>
                  <strong className="text-primary">Hosting infrastructure</strong> may include
                  cloud providers such as Vercel for application hosting. Server logs and request
                  data are subject to their data processing terms.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-xl text-primary mb-3">Cookies</h2>
              <p className="mb-3">
                Our website uses cookies and similar technologies. We use:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-primary">Essential cookies</strong> required for the site
                  to function, such as session management and security tokens.
                </li>
                <li>
                  <strong className="text-primary">Preference cookies</strong> to remember settings
                  like your chosen color theme.
                </li>
                <li>
                  <strong className="text-primary">Analytics cookies</strong> to understand how
                  visitors use the site in aggregate. This data is anonymized where possible.
                </li>
              </ul>
              <p className="mt-3">
                You can accept or decline non-essential cookies through the banner shown on your
                first visit. You can also manage cookies through your browser settings. Note that
                disabling cookies may affect site functionality.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl text-primary mb-3">Data Retention</h2>
              <p className="mb-3">
                We retain your data for as long as necessary to provide our services and meet legal
                obligations.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Active client project data is retained for the duration of your subscription and
                  for a reasonable period afterward in case you return.
                </li>
                <li>
                  Intake form submissions are retained for project delivery purposes and may be kept
                  for up to 3 years for business records.
                </li>
                <li>
                  Payment records are retained as required by applicable tax and financial regulations,
                  typically 7 years.
                </li>
                <li>
                  Upon request, we will delete or anonymize your personal data where we are not
                  legally required to retain it.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-xl text-primary mb-3">Your Rights</h2>
              <p className="mb-3">
                Depending on your jurisdiction, you may have the following rights regarding your
                personal data:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-primary">Access:</strong> Request a copy of the personal
                  data we hold about you.
                </li>
                <li>
                  <strong className="text-primary">Correction:</strong> Request that we correct
                  inaccurate or incomplete information.
                </li>
                <li>
                  <strong className="text-primary">Deletion:</strong> Request deletion of your
                  personal data, subject to legal retention obligations.
                </li>
                <li>
                  <strong className="text-primary">Portability:</strong> Request a machine-readable
                  export of your data.
                </li>
                <li>
                  <strong className="text-primary">Opt-out:</strong> Unsubscribe from non-essential
                  communications at any time using the unsubscribe link in any email we send.
                </li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, contact us at{' '}
                <a
                  href="mailto:hello@mantistech.io"
                  className="text-accent hover:underline underline-offset-4"
                >
                  hello@mantistech.io
                </a>
                . We will respond within 30 days.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl text-primary mb-3">Contact</h2>
              <p>
                If you have questions about this Privacy Policy or how we handle your data, please
                contact us at{' '}
                <a
                  href="mailto:hello@mantistech.io"
                  className="text-accent hover:underline underline-offset-4"
                >
                  hello@mantistech.io
                </a>
                . We are committed to addressing your concerns promptly and transparently.
              </p>
            </section>

            <p className="font-mono text-xs text-dim border-t border-border pt-8">
              This policy may be updated periodically. Material changes will be communicated by
              updating the date at the top of this page. Continued use of our services after changes
              constitutes acceptance of the revised policy.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
