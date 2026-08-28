export type ParsedStudent = { name: string; jambNo: string; gender: string; school: string; department: string; status: 'valid' | 'duplicate' | 'review' | 'missing-jamb' | 'unmatched-dept'; issue?: string }

const clean = (value: string) => value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').replace(/<[^>]+>/g, ' ').trim()
const headers = { name: /^(full\s*)?(student|candidate)?\s*name$/i, jamb: /(jamb|reg(istration)?\.?\s*(no|number)|utme)/i, gender: /^(sex|gender)$/i, department: /(department|course|programme|program)/i, school: /(school|faculty|college)/i }
const cellValues = (html: string) => [...html.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((match) => clean(match[1]))
const indexOf = (row: string[], pattern: RegExp) => row.findIndex((value) => pattern.test(value.replace(/[.:]/g, '').trim()))

export const normalizeJamb = (value: string) => clean(value).toUpperCase().replace(/[^A-Z0-9]/g, '')
export const normalizeGender = (value: string) => /^(m|male)$/i.test(clean(value)) ? 'Male' : /^(f|female)$/i.test(clean(value)) ? 'Female' : ''

export function parseAdmissionHtml(html: string, departments: string[] = []): ParsedStudent[] {
  const departmentMap = new Map(departments.map((department) => [clean(department).toLowerCase(), department]))
  const records: ParsedStudent[] = []
  for (const tableMatch of html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)) {
    const rows = [...tableMatch[1].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((match) => cellValues(match[1])).filter((row) => row.length > 1)
    const header = rows.find((row) => row.some((value) => headers.name.test(value) || headers.jamb.test(value)))
    if (!header) continue
    const columns = { name: indexOf(header, headers.name), jamb: indexOf(header, headers.jamb), gender: indexOf(header, headers.gender), department: indexOf(header, headers.department), school: indexOf(header, headers.school) }
    for (const row of rows.slice(rows.indexOf(header) + 1)) {
      const value = (index: number) => index >= 0 ? clean(row[index] ?? '') : ''
      const name = value(columns.name), jambNo = normalizeJamb(value(columns.jamb)), gender = normalizeGender(value(columns.gender)), rawDepartment = value(columns.department)
      if (!name && !jambNo) continue
      const department = departmentMap.get(rawDepartment.toLowerCase()) ?? rawDepartment
      let status: ParsedStudent['status'] = 'valid', issue: string | undefined
      if (!jambNo) { status = 'missing-jamb'; issue = 'Missing JAMB registration number' }
      else if (!gender) { status = 'review'; issue = 'Gender could not be confidently identified' }
      else if (!rawDepartment) { status = 'review'; issue = 'Department is missing' }
      else if (departments.length > 0 && !departmentMap.has(rawDepartment.toLowerCase())) { status = 'unmatched-dept'; issue = 'Department not recognized in registry' }
      records.push({ name, jambNo, gender, school: value(columns.school), department, status, issue })
    }
  }
  return records.slice(0, 25000)
}

export function markDuplicates(records: ParsedStudent[], existing: string[] = []) {
  const seen = new Set(existing.map(normalizeJamb))
  return records.map((record) => {
    if (record.jambNo && seen.has(record.jambNo)) return { ...record, status: 'duplicate' as const, issue: 'JAMB registration number already exists for this session' }
    if (record.jambNo) seen.add(record.jambNo)
    return record
  })
}

export function previewSummary(records: ParsedStudent[]) { return { detected: records.length, valid: records.filter((r) => r.status === 'valid').length, duplicates: records.filter((r) => r.status === 'duplicate').length, review: records.filter((r) => r.status === 'review').length, missingJamb: records.filter((r) => r.status === 'missing-jamb').length, unmatchedDept: records.filter((r) => r.status === 'unmatched-dept').length } }
export function mentionedSessions(html: string) { return [...new Set((html.match(/20\d{2}\s*[\/-]\s*20\d{2}/g) ?? []).map((value) => value.replace(/\s/g, '').replace('-', '/')))] }

export function normalizePublicUrl(input: string) {
  const url = new URL(input)
  const host = url.hostname.toLowerCase()
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || host === 'localhost' || host.endsWith('.localhost') || host === 'metadata.google.internal' || host === '169.254.169.254' || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)) throw new Error('Only public HTTP(S) URLs are supported.')
  return url
}

export async function fetchAdmissionPage(input: string) {
  const url = normalizePublicUrl(input)
  const response = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: 'manual', cache: 'no-store', headers: { 'user-agent': 'FUTO-Central-Elections student registry importer' } })
  if (response.status >= 300 && response.status < 400) throw new Error('Redirected sources are not supported. Paste the final public page URL.')
  if (!response.ok) throw new Error(`The source page returned HTTP ${response.status}.`)
  if (!(response.headers.get('content-type') ?? '').match(/html|text/)) throw new Error('The source is not an HTML page.')
  const html = await response.text()
  if (html.length > 8000000) throw new Error('The source page is too large to process safely.')
  return { url: url.toString(), html }
}
