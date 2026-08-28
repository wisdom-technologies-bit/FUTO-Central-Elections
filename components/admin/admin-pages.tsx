'use client'

import Link from 'next/link'
import { useState } from 'react'

type Stat = { label: string; description: string }

const navItems = [
  ['Dashboard', '/admin/dashboard'], ['Elections', '/admin/elections'], ['Students', '/admin/students'],
  ['Sessions', '/admin/sessions'], ['Schools', '/admin/schools'], ['Departments', '/admin/departments'],
  ['Results', '/admin/results'], ['Audit Logs', '/admin/audit-logs'], ['Settings', '/admin/settings'],
]
const stats: Stat[] = [
  { label: 'Total Elections', description: 'Available after database connection' },
  { label: 'Active Elections', description: 'No live data connected' },
  { label: 'Scheduled Elections', description: 'No live data connected' },
  { label: 'Published Results', description: 'No live data connected' },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return <div className="admin-shell">
    <aside className={open ? 'admin-sidebar is-open' : 'admin-sidebar'}>
      <div className="admin-brand"><span className="admin-mark">FC</span><span><b>FUTO CENTRAL</b><small>ELECTIONS / ADMIN</small></span></div>
      <nav aria-label="Administration navigation">{navItems.map(([label, href]) => <Link key={href} className={label === 'Dashboard' ? 'admin-nav-link active' : 'admin-nav-link'} href={href} onClick={() => setOpen(false)}>{label}</Link>)}</nav>
      <div className="admin-sidebar-note">Database connection is intentionally pending.<br /><Link href="/">Return to public site</Link></div>
    </aside>
    {open && <button className="admin-overlay" aria-label="Close navigation" onClick={() => setOpen(false)} />}
    <div className="admin-main"><header className="admin-topbar"><button className="admin-menu" aria-label="Open navigation" onClick={() => setOpen(true)}>Menu</button><div><span className="admin-eyebrow">FUTO CENTRAL ELECTIONS</span><strong>ADMIN DASHBOARD</strong></div><div className="admin-session"><span className="status-dot" />Development mode <Link href="/admin/login">Logout</Link></div></header>{children}</div>
  </div>
}

export function AdminLogin() {
  const [visible, setVisible] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  return <main className="admin-login-page"><div className="admin-login-card"><div className="admin-brand admin-login-brand"><span className="admin-mark">FC</span><span><b>FUTO CENTRAL</b><small>ELECTIONS</small></span></div><span className="admin-eyebrow">ADMINISTRATION</span><h1>Secure administrative access</h1><p className="admin-muted">Authorized administrators only.</p>{submitted && <div className="admin-notice" role="alert"><strong>Access Denied</strong><span>The access code is invalid or no longer active.</span></div>}<form onSubmit={(event) => { event.preventDefault(); setSubmitted(true) }}><label htmlFor="access-code">Access Code</label><div className="admin-input-wrap"><input id="access-code" name="access-code" type={visible ? 'text' : 'password'} autoComplete="off" required aria-describedby="access-help" /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide access code' : 'Show access code'}>{visible ? 'Hide' : 'Show'}</button></div><span id="access-help" className="admin-help">Enter the access code provided to an authorized administrator.</span><button className="admin-primary" type="submit">Enter Admin Dashboard</button></form><Link className="admin-back-link" href="/">Back to public site</Link></div></main>
}

export function AdminDashboard() {
  return <AdminShell><main className="admin-content"><section className="admin-welcome"><span className="admin-eyebrow">OVERVIEW</span><h1>Election Administration</h1><p>Manage elections, voters, candidates, results and academic sessions from one place.</p></section><section className="admin-stat-grid" aria-label="Platform summary">{stats.map((stat) => <article className="admin-stat-card" key={stat.label}><span className="admin-stat-label">{stat.label}</span><strong>—</strong><p>{stat.description}</p></article>)}</section><section className="admin-grid-two"><article className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-eyebrow">ELECTION ACTIVITY</span><h2>Active election</h2></div><span className="admin-badge">Awaiting data</span></div><div className="admin-empty"><strong>No active elections</strong><p>Live election activity will appear here once the database is connected.</p></div></article><article className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-eyebrow">SYSTEM STATUS</span><h2>Development state</h2></div><span className="admin-badge muted">Not connected</span></div><div className="admin-empty"><strong>Database not connected</strong><p>This dashboard will use Supabase as its source of truth when integration is added.</p></div></article></section><section className="admin-panel"><div className="admin-panel-heading"><div><span className="admin-eyebrow">SHORTCUTS</span><h2>Quick actions</h2></div></div><div className="admin-actions">{[['Create Election','/admin/elections/new'],['Import Admission List','/admin/students/import'],['Enter New Session','/admin/sessions/new'],['Review Results','/admin/results']].map(([label, href]) => <Link className="admin-action" href={href} key={href}>{label}<span>→</span></Link>)}</div></section></main></AdminShell>
}

export function AdminEntry() { return <meta httpEquiv="refresh" content="0;url=/admin/login" /> }
