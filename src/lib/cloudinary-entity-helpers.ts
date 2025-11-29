/**
 * Entity-specific helpers for saving Cloudinary uploads to database
 */

export const saveUserImage = async (
  publicId: string,
  secureUrl: string
): Promise<Response> => {
  return fetch('/api/v1/users/me/image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      public_id: publicId,
      secure_url: secureUrl,
    }),
  })
}

export const saveOrganizationLogo = async (
  organizationId: string,
  publicId: string,
  secureUrl: string
): Promise<Response> => {
  return fetch(`/api/v1/organizations/${organizationId}/logo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      public_id: publicId,
      secure_url: secureUrl,
    }),
  })
}

export const savePlayerPhoto = async (
  playerId: string,
  publicId: string,
  secureUrl: string
): Promise<Response> => {
  return fetch(`/api/v1/players/${playerId}/photo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      public_id: publicId,
      secure_url: secureUrl,
    }),
  })
}

