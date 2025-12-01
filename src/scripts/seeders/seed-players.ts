import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { players } from '@/db/schema'
import type {
  SeededUser,
  SeededOrganization,
  SeededMember,
  SeededPlayer,
} from './types'

// Arabic/Egyptian player names with RTL versions
const playerNamesWithRtl = [
  { name: 'Ahmed Hassan', nameRtl: 'أحمد حسن' },
  { name: 'Mohamed Ali', nameRtl: 'محمد علي' },
  { name: 'Omar Mahmoud', nameRtl: 'عمر محمود' },
  { name: 'Youssef Ibrahim', nameRtl: 'يوسف إبراهيم' },
  { name: 'Khaled Samir', nameRtl: 'خالد سمير' },
  { name: 'Mahmoud Fathy', nameRtl: 'محمود فتحي' },
  { name: 'Hassan Mostafa', nameRtl: 'حسن مصطفى' },
  { name: 'Ali Kamal', nameRtl: 'علي كمال' },
  { name: 'Amr Adel', nameRtl: 'عمرو عادل' },
  { name: 'Tamer Hosny', nameRtl: 'تامر حسني' },
  { name: 'Fatma Ahmed', nameRtl: 'فاطمة أحمد' },
  { name: 'Nour El-Din', nameRtl: 'نور الدين' },
  { name: 'Sara Mohamed', nameRtl: 'سارة محمد' },
  { name: 'Layla Hassan', nameRtl: 'ليلى حسن' },
  { name: 'Hana Ibrahim', nameRtl: 'هنا إبراهيم' },
  { name: 'Mariam Khaled', nameRtl: 'مريم خالد' },
  { name: 'Yasmin Omar', nameRtl: 'ياسمين عمر' },
  { name: 'Dina Mahmoud', nameRtl: 'دينا محمود' },
  { name: 'Rana Fathy', nameRtl: 'رنا فتحي' },
  { name: 'Mona Ali', nameRtl: 'منى علي' },
  { name: 'Kareem Saeed', nameRtl: 'كريم سعيد' },
  { name: 'Waleed Nabil', nameRtl: 'وليد نبيل' },
  { name: 'Sherif Gamal', nameRtl: 'شريف جمال' },
  { name: 'Tarek Essam', nameRtl: 'طارق عصام' },
  { name: 'Hazem Emad', nameRtl: 'حازم عماد' },
  { name: 'Ramy Ashraf', nameRtl: 'رامي أشرف' },
  { name: 'Wael Magdy', nameRtl: 'وائل مجدي' },
  { name: 'Bassem Yousry', nameRtl: 'باسم يسري' },
  { name: 'Hesham Kamal', nameRtl: 'هشام كمال' },
  { name: 'Ayman Reda', nameRtl: 'أيمن رضا' },
  { name: 'Noha Samir', nameRtl: 'نهى سمير' },
  { name: 'Aya Mostafa', nameRtl: 'آية مصطفى' },
  { name: 'Salma Adel', nameRtl: 'سلمى عادل' },
  { name: 'Reem Hassan', nameRtl: 'ريم حسن' },
  { name: 'Jana Mohamed', nameRtl: 'جنى محمد' },
  { name: 'Lina Omar', nameRtl: 'لينا عمر' },
  { name: 'Farida Ali', nameRtl: 'فريدة علي' },
  { name: 'Nada Khaled', nameRtl: 'ندى خالد' },
  { name: 'Malak Ibrahim', nameRtl: 'ملك إبراهيم' },
  { name: 'Heba Mahmoud', nameRtl: 'هبة محمود' },
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
      const playerData =
        playerNamesWithRtl[nameIndex % playerNamesWithRtl.length]
      const { name, nameRtl } = playerData
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
        organizationId = organizations[nameIndex % organizations.length].id
      }

      const [createdPlayer] = await db
        .insert(players)
        .values({
          name,
          nameRtl,
          dateOfBirth: generateDateOfBirth(dist.group),
          gender: isFemale ? 'female' : 'male',
          preferredHand: ['left', 'right', 'both'][
            Math.floor(Math.random() * 3)
          ] as 'left' | 'right' | 'both',
          teamLevel:
            dist.group === 'Seniors' || dist.group === 'U-21'
              ? 'team_a'
              : 'team_c',
          userId,
          organizationId,
        })
        .returning()

      seededPlayers.push({
        id: createdPlayer.id,
        name: createdPlayer.name,
        nameRtl: createdPlayer.nameRtl,
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
