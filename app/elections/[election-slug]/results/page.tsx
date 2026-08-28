import type { Metadata } from 'next'
import { IndividualResultsPage } from '@/components/elections/individual-results-page'

export const metadata: Metadata = {
  title: 'Election Results',
  description: 'View published aggregate results from FUTO Central Elections.',
}

export default async function ElectionResultsRoute({ params }: { params: Promise<{ 'election-slug': string }> }) {
  await params
  return <IndividualResultsPage state="unavailable" />
}
