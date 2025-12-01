import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { players } from '@/db/schema'
import type {
  SeededUser,
  SeededOrganization,
  SeededMember,
  SeededPlayer,
} from './types'

// Arabic/Egyptian player names
const playerNames = [
  'Ahmed Hassan',
  'Mohamed Ali',
  'Omar Mahmoud',
  'Youssef Ibrahim',
  'Khaled Samir',
  'Mahmoud Fathy',
  'Hassan Mostafa',
  'Ali Kamal',
  'Amr Adel',
  'Tamer Hosny',
  'Fatma Ahmed',
  'Nour El-Din',
  'Sara Mohamed',
  'Layla Hassan',
  'Hana Ibrahim',
  'Mariam Khaled',
  'Yasmin Omar',
  'Dina Mahmoud',
  'Rana Fathy',
  'Mona Ali',
  'Kareem Saeed',
  'Waleed Nabil',
  'Sherif Gamal',
  'Tarek Essam',
  'Hazem Emad',
  'Ramy Ashraf',
  'Wael Magdy',
  'Bassem Yousry',
  'Hesham Kamal',
  'Ayman Reda',
  'Noha Samir',
  'Aya Mostafa',
  'Salma Adel',
  'Reem Hassan',
  'Jana Mohamed',
  'Lina Omar',
  'Farida Ali',
  'Nada Khaled',
  'Malak Ibrahim',
  'Heba Mahmoud',
]

// Generate date of birth for different age groups
const generateDateOfBirth = (ageGroup: string): string => {
  const today = new Date()
  let minAge: number, maxAge: number

  switch (ageGroup) {
    case 'mini':
      minAge = 5
      maxAge = 7
      break
    case 'U-09':
      minAge = 8
      maxAge = 9
      break
    case 'U-11':
      minAge = 10
      maxAge = 11
      break
    case 'U-13':
      minAge = 12
      maxAge = 13
      break
    case 'U-15':
      minAge = 14
      maxAge = 15
      break
    case 'U-17':
      minAge = 16
      maxAge = 17
      break
    case 'U-19':
      minAge = 18
      maxAge = 19
      break
    case 'U-21':
      minAge = 20
      maxAge = 21
      break
    default: // Seniors
      minAge = 22
      maxAge = 35
      break
  }

  const age = minAge + Math.floor(Math.random() * (maxAge - minAge + 1))
  const birthYear = today.getFullYear() - age
  const birthMonth = Math.floor(Math.random() * 12)
  const birthDay = Math.floor(Math.random() * 28) + 1

  return new Date(birthYear, birthMonth, birthDay).toISOString().split('T')[0]
}

// Age group distribution for 40 players
const ageGroupDistribution = [
  { group: 'mini', count: 4 },
  { group: 'U-09', count: 4 },
  { group: 'U-11', count: 5 },
  { group: 'U-13', count: 5 },
  { group: 'U-15', count: 5 },
  { group: 'U-17', count: 5 },
  { group: 'U-19', count: 4 },
  { group: 'U-21', count: 4 },
  { group: 'Seniors', count: 4 },
]

export const seedPlayers = async (
  db: NodePgDatabase,
  users: SeededUser[],
  organizations: SeededOrganization[],
  members: SeededMember[]
): Promise<SeededPlayer[]> => {
  console.log('🌱 Seeding players...')

  const seededPlayers: SeededPlayer[] = []

  // Find users who are members with 'player' role
  const playerMembers = members.filter((m) => m.role === 'player')

  let playerIndex = 0
  let nameIndex = 0

  for (const dist of ageGroupDistribution) {
    for (let i = 0; i < dist.count; i++) {
      const name = playerNames[nameIndex % playerNames.length]
      const isFemale = name.match(
        /^(Fatma|Nour|Sara|Layla|Hana|Mariam|Yasmin|Dina|Rana|Mona|Noha|Aya|Salma|Reem|Jana|Lina|Farida|Nada|Malak|Heba)/
      )

      // Link some players to users who have player membership
      let userId: string | null = null
      let organizationId: string | null = null

      if (playerIndex < playerMembers.length) {
        const playerMember = playerMembers[playerIndex]
        userId = playerMember.userId
        organizationId = playerMember.organizationId
        playerIndex++
      } else {
        // Assign to random organization without user link
        organizationId =
          organizations[nameIndex % organizations.length].id
      }

      const [createdPlayer] = await db
        .insert(players)
        .values({
          name,
          dateOfBirth: generateDateOfBirth(dist.group),
          gender: isFemale ? 'female' : 'male',
          preferredHand: ['left', 'right', 'both'][
            Math.floor(Math.random() * 3)
          ] as 'left' | 'right' | 'both',
          isFirstTeam: dist.group === 'Seniors' || dist.group === 'U-21',
          userId,
          organizationId,
        })
        .returning()

      seededPlayers.push({
        id: createdPlayer.id,
        name: createdPlayer.name,
        userId: createdPlayer.userId,
        organizationId: createdPlayer.organizationId,
        gender: createdPlayer.gender as 'male' | 'female',
        dateOfBirth: createdPlayer.dateOfBirth,
        preferredHand: createdPlayer.preferredHand as 'left' | 'right' | 'both',
      })

      nameIndex++
    }
  }

  console.log(`✅ Created ${seededPlayers.length} players`)
  return seededPlayers
}

