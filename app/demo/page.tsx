import type { Metadata } from 'next'
import DemoPage from '@/components/demo/DemoPage'

export const metadata: Metadata = {
  title: 'Free Demo | Mantis Tech',
  description:
    'Try every Mantis Tech tool for free. Review management, social media automation, SEO, lead generation, and more. No sign-up required.',
}

export default function Demo() {
  return <DemoPage />
}
