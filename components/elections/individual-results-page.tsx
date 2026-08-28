'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, BarChart3, Check, Clipboard, LockKeyhole, Share2 } from 'lucide-react'
import { useState } from 'react'

export type PublishedResultCandidate = {
  id: string
  name: string
  imageUrl?: string
  votes?: number
  percentage?: number
  outcome?: 'winner' | 'joint-winner' | 'contestant' | 'disqualified' | 'withdrawn'
}

export type PublishedResultPosition = {
  id: string
  title: string
  candidates: PublishedResultCandidate[]
  summary?: string
}

export type PublishedElectionResult = {
  name: string
  slug: string
  description?: string
  electionDate?: string
  publishedAt?: string
  academicSession?: string
  scope?: string
  positionsContested?: number
  totalVotesCast?: number
  positions: PublishedResultPosition[]
  status: 'PUBLISHED'
}

type State = 'published' | 'under-review' | 'active' | 'scheduled' | 'unavailable' | 'error'

function Actions({ slug, share = false }: { slug?: string; share?: boolean }) {
  const [copied, setCopied] = useState(false)
  async function copyLink() {
    if (!navigator.clipboard) return
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }
  return <div className="result-detail-actions">
    <Link href="/results" className="button button-quiet"><ArrowLeft size={16} /> All Results</Link>
    <Link href="/elections" className="button button-quiet">View Elections <ArrowRight size={16} /></Link>
    {share && slug && <button className="button button-primary" type="button" onClick={copyLink}><Share2 size={16} /> {copied ? 'Link copied.' : 'Share Results'}</button>}
  </div>
}

function StatePanel({ state }: { state: Exclude<State, 'published'> }) {
  const copy: Record<typeof state, { label: string; title: string; message: string }> = {
    'under-review': { label: 'Results status', title: 'Results Under Review', message: 'Voting has ended and the results are currently under review. Published results will appear when the review process is complete.' },
    active: { label: 'Results status', title: 'Results Not Yet Available', message: 'Voting is currently ongoing. Results will be published after the election has ended and the results have been reviewed.' },
    scheduled: { label: 'Results status', title: 'Results Not Yet Available', message: 'This election has not started yet.' },
    unavailable: { label: 'FUTO CENTRAL ELECTIONS', title: 'Election Not Available', message: "The election results you're looking for could not be found or are not publicly available." },
    error: { label: 'FUTO CENTRAL ELECTIONS', title: 'Unable to Load Results', message: "We couldn't load this election's results right now. Please try again later." },
  }
  const item = copy[state]
  return <main className="result-detail-shell"><div className="site-container"><section className="result-state-panel"><div className="empty-icon"><LockKeyhole size={24} /></div><span className="eyebrow">{item.label}</span><h1>{item.title}</h1><p>{item.message}</p><div className="result-detail-actions"><Link href={state === 'active' ? '/elections' : '/elections'} className="button button-primary">{state === 'active' ? 'View Election' : state === 'error' ? 'Try Again' : 'View Elections'} <ArrowRight size={16} /></Link>{state === 'under-review' && <Link href="/elections" className="button button-quiet">Browse Elections</Link>}</div></section></div></main>
}

function CandidateRow({ candidate }: { candidate: PublishedResultCandidate }) {
  const outcome = candidate.outcome
  const label = outcome === 'winner' ? 'Winner' : outcome === 'joint-winner' ? 'Joint winner' : outcome === 'disqualified' ? 'Disqualified' : outcome === 'withdrawn' ? 'Withdrawn' : undefined
  return <article className={`published-candidate ${label ? 'has-outcome' : ''}`}>
    <div className="candidate-avatar" aria-hidden="true">{candidate.imageUrl ? <img src={candidate.imageUrl} alt="" /> : <BarChart3 size={18} />}</div>
    <div className="candidate-main"><div className="candidate-name-line"><h3>{candidate.name}</h3>{label && <span className="outcome-badge"><Check size={13} /> {label}</span>}</div><div className="result-bar" role="progressbar" aria-label={`${candidate.name} result percentage`} aria-valuenow={candidate.percentage ?? 0} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${Math.min(Math.max(candidate.percentage ?? 0, 0), 100)}%` }} /></div></div>
    <div className="candidate-total">{candidate.votes !== undefined && <strong>{candidate.votes.toLocaleString()} votes</strong>}{candidate.percentage !== undefined && <span>{candidate.percentage}%</span>}{candidate.votes === undefined && candidate.percentage === undefined && <span>Published result data unavailable</span>}</div>
  </article>
}

export function IndividualResultsPage({ result, state = 'unavailable' }: { result?: PublishedElectionResult; state?: State }) {
  if (!result || state !== 'published') return <StatePanel state={state === 'published' ? 'unavailable' : state} />
  return <main className="result-detail-shell"><div className="site-container"><div className="result-detail-top"><Link href="/results" className="text-link"><ArrowLeft size={15} /> All Results</Link><span className="status-badge status-completed"><Check size={14} /> Results Published</span></div><header className="result-detail-hero"><span className="eyebrow">FUTO CENTRAL ELECTIONS</span><h1>{result.name}</h1>{result.description && <p>{result.description}</p>}<div className="result-meta">{result.electionDate && <span><b>Election Date</b>{result.electionDate}</span>}{result.publishedAt && <span><b>Results Published</b>{result.publishedAt}</span>}{result.academicSession && <span><b>Academic Session</b>{result.academicSession}</span>}{result.scope && <span><b>Scope</b>{result.scope}</span>}</div></header><section className="published-notice" role="note"><Check size={18} /><div><strong>Published Election Results</strong><p>These aggregate results were made publicly available after the election concluded and the outcome went through the platform&apos;s review and publication process. Individual voter choices are not displayed.</p></div></section><section className="result-summary-grid" aria-label="Election summary">{result.positionsContested !== undefined && <div><span>Positions contested</span><strong>{result.positionsContested}</strong></div>}{result.totalVotesCast !== undefined && <div><span>Total votes cast</span><strong>{result.totalVotesCast.toLocaleString()}</strong></div>}{result.publishedAt && <div><span>Publication status</span><strong>Published</strong></div>}</section><section className="positions-results"><div className="section-kicker"><BarChart3 size={17} /><span>Published outcome</span></div><h2>Election Results</h2>{result.positions.length ? result.positions.map((position) => <article className="position-result" key={position.id}><div className="position-heading"><div><span className="eyebrow">Position</span><h3>{position.title}</h3></div>{position.summary && <p>{position.summary}</p>}</div>{position.candidates.length ? position.candidates.map((candidate) => <CandidateRow candidate={candidate} key={candidate.id} />) : <p className="result-unavailable">Candidate result information is not available for this position.</p>}</article>) : <div className="result-unavailable"><p>Published result details are not available for this election yet.</p></div>}</section><div className="result-integrity-note"><LockKeyhole size={18} /><p>Results shown here represent the published aggregate outcome of this election. The page does not display student verification details, individual ballots, or voter identities.</p></div><Actions slug={result.slug} share /></div></main>
}

export function ResultLoadingState() { return <main className="result-detail-shell"><div className="site-container"><section className="result-loading" aria-label="Loading published results"><span /><span /><span /><div /><div /><div /></section></div></main> }

export function ResultErrorState() { return <StatePanel state="error" /> }

export function ResultUnavailableState({ state }: { state: Exclude<State, 'published' | 'error'> }) { return <StatePanel state={state} /> }

export default IndividualResultsPage
