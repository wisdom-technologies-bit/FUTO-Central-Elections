import { NextResponse } from 'next/server'
import { fetchAdmissionPage, markDuplicates, mentionedSessions, parseAdmissionHtml, previewSummary } from '@/lib/student-import/parser'

export async function POST(request: Request) {
  try {
    const body = await request.json() as { url?: string; session?: string; departments?: string[] }
    if (!body.session?.trim()) return NextResponse.json({ error: 'Select an academic session before crawling.' }, { status: 400 })
    if (!body.url?.trim()) return NextResponse.json({ error: 'Enter an admission-list URL.' }, { status: 400 })
    const source = await fetchAdmissionPage(body.url)
    const parsed = markDuplicates(parseAdmissionHtml(source.html, body.departments ?? []))
    if (!parsed.length) return NextResponse.json({ error: 'We could not identify a supported student-record structure on this page. No records were imported.' }, { status: 422 })
    return NextResponse.json({ sourceUrl: source.url, session: body.session.trim(), records: parsed.map((record, index) => ({ ...record, id: `record-${index + 1}`, session: body.session!.trim() })), summary: previewSummary(parsed), warnings: mentionedSessions(source.html).filter((session) => session !== body.session!.trim()) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to crawl the admission-list page.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
