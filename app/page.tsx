import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    // Redirect to role-specific dashboard
    switch (session.user.role) {
      case 'ADMIN':
        redirect('/admin')
      case 'TRAINER':
        redirect('/trainer')
      default:
        redirect('/learner')
    }
  }

  // Not authenticated, redirect to login
  redirect('/login')
}
