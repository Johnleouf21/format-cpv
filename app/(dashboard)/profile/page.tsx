import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ProfilePageClient } from '@/components/profile/ProfilePageClient'

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <ProfilePageClient
      userId={session.user.id}
      userName={session.user.name || ''}
      userEmail={session.user.email || ''}
      userRole={session.user.role}
    />
  )
}
