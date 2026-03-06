import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Terms of Service | Mantis Tech',
  description:
    'Read the Mantis Tech Terms of Service covering payments, cancellations, ownership, and liability.',
}

export default function TermsPage() {
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
              Terms of Service
            </h1>
            <p className="font-mono text-xs text-muted mt-4">
              Last updated: March 2026
            </p>
          </div>

          <div className="space-y-10 text-sm text-muted leading-relaxed">
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the services provided by Mantis
              Tech (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) through mantistech.io. By submitting an intake form,
              making a payment, or using our services, you agree to be bound by these Terms. Please
              read them carefully.
            </p>

            <section>
              <h2 className="font-heading text-xl text-primary mb-3">Services Description</h2>
              <p className="mb-3">
                Mantis Tech provides custom website design, development, and ongoing digital services
                for local and service-based businesses. Our services include but are not limited to:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Custom website design and development based on your intake form submission.</li>
                <li>Domain registration and web hosting management.</li>
                <li>Optional add-on services such as review management, social media automation,
                  SEO optimization, lead generation tools, and email marketing.</li>
                <li>Ongoing website maintenance, updates, and unlimited change requests.</li>
                <li>Client dashboard access for submitting update requests and reviewing project status.</li>
              </ul>
              <p className="mt-3">
                Service delivery is contingent on receipt of your intake form submission and
                required payment. We reserve the right to decline any project at our discretion
                prior to initiating work.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl text-primary mb-3">Payment Terms</h2>
              <p className="mb-3">
                Our services are billed in two components:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-primary">Upfront setup fee:</strong> A one-time fee due
                  before work begins on your project. This fee covers the initial design, development,
                  and launch of your website. The amount varies by plan as displayed on our pricing
                  page at the time of your order.
                </li>
                <li>
                  <strong className="text-primary">Monthly subscription:</strong> A recurring monthly
                  fee billed automatically via Stripe beginning on your start date. This fee covers
                  hosting, domain management, maintenance, and any included or add-on services on
                  your selected plan.
                </li>
              </ul>
              <p className="mt-3">
                All payments are processed securely through Stripe. By providing payment information,
                you authorize us to charge the stated amounts on the schedule described. Prices are
                listed in US dollars. We reserve the right to adjust subscription pricing with 30
                days advance notice.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl text-primary mb-3">Cancellation Policy</h2>
              <p className="mb-3">
                You may cancel your monthly subscription at any time with no penalty. To cancel,
                contact us at hello@mantistech.io or use the cancellation option in your client
                dashboard.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Your website and all associated services will remain active through the end of the
                  current billing period. No partial month refunds are issued upon cancellation.
                </li>
                <li>
                  After cancellation, your domain, website files, and content will be made available
                  to you upon request. We will provide the necessary transfer credentials within 5
                  business days of your request.
                </li>
                <li>
                  We reserve the right to suspend or terminate service for non-payment, violation of
                  these Terms, or abusive conduct toward our team.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-xl text-primary mb-3">Refund Policy</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-primary">Upfront setup fees are non-refundable</strong>{' '}
                  once work has commenced on your project. If you cancel before we begin work, we
                  will issue a full refund of the upfront fee within 5 business days.
                </li>
                <li>
                  <strong className="text-primary">Monthly subscription fees</strong> are billed in
                  advance and are non-refundable for the current billing period. If you cancel
                  mid-cycle, your service will remain active until the end of that period and no
                  partial refund will be issued.
                </li>
                <li>
                  If we fail to deliver your initial website within a reasonable timeframe (typically
                  7 business days from your intake submission) without prior communication, you may
                  request a full refund of the upfront fee.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-xl text-primary mb-3">Ownership</h2>
              <p className="mb-3">
                You retain full ownership of:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Your domain name, once registered in your name or transferred to your registrar
                  account upon cancellation.
                </li>
                <li>
                  All content you provide to us, including text, images, logos, and other materials.
                </li>
                <li>
                  The final website files and design assets we create for your project.
                </li>
              </ul>
              <p className="mt-3">
                While you are an active subscriber, we manage hosting and infrastructure on your
                behalf. We grant you a perpetual license to the website we build for you. Upon
                cancellation, we will provide all files necessary to host your website elsewhere.
              </p>
              <p className="mt-3">
                We retain the right to display your website in our portfolio and marketing materials
                unless you request otherwise in writing.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl text-primary mb-3">Client Responsibilities</h2>
              <p className="mb-3">You agree to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Provide accurate and complete information on your intake form.</li>
                <li>Own or have the legal right to use any content, images, or trademarks you submit
                  to us for use on your website.</li>
                <li>Not use our services for any unlawful purpose or in violation of any applicable
                  regulations.</li>
                <li>Maintain the confidentiality of your dashboard access link and notify us
                  promptly if you believe your access has been compromised.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-heading text-xl text-primary mb-3">Limitation of Liability</h2>
              <p className="mb-3">
                To the fullest extent permitted by law, Mantis Tech and its owners, employees, and
                contractors shall not be liable for:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  Any indirect, incidental, consequential, or punitive damages arising from your
                  use of or inability to use our services.
                </li>
                <li>
                  Loss of business, revenue, data, or goodwill, even if we have been advised of
                  the possibility of such damages.
                </li>
                <li>
                  Downtime, data loss, or service interruptions caused by third-party providers
                  including hosting infrastructure, domain registrars, or payment processors.
                </li>
              </ul>
              <p className="mt-3">
                Our total liability to you for any claim arising under these Terms shall not exceed
                the total amount you paid us in the 3 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl text-primary mb-3">Changes to These Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify active
                subscribers of material changes with at least 14 days notice via email. Continued
                use of our services after that date constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="font-heading text-xl text-primary mb-3">Contact</h2>
              <p>
                Questions about these Terms should be directed to{' '}
                <a
                  href="mailto:hello@mantistech.io"
                  className="text-accent hover:underline underline-offset-4"
                >
                  hello@mantistech.io
                </a>
                .
              </p>
            </section>

            <p className="font-mono text-xs text-dim border-t border-border pt-8">
              These Terms constitute the entire agreement between you and Mantis Tech with respect
              to our services and supersede any prior agreements or understandings. If any provision
              of these Terms is found unenforceable, the remaining provisions shall remain in full
              effect.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
