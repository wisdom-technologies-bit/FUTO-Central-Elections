import type { Metadata } from 'next'
import ElectionsPage from '@/components/elections/elections-page'

export const metadata: Metadata = {
  title: 'Elections',
  description: 'Browse current, upcoming, and completed FUTO student elections.',
}

export default function Page() {
  return <ElectionsPage />
}
