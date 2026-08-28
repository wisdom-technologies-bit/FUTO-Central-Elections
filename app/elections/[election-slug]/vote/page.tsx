import type { Metadata } from 'next'
import VotingPage, { type ElectionContext } from '@/components/elections/voting-page'

type PageProps = { params: Promise<{ 'election-slug': string }> }

export const metadata: Metadata = {
  title: 'Vote | FUTO Central Elections',
  description: 'Enter the secure voting flow for a FUTO Central Elections election.',
}

export default async function Page({ params }: PageProps) {
  const { 'election-slug': slug } = await params
  // Future server data loading belongs here. Until then, never invent an election record.
  void slug
  const election: ElectionContext | null = null
  return <VotingPage election={election} />
}
