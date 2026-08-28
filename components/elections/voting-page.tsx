'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, LockKeyhole, ShieldCheck } from 'lucide-react'

type ElectionStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'IN_REVIEW' | 'COMPLETED'
type VotingStep = 'verify' | 'ballot' | 'review' | 'submitted'

export type ElectionContext = {
  name: string
  slug: string
  description?: string
  status: ElectionStatus
  startsAt?: string
  endsAt?: string
  eligibilitySummary?: string
  resultsPublished?: boolean
}

export type Candidate = {
  id: string
  name: string
  imageUrl?: string
  profileUrl?: string
  manifestoUrl?: string
}

export type BallotPosition = {
  id: string
  title: string
  description?: string
  candidates: Candidate[]
  required?: boolean
  maxSelections?: number
}

const steps: { key: VotingStep; label: string }[] = [
  { key: 'verify', label: 'Verify' },
  { key: 'ballot', label: 'Ballot' },
  { key: 'review', label: 'Review' },
  { key: 'submitted', label: 'Submit' },
]

function Header({ election }: { election: ElectionContext }) {
  return <div className="vote-header"><Link href="/elections" className="text-link"><ArrowLeft size={15} /> Back to Elections</Link><div className="vote-context"><span className={`status-badge status-${election.status.toLowerCase()}`}><i />{election.status === 'ACTIVE' ? 'Voting Open' : election.status}</span><span className="eyebrow">FUTO CENTRAL ELECTIONS</span></div><h1>{election.name}</h1>{election.description && <p>{election.description}</p>}{election.endsAt && <span className="vote-deadline">Voting closes {election.endsAt}</span>}</div>
}

function Progress({ current }: { current: VotingStep }) {
  const activeIndex = steps.findIndex((step) => step.key === current)
  return <nav className="vote-progress" aria-label="Voting progress">{steps.map((step, index) => <div key={step.key} className={`vote-progress-step ${index <= activeIndex ? 'is-active' : ''}`} aria-current={step.key === current ? 'step' : undefined}><span>{String(index + 1).padStart(2, '0')}</span><b>{step.label}</b></div>)}</nav>
}

function Notice({ children, tone = 'info' }: { children: React.ReactNode; tone?: 'info' | 'warning' }) {
  return <div className={`vote-notice ${tone}`} role="note"><CircleAlert size={18} /><p>{children}</p></div>
}

function UnavailableState({ election, title, message, results }: { election: ElectionContext; title: string; message: string; results?: boolean }) {
  return <section className="vote-state-panel"><div className="empty-icon"><LockKeyhole size={24} /></div><span className="eyebrow">{election.status === 'DRAFT' ? 'Not available' : 'Voting access'}</span><h2>{title}</h2><p>{message}</p><div className="vote-state-actions"><Link href="/elections" className="button button-primary">Back to Elections <ArrowRight size={16} /></Link>{results && <Link href={`/elections/${election.slug}/results`} className="button button-secondary">View Results <ArrowRight size={16} /></Link>}</div></section>
}

export function VerificationFlow({ election }: { election: ElectionContext }) {
  return <><Progress current="verify" /><section className="vote-card"><div className="section-kicker"><ShieldCheck size={17} /><span>Step 1 of 4</span></div><h2>Verify Your Eligibility</h2><p>Enter your JAMB registration number to begin verification. Your eligibility will be checked before you can access the ballot.</p><Notice>You must be an eligible student to participate in this election. You may only submit one vote in this election.</Notice><form className="vote-form" onSubmit={(event) => event.preventDefault()}><label htmlFor="jamb-number">JAMB Registration Number</label><input id="jamb-number" name="jamb-number" type="text" autoComplete="off" placeholder="Enter your JAMB registration number" /><button className="button button-primary" type="submit">Continue <ArrowRight size={16} /></button></form><div className="vote-security"><LockKeyhole size={16} /> Do not share your verification details with anyone.</div></section></>
}

export function StateVerificationFlow() {
  return <section className="vote-card"><div className="section-kicker"><ShieldCheck size={17} /><span>Step 1 of 4</span></div><h2>Confirm Your Details</h2><p>State of Origin is used as an additional verification detail to help confirm the person entering the JAMB registration number matches the corresponding student record.</p><label className="vote-label" htmlFor="state-of-origin">State of Origin</label><select id="state-of-origin" defaultValue=""><option value="" disabled>Select your state of origin</option>{['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara','Federal Capital Territory (FCT)'].map((state) => <option value={state} key={state}>{state}</option>)}</select><button className="button button-primary" type="button">Verify Eligibility <ArrowRight size={16} /></button></section>
}

export function BallotFlow({ positions }: { positions: BallotPosition[] }) {
  return <><Progress current="ballot" /><section className="vote-card"><div className="section-kicker"><CheckCircle2 size={17} /><span>Step 2 of 4</span></div><h2>Your Ballot</h2><p>Review each position and make the selections allowed by this election.</p>{positions.length === 0 ? <div className="vote-empty-inner"><h3>Ballot positions will appear here</h3><p>Position and candidate information will be provided by the election data source.</p></div> : <div className="ballot-positions">{positions.map((position) => <fieldset key={position.id}><legend>{position.title}</legend><p>{position.description ?? (position.maxSelections && position.maxSelections > 1 ? `Select up to ${position.maxSelections} candidates.` : 'Select one candidate.')}</p>{position.candidates.map((candidate) => <label className="candidate-option" key={candidate.id}><input type={position.maxSelections && position.maxSelections > 1 ? 'checkbox' : 'radio'} name={position.id} value={candidate.id} /><span>{candidate.name}</span></label>)}</fieldset>)}</div>}<button className="button button-primary" type="button" disabled={positions.length === 0}>Continue to Review <ArrowRight size={16} /></button></section></>
}

