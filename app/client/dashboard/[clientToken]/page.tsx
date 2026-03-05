import { Suspense } from 'react'
import ClientDashboard from './ClientDashboard'

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080c10] flex items-center justify-center">
          <div className="font-mono text-sm text-gray-500 animate-pulse">Loading your dashboard...</div>
        </div>
      }
    >
      <ClientDashboard />
    </Suspense>
  )
}
