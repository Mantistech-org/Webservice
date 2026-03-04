import { Suspense } from 'react'
import ClientReviewContent from './ClientReviewContent'

export const metadata = {
  title: 'Review Your Website | Mantis Tech',
}

export default function ClientReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg flex items-center justify-center">
          <div className="font-mono text-sm text-muted animate-pulse">Loading your preview...</div>
        </div>
      }
    >
      <ClientReviewContent />
    </Suspense>
  )
}
