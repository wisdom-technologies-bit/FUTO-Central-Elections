import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'FUTO Central Elections', template: '%s | FUTO Central Elections' },
  description: 'A digital platform for organized, transparent, and accessible FUTO student elections.',
  generator: 'FUTO Central Elections',
  icons: { icon: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/favicon-32x32-dc4I8kqSPTuNrIZZerO2tEJDZSUgXS.png', apple: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/apple-touch-icon-JN434Mr0BZJ1PlsqzvV18UskzypDS4.png' },
}

export const viewport: Viewport = { colorScheme: 'light', themeColor: '#fbfcfa', userScalable: true }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="bg-background"><body>{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
