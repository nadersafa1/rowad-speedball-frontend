import type { User } from 'better-auth'
import type { Organization } from 'better-auth/plugins/organization'
import { sendEmailAction } from '../send-email.action'

export const sendOrganizationWelcomeEmail = async ({
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
            : 'Member'

  await sendEmailAction({
    to: user.email,
    subject: `Welcome to ${organization.name}!`,
    meta: {
      description: `Welcome to ${organization.name}! You have been added as a ${roleDisplayName}. We're excited to have you on board!`,
      link: `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}`,
      linkText: 'Access Your Dashboard',
    },
  })
}

