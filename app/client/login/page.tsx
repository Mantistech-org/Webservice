import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import ClientLoginForm from '@/components/ClientLoginForm'
import { getProjectByClientToken } from '@/lib/db'

export const metadata: Metadata = {
  title: 'Client Login | Mantis Tech',
  description: 'Access your Mantis Tech client dashboard.',
}

export default async function ClientLoginPage() {
  const cookieStore = await cookies()
  const clientToken = cookieStore.get('client_token')?.value

  if (clientToken) {
    const project = await getProjectByClientToken(clientToken)
    if (project?.status === 'active') {
      redirect(`/client/dashboard/${clientToken}`)
    }
  }

  return (
    <>
      <Nav />
      <main className="pt-16 bg-bg min-h-screen flex items-center justify-center px-6">
        <ClientLoginForm />
      </main>
      <Footer />
    </>
  )
}
