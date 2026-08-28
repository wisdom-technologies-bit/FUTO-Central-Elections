import type { Metadata } from 'next'
import ResultsPage from '@/components/elections/results-page'

export const metadata: Metadata = {
  title: 'Election Results | FUTO Central Elections',
  description: 'Explore published results from FUTO Central Elections and view outcomes from completed student elections.',
}

export default function Page() {
  return <ResultsPage />
}
