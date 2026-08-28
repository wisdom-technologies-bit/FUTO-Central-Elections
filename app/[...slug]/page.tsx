import Link from 'next/link'

export default async function Placeholder({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const title = slug.length ? slug[slug.length - 1].replaceAll('-', ' ') : 'page'
  return <main className="site-container" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '6rem 0' }}><div><span className="eyebrow">FUTO CENTRAL ELECTIONS</span><h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(2.5rem, 7vw, 5rem)', textTransform: 'capitalize', margin: '1rem 0' }}>{title}</h1><p style={{ color: 'var(--muted-foreground)', maxWidth: 460, lineHeight: 1.7, margin: '0 auto 2rem' }}>This page is part of the FUTO Central Elections platform and will be available in a future release.</p><Link className="button button-primary" href="/">Return Home</Link></div></main>
}
