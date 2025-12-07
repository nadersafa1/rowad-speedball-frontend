import {
  adminClient,
  inferAdditionalFields,
  inferOrgAdditionalFields,
  organizationClient,
} from 'better-auth/client/plugins'
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
import type { auth } from '@/lib/auth'

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields<typeof auth>(),
    adminClient(),
    organizationClient({
      schema: inferOrgAdditionalFields<typeof auth>(),
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
