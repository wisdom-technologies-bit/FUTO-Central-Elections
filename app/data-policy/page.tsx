import type { Metadata } from 'next'
import DataPolicyPage from '@/components/elections/data-policy-page'

export const metadata: Metadata = {
  title: 'Data Sources & Retention',
  description: 'Learn how FUTO Central Elections uses student information for eligibility, verification, election integrity, security, and appropriate recordkeeping.',
}

export default function Page() {
  return <DataPolicyPage />
}
