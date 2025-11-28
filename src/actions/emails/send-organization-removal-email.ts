import type { User } from 'better-auth'
import type { Organization } from 'better-auth/plugins/organization'
import { sendEmailAction } from '../send-email.action'

export const sendOrganizationRemovalEmail = async ({
  user,
  organization,
  role,
}: {
  user: User
  organization: Organization
  role: string
}) => {
  // Format role name for display
  const roleDisplayName =
    role === 'owner'
      ? 'Owner'
      : role === 'admin'
      ? 'Administrator'
      : role === 'coach'
      ? 'Coach'
      : role === 'player'
      ? 'Player'
      : role === 'super_admin'
      ? 'Super Administrator'
      : 'Member'

  await sendEmailAction({
    to: user.email,
    subject: `Removed from ${organization.name}`,
    meta: {
      description: `You have been removed from ${organization.name}. You previously held the role of ${roleDisplayName}. If you believe this is an error, please contact the organization administrator.`,
      link: `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}`,
      linkText: 'Visit Dashboard',
    },
  })
}
