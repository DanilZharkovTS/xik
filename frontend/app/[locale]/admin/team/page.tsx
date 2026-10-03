import type { Metadata } from 'next'

import { TeamScreen } from '@/src/features/team/components/TeamScreen'

export const metadata: Metadata = {
  title: 'Team',
  robots: { index: false, follow: false },
}

const AdminTeamPage = () => {
  return <TeamScreen />
}

export default AdminTeamPage
