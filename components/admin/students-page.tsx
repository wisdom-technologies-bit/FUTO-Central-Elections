'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle, Eye } from 'lucide-react'
import { AdminShell } from './admin-pages'

type Tab = 'import' | 'records' | 'registry'
type ImportStatus = 'idle' | 'crawling' | 'analyzing' | 'preview' | 'importing' | 'complete' | 'error'

interface PreviewRecord {
  id: string
  name: string
  jambNo: string
  gender: string
  school: string
  department: string
  session: string
  status: 'valid' | 'duplicate' | 'review' | 'missing-jamb' | 'unmatched-dept'
  issue?: string
}

interface ImportBatch {
  id: string
  session: string
  sourceUrl: string
  importedBy: string
  date: string
  detected: number
  imported: number
  duplicates: number
  issues: number
  status: 'pending' | 'crawling' | 'preview' | 'imported' | 'failed'
}

interface RegistryStudent {
  id: string
  name: string
  jambNo: string
  gender: string
  school: string
  department: string
  session: string
  status: 'active' | 'graduated' | 'inactive' | 'requires-review'
  added: string
}

export function AdminStudentsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('import')
  const [selectedSession, setSelectedSession] = useState('')
  const [admissionUrl, setAdmissionUrl] = useState('')
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle')
  const [preview, setPreview] = useState<{ records: PreviewRecord[] | null; summary: Record<string, number> | null }>({ records: null, summary: null })
  const [importBatches, setImportBatches] = useState<ImportBatch[]>([])
  const [registryStudents] = useState<RegistryStudent[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSession, setFilterSession] = useState('')
  const [error, setError] = useState('')

  const sessions = ['2021/2022', '2022/2023', '2023/2024', '2024/2025', '2025/2026']
  const schools = ['SAAT', 'SBMS', 'SOBS', 'SEET', 'SESET', 'SOES', 'SOHT', 'SICT', 'SLIT', 'SOPS']

  const handleStartCrawl = async () => {
    if (!selectedSession) return setError('Please select an academic session before starting the crawl.')
    if (!admissionUrl.trim()) return setError('Please enter an admission list URL.')
    setError('')
    setImportStatus('crawling')
    try {
      setImportStatus('analyzing')
      const response = await fetch('/api/student-import/preview', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: admissionUrl, session: selectedSession, departments: [] }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to crawl the admission-list page.')
      setPreview({ records: data.records as PreviewRecord[], summary: data.summary })
      setImportStatus('preview')
    } catch (crawlError) {
      setImportStatus('error')
      setError(crawlError instanceof Error ? crawlError.message : 'Unable to crawl the admission-list page.')
    }
  }

  const handleConfirmImport = async () => {
    const count = preview.summary?.valid || 0
    const confirmed = window.confirm(`Confirm import of ${count} records for ${selectedSession}?\n\nSource: ${admissionUrl}\nDuplicates: ${preview.summary?.duplicates || 0}\nRecords requiring review: ${(preview.summary?.review || 0) + (preview.summary?.missingJamb || 0) + (preview.summary?.unmatchedDept || 0)}`)
    if (!confirmed) return
    setImportStatus('importing')

    setTimeout(() => {
      const newBatch: ImportBatch = {
        id: `batch-${Date.now()}`,
        session: selectedSession,
        sourceUrl: admissionUrl,
        importedBy: 'Admin User',
        date: new Date().toISOString().split('T')[0],
        detected: preview.summary?.detected || 0,
        imported: (preview.summary?.valid || 0) + (preview.summary?.unmatchedDept || 0),
        duplicates: preview.summary?.duplicates || 0,
        issues: (preview.summary?.missingJamb || 0) + (preview.summary?.unmatchedDept || 0),
        status: 'imported',
      }

      setImportBatches([newBatch, ...importBatches])
      setImportStatus('complete')

      // Reset form
      setTimeout(() => {
        setAdmissionUrl('')
        setSelectedSession('')
        setPreview({ records: null, summary: null })
        setImportStatus('idle')
      }, 2000)
    }, 2000)
  }

  const filteredRegistry = registryStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.jambNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.department.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSession = !filterSession || student.session === filterSession
    return matchesSearch && matchesSession
  })

  return (
    <AdminShell>
      <main className="admin-content">
        <section className="admin-page-heading">
          <div>
            <span className="admin-eyebrow">ADMINISTRATION</span>
            <h1>Student Registry</h1>
            <p>
              Import publicly available FUTO admission-list records and manage the student registry used for election
              eligibility verification.
            </p>
          </div>
          {importStatus !== 'preview' && (
            <button className="admin-primary" onClick={() => setActiveTab('import')} disabled={selectedSession === ''}>
              Import Admission List
            </button>
          )}
        </section>

        <div className="admin-tabs" style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          {(['import', 'records', 'registry'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 18px',
                border: 'none',
                background: 'transparent',
                color: activeTab === tab ? 'var(--deep)' : 'var(--muted-foreground)',
                borderBottom: activeTab === tab ? '3px solid var(--gold)' : 'none',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {tab === 'import' && 'Admission List Import'}
              {tab === 'records' && 'Imported Records'}
              {tab === 'registry' && 'Student Registry'}
            </button>
          ))}
        </div>

        {/* IMPORT TAB */}
        {activeTab === 'import' && (
          <section className="admin-form-section" style={{ background: 'var(--card)', padding: 32, border: '1px solid var(--border)' }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ margin: '12px 0 8px', fontSize: 18, fontWeight: 700 }}>Select Academic Session</h2>
              <p style={{ margin: 0, color: 'var(--muted-foreground)', fontSize: 13 }}>
                The selected academic session will be assigned to every record imported from this crawl. Verify the session
                before starting the import.
              </p>
              <div
                style={{
                  padding: 12,
                  marginTop: 12,
                  background: 'rgba(215, 169, 0, 0.1)',
                  border: '1px solid rgba(215, 169, 0, 0.3)',
                  borderRadius: 4,
                  fontSize: 12,
                }}
              >
                <strong>Important:</strong> This selection is authoritative and will not be changed based on page content.
              </div>
            </div>

            <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
              <div className="admin-field">
                <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 700 }}>
                  Academic Session
                </label>
                <select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                  style={{
                    minHeight: 44,
                    padding: '0 12px',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    borderRadius: 4,
                  }}
                >
                  <option value="">Select a session...</option>
                  {sessions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-field">
                <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 700 }}>
                  Admission List URL
                </label>
                <input
                  type="url"
                  value={admissionUrl}
                  onChange={(e) => setAdmissionUrl(e.target.value)}
                  placeholder="https://legacy.futo.edu.ng/news/..."
                  style={{
                    minHeight: 44,
                    padding: '0 12px',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>

            {error && (
              <div style={{ padding: 12, background: 'rgba(200, 0, 0, 0.1)', border: '1px solid rgba(200, 0, 0, 0.3)', borderRadius: 4, marginBottom: 20, fontSize: 12, color: 'var(--foreground)' }}>
                <AlertCircle style={{ display: 'inline', marginRight: 8, width: 16, height: 16 }} />
                {error}
              </div>
            )}

            {importStatus === 'idle' && (
              <button
                onClick={handleStartCrawl}
                disabled={!selectedSession || !admissionUrl.trim()}
                style={{
                  padding: '11px 15px',
                  border: 'none',
                  cursor: !selectedSession || !admissionUrl.trim() ? 'not-allowed' : 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'white',
                  background: !selectedSession || !admissionUrl.trim() ? 'var(--muted)' : 'var(--deep)',
                  opacity: !selectedSession || !admissionUrl.trim() ? 0.5 : 1,
                }}
              >
                Start Crawl
              </button>
            )}

            {(importStatus === 'crawling' || importStatus === 'analyzing') && (
              <div style={{ padding: 20, background: 'var(--muted)', borderRadius: 4, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                  {importStatus === 'crawling' && 'Crawling admission list…'}
                  {importStatus === 'analyzing' && 'Analyzing student records…'}
                </div>
                <div style={{ display: 'inline-block', width: 20, height: 20, border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}

            {importStatus === 'preview' && preview.records && (
              <div style={{ marginTop: 28 }}>
                <h2 style={{ margin: '12px 0 16px', fontSize: 16, fontWeight: 700 }}>Import Preview</h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
                  <div style={{ padding: 16, background: 'var(--muted)', borderRadius: 4 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 700, marginBottom: 8 }}>
                      RECORDS DETECTED
                    </div>
                    <strong style={{ fontSize: 24 }}>{preview.summary?.detected}</strong>
                  </div>
                  <div style={{ padding: 16, background: 'var(--muted)', borderRadius: 4 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 700, marginBottom: 8 }}>
                      VALID RECORDS
                    </div>
                    <strong style={{ fontSize: 24, color: 'var(--primary)' }}>{preview.summary?.valid}</strong>
                  </div>
                  <div style={{ padding: 16, background: 'var(--muted)', borderRadius: 4 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 700, marginBottom: 8 }}>
                      DUPLICATES
                    </div>
                    <strong style={{ fontSize: 24 }}>{preview.summary?.duplicates}</strong>
                  </div>
                  <div style={{ padding: 16, background: 'var(--muted)', borderRadius: 4 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 700, marginBottom: 8 }}>
                      MISSING JAMB
                    </div>
                    <strong style={{ fontSize: 24 }}>{preview.summary?.missingJamb}</strong>
                  </div>
                  <div style={{ padding: 16, background: 'var(--muted)', borderRadius: 4 }}>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontWeight: 700, marginBottom: 8 }}>
                      UNMATCHED DEPT
                    </div>
                    <strong style={{ fontSize: 24 }}>{preview.summary?.unmatchedDept}</strong>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', marginBottom: 24 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                        <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>#</th>
                        <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Name</th>
                        <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>JAMB Reg. No.</th>
                        <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Gender</th>
                        <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>School</th>
                        <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Department</th>
                        <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Status</th>
                        <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Issue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.records.map((record, idx) => (
                        <tr key={record.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: 12 }}>{idx + 1}</td>
                          <td style={{ padding: 12 }}>{record.name}</td>
                          <td style={{ padding: 12 }}>{record.jambNo || '—'}</td>
                          <td style={{ padding: 12 }}>{record.gender || '—'}</td>
                          <td style={{ padding: 12 }}>{record.school}</td>
                          <td style={{ padding: 12 }}>{record.department}</td>
                          <td style={{ padding: 12 }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 8px',
                                borderRadius: 2,
                                fontSize: 11,
                                fontWeight: 700,
                                background:
                                  record.status === 'valid'
                                    ? 'rgba(0, 107, 63, 0.15)'
                                    : record.status === 'duplicate'
                                      ? 'rgba(200, 0, 0, 0.15)'
                                      : 'rgba(215, 169, 0, 0.15)',
                                color:
                                  record.status === 'valid'
                                    ? 'var(--primary)'
                                    : record.status === 'duplicate'
                                      ? 'var(--deep)'
                                      : 'var(--deep)',
                              }}
                            >
                              {record.status === 'valid' && 'Valid'}
                              {record.status === 'duplicate' && 'Duplicate'}
                              {record.status === 'missing-jamb' && 'Missing JAMB'}
                              {record.status === 'unmatched-dept' && 'Unmatched Dept'}
                            </span>
                          </td>
                          <td style={{ padding: 12, color: 'var(--muted-foreground)', fontSize: 11 }}>
                            {record.issue || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ padding: 16, background: 'rgba(0, 107, 63, 0.1)', border: '1px solid rgba(0, 107, 63, 0.3)', borderRadius: 4, marginBottom: 20 }}>
                  <strong style={{ fontSize: 12 }}>
                    You are about to add {preview.summary?.valid} student records to the {selectedSession} student registry.
                  </strong>
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--muted-foreground)' }}>
                    Verify that the selected academic session and source URL are correct.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => {
                      setImportStatus('idle')
                      setPreview({ records: null, summary: null })
                    }}
                    style={{
                      padding: '11px 15px',
                      border: '1px solid var(--border)',
                      background: 'var(--card)',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    style={{
                      padding: '11px 15px',
                      border: 'none',
                      background: 'var(--deep)',
                      color: 'white',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Import Records
                  </button>
                </div>
              </div>
            )}

            {importStatus === 'importing' && (
              <div style={{ padding: 20, background: 'var(--muted)', borderRadius: 4, textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Importing records…</div>
                <div style={{ display: 'inline-block', width: 20, height: 20, border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}

            {importStatus === 'complete' && (
              <div style={{ padding: 20, background: 'rgba(0, 107, 63, 0.1)', borderRadius: 4, border: '1px solid rgba(0, 107, 63, 0.3)', textAlign: 'center' }}>
                <CheckCircle style={{ color: 'var(--primary)', marginBottom: 8 }} />
                <div style={{ fontSize: 13, fontWeight: 700 }}>Import completed successfully</div>
              </div>
            )}
          </section>
        )}

        {/* RECORDS TAB */}
        {activeTab === 'records' && (
          <section>
            {importBatches.length === 0 ? (
              <div
                style={{
                  minHeight: 260,
                  padding: 42,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  border: '1px dashed var(--border)',
                  background: 'var(--muted)',
                  borderRadius: 4,
                }}
              >
                <strong>No Import History</strong>
                <p style={{ color: 'var(--muted-foreground)', marginTop: 8 }}>No admission lists have been imported yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Import ID</th>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Session</th>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Source URL</th>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Imported by</th>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Date</th>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Detected</th>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Imported</th>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Duplicates</th>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Issues</th>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Status</th>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importBatches.map((batch) => (
                      <tr key={batch.id} style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
                        <td style={{ padding: 12, fontFamily: 'monospace', fontSize: 11 }}>{batch.id}</td>
                        <td style={{ padding: 12 }}>{batch.session}</td>
                        <td style={{ padding: 12, color: 'var(--primary)', fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {batch.sourceUrl}
                        </td>
                        <td style={{ padding: 12 }}>{batch.importedBy}</td>
                        <td style={{ padding: 12 }}>{batch.date}</td>
                        <td style={{ padding: 12 }}>{batch.detected}</td>
                        <td style={{ padding: 12 }}>{batch.imported}</td>
                        <td style={{ padding: 12 }}>{batch.duplicates}</td>
                        <td style={{ padding: 12 }}>{batch.issues}</td>
                        <td style={{ padding: 12 }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 8px',
                              borderRadius: 2,
                              fontSize: 10,
                              fontWeight: 700,
                              background: 'rgba(0, 107, 63, 0.15)',
                              color: 'var(--primary)',
                            }}
                          >
                            {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                          </span>
                        </td>
                        <td style={{ padding: 12 }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button style={{ padding: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', borderRadius: 2 }}>
                              <Eye style={{ width: 14, height: 14 }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* REGISTRY TAB */}
        {activeTab === 'registry' && (
          <section>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div className="admin-search" style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 12px', color: 'var(--muted-foreground)', border: '1px solid var(--border)', background: 'var(--card)' }}>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, JAMB number, or department…"
                    style={{ width: '100%', border: 0, outline: 0, color: 'var(--foreground)', background: 'transparent', font: '13px Arial,sans-serif', padding: '13px 0' }}
                  />
                </div>
              </div>
              <select
                value={filterSession}
                onChange={(e) => setFilterSession(e.target.value)}
                style={{
                  minHeight: 44,
                  padding: '0 12px',
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  borderRadius: 4,
                  fontSize: 13,
                }}
              >
                <option value="">All Sessions</option>
                {sessions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {filteredRegistry.length === 0 ? (
              <div
                style={{
                  minHeight: 260,
                  padding: 42,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  border: '1px dashed var(--border)',
                  background: 'var(--muted)',
                  borderRadius: 4,
                }}
              >
                <strong>No Student Records</strong>
                <p style={{ color: 'var(--muted-foreground)', marginTop: 8 }}>No student records match your search or filters.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Name</th>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>JAMB Reg. No.</th>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Gender</th>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>School</th>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Department</th>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Session</th>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Status</th>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Added</th>
                      <th style={{ padding: 12, textAlign: 'left', fontWeight: 700 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistry.map((student) => (
                      <tr key={student.id} style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
                        <td style={{ padding: 12 }}>{student.name}</td>
                        <td style={{ padding: 12, fontFamily: 'monospace', fontSize: 11 }}>{student.jambNo}</td>
                        <td style={{ padding: 12 }}>{student.gender}</td>
                        <td style={{ padding: 12 }}>{student.school}</td>
                        <td style={{ padding: 12 }}>{student.department}</td>
                        <td style={{ padding: 12 }}>{student.session}</td>
                        <td style={{ padding: 12 }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '4px 8px',
                              borderRadius: 2,
                              fontSize: 10,
                              fontWeight: 700,
                              background: student.status === 'active' ? 'rgba(0, 107, 63, 0.15)' : 'rgba(215, 169, 0, 0.15)',
                              color: student.status === 'active' ? 'var(--primary)' : 'var(--deep)',
                            }}
                          >
                            {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                          </span>
                        </td>
                        <td style={{ padding: 12 }}>{student.added}</td>
                        <td style={{ padding: 12 }}>
                          <button style={{ padding: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', borderRadius: 2 }}>
                            <Eye style={{ width: 14, height: 14 }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AdminShell>
  )
}
