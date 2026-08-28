import { NextResponse } from 'next/server'
import { fetchAdmissionPage, markDuplicates, mentionedSessions, parseAdmissionHtml, previewSummary } from '@/lib/student-import/parser'

export async function POST(request: Request) {
  try {
    const body = await request.json() as { url?: string; session?: string; departments?: string[] }
    if (!body.session?.trim()) return NextResponse.json({ error: 'Select an academic session before crawling.' }, { status: 400 })
    if (!body.url?.trim()) return NextResponse.json({ error: 'Enter an admission-list URL.' }, { status: 400 })
    const source = await fetchAdmissionPage(body.url)
    let sourceHtml = source.html
    let parsed = parseAdmissionHtml(sourceHtml, body.departments ?? [])
    // Index pages often contain only links to the actual merit/supplementary
    // lists. Follow same-host admission links when the landing page has no rows.
    if (!parsed.length) {
      const base = new URL(source.url)
      const links = [...sourceHtml.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
        .map((match) => ({ href: match[1], text: match[2].replace(/<[^>]+>/g, ' ') }))
        .filter(({ href, text }) => /admission|merit|supplementary|direct-entry|jupeb/i.test(`${href} ${text}`))
        .map(({ href }) => new URL(href, base).toString())
        .filter((href, index, values) => new URL(href).hostname === base.hostname && values.indexOf(href) === index)
        .slice(0, 8)
      for (const link of links) {
        try {
          const linked = await fetchAdmissionPage(link)
          const linkedRecords = parseAdmissionHtml(linked.html, body.departments ?? [])
          if (linkedRecords.length) { sourceHtml += linked.html; parsed = parsed.concat(linkedRecords) }
        } catch { /* One bad linked page must not block the rest of the import. */ }
      }
    }
    parsed = markDuplicates(parsed)
    if (!parsed.length) return NextResponse.json({ error: 'We could not identify a supported student-record structure on this page or its linked admission lists. No records were imported.' }, { status: 422 })
    return NextResponse.json({ sourceUrl: source.url, session: body.session.trim(), records: parsed.map((record, index) => ({ ...record, id: `record-${index + 1}`, session: body.session!.trim() })), summary: previewSummary(parsed), warnings: mentionedSessions(sourceHtml).filter((session) => session !== body.session!.trim()) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to crawl the admission-list page.'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
