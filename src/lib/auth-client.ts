import { adminClient, organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import {
  ac,
  admin,
  coach,
  member,
  owner,
  player,
  superAdmin,
} from '@/components/auth/permissions'

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    organizationClient({
      ac,
      roles: {
        owner,
        admin,
        coach,
        player,
        member,
        superAdmin,
      },
    }),
  ],
  fetchOptions: {
    credentials: 'include',
  },
})
