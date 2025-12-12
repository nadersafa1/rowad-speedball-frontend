import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { eq } from 'drizzle-orm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import * as schema from '@/db/schema'
import UserProfileForm from './_components/user-profile-form'
import ChangePasswordForm from './_components/change-password-form'
import SetPasswordButton from './_components/set-password-button'
import PlayerProfileForm from './_components/player-profile-form'
import CoachProfileForm from './_components/coach-profile-form'
import { UserCircle } from 'lucide-react'
import { ProfileBreadcrumbWrapper } from './_components/breadcrumb-wrapper'

const ProfilePage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return redirect('/auth/login')
  }

  const userId = session.user.id

  // Fetch user data
  const user = await db.query.user.findFirst({
    where: eq(schema.user.id, userId),
  })

  if (!user) {
    return redirect('/auth/login')
  }

  // Fetch linked player and coach data
  const [player, coach, accounts] = await Promise.all([
    db.query.players.findFirst({
      where: eq(schema.players.userId, userId),
    }),
    db.query.coaches.findFirst({
      where: eq(schema.coaches.userId, userId),
    }),
    auth.api.listUserAccounts({
      headers: await headers(),
    }),
  ])

  const hasPasswordAccount = accounts?.some(
    (account) => account.providerId === 'credential'
  )

  return (
    <div className="max-w-4xl mx-auto my-6 px-4">
      <ProfileBreadcrumbWrapper />
      <div className="mb-8">
        <div className="flex items-center gap-4">
          {user?.image ? (
            <Image
              alt={user?.name || 'User'}
              height={64}
              src={user.image}
              width={64}
              className="rounded-full"
            />
          ) : (
            <UserCircle className="size-16 text-muted-foreground" />
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{user?.name || 'User Profile'}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your name and email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserProfileForm user={user} />
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              {hasPasswordAccount
                ? 'Change your password for improved security'
                : 'Set a password for your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasPasswordAccount ? (
              <ChangePasswordForm />
            ) : (
              <SetPasswordButton email={user?.email || ''} />
            )}
          </CardContent>
        </Card>

        {/* Player Profile Card */}
        {player && (
          <Card>
            <CardHeader>
              <CardTitle>Player Profile</CardTitle>
              <CardDescription>
                Update your player information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlayerProfileForm player={player} />
            </CardContent>
          </Card>
        )}

        {/* Coach Profile Card */}
        {coach && (
          <Card>
            <CardHeader>
              <CardTitle>Coach Profile</CardTitle>
              <CardDescription>
                Update your coach information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CoachProfileForm coach={coach} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default ProfilePage

