import GridSingleItem from '@/components/gird-single-item'
import { SinglePageHeader } from '@/components/ui'
import { Award, Building2, Globe, Trophy, Users } from 'lucide-react'

const ADMIN_ITEMS = [
  {
    href: '/admin/clubs',
    title: 'Clubs',
    description: 'Manage clubs and assign admins/coaches',
    Icon: Building2,
  },
  {
    href: '/admin/users',
    title: 'Users',
    description: 'Manage user accounts, roles, and permissions',
    Icon: Users,
  },
  {
    href: '/admin/federations',
    title: 'Federations',
    description: 'Manage federations and their settings',
    Icon: Globe,
  },
  {
    href: '/admin/placement-tiers',
    title: 'Placement Tiers',
    description: 'Manage global placement tier categories',
    Icon: Award,
  },
  {
    href: '/admin/points-schemas',
    title: 'Points Schemas',
    description: 'Manage event points allocation systems',
    Icon: Trophy,
  },
]

const AdminPage = () => {
  return (
    <div className='container mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8'>
      <SinglePageHeader />
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight'>Admin Dashboard</h1>
        <p className='text-muted-foreground mt-2'>
          Manage clubs and users across the platform
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch'>
        {ADMIN_ITEMS.map((item) => (
          <GridSingleItem
            key={item.href}
            href={item.href}
            title={item.title}
            description={item.description}
            Icon={item.Icon}
          />
        ))}
      </div>
    </div>
  )
}

export default AdminPage