export function ReviewFlow() {
  return <><Progress current="review" /><section className="vote-card"><div className="section-kicker"><CheckCircle2 size={17} /><span>Step 3 of 4</span></div><h2>Review Your Vote</h2><p>Your selections will appear here before final submission.</p><Notice tone="warning">Review your selections carefully. Once your vote is submitted, you may not be able to change or submit another ballot for this election.</Notice><div className="vote-empty-inner"><p>No selections to review yet.</p></div><div className="vote-actions"><button className="button button-secondary" type="button">Edit Vote</button><button className="button button-primary" type="button" disabled>Submit Vote</button></div></section></>
}

export function VotingPage({ election }: { election: ElectionContext | null }) {
  if (!election) return <main className="vote-shell"><section className="vote-missing"><div className="empty-icon"><LockKeyhole size={24} /></div><span className="eyebrow">FUTO CENTRAL ELECTIONS</span><h1>Election Unavailable</h1><p>This election is not currently available for voting.</p><Link href="/elections" className="button button-primary">Back to Elections <ArrowRight size={16} /></Link></section></main>
  return <div className="elections-site"><main className="vote-shell"><div className="site-container"><Header election={election} />{election.status === 'ACTIVE' ? <VerificationFlow election={election} /> : election.status === 'SCHEDULED' ? <UnavailableState election={election} title="Voting Has Not Started" message="This election is scheduled to begin at a later time. Voting access will become available when the election opens." /> : election.status === 'IN_REVIEW' ? <UnavailableState election={election} title="Voting Has Ended" message="Voting has closed and the election results are currently under review." /> : election.status === 'COMPLETED' ? <UnavailableState election={election} title="Voting Has Ended" message={election.resultsPublished ? 'Voting for this election is no longer available.' : 'Voting has ended. Results are currently under review.'} results={election.resultsPublished} /> : <UnavailableState election={election} title="Election Unavailable" message="This election is not currently available for voting." />}</div></main></div>
}

export default VotingPage

// Future database wiring should pass a server-validated ElectionContext here. The UI intentionally renders no election until that source is connected.
export const futureVotingStates = { idle: 'idle', validating: 'validating', verified: 'verified', notVerified: 'not-verified', error: 'error', rateLimited: 'rate-limited', alreadyVoted: 'already-voted', submitted: 'submitted' } as const

export function SubmissionSuccess() { return <section className="vote-state-panel"><div className="empty-icon"><CheckCircle2 size={24} /></div><span className="eyebrow">Confirmation</span><h2>Vote Submitted Successfully</h2><p>Your vote has been recorded for this election.</p><Link href="/elections" className="button button-primary">Back to Elections <ArrowRight size={16} /></Link></section> }

export function AlreadyVotedState() { return <section className="vote-state-panel"><div className="empty-icon"><CheckCircle2 size={24} /></div><h2>You Have Already Voted</h2><p>Our records indicate that a vote has already been submitted for this election.</p><Link href="/elections" className="button button-primary">Back to Elections <ArrowRight size={16} /></Link></section> }

export function IneligibleState() { return <section className="vote-state-panel"><div className="empty-icon"><CircleAlert size={24} /></div><h2>You Are Not Eligible to Vote in This Election</h2><p>Your student record was verified, but it does not meet the eligibility requirements for this election.</p><Link href="/elections" className="button button-primary">Back to Elections <ArrowRight size={16} /></Link></section> }

export function VerificationErrorState() { return <div className="vote-error" role="alert"><CircleAlert size={17} /><p>We couldn&apos;t verify those details. Please check your information and try again.</p></div> }

export function RateLimitedState() { return <div className="vote-error" role="alert"><CircleAlert size={17} /><p>Too many verification attempts. Please wait a moment and try again.</p></div> }

export function ElectionEligibilitySummary({ election }: { election: ElectionContext }) { return <div className="eligibility-summary"><span className="eyebrow">You are eligible for</span><strong>{election.name}</strong>{election.eligibilitySummary && <p>{election.eligibilitySummary}</p>}</div> }

export function AccessibleElectionCard({ election }: { election: ElectionContext }) { return <article className="vote-card"><span className="status-badge status-active">{election.status === 'ACTIVE' ? 'Voting Open' : election.status}</span><h2>{election.name}</h2><p>{election.description}</p></article> }

export function FutureLoadingState() { return <section className="vote-card" aria-label="Loading election"><div className="vote-skeleton" /><div className="vote-skeleton short" /><div className="vote-skeleton" /></section> }

export function FutureErrorState() { return <section className="vote-state-panel"><div className="empty-icon"><CircleAlert size={24} /></div><h2>Unable to Load Election</h2><p>We couldn&apos;t load this election right now. Please try again.</p><button type="button" className="button button-primary">Try Again</button></section> }

export { steps }
