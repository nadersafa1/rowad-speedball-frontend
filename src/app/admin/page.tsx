import { Building2, Users, ArrowRight, Globe } from 'lucide-react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AdminBreadcrumbWrapper } from './_components/breadcrumb-wrapper'

const AdminPage = () => {
  return (
    <div className='mx-auto container my-6 px-4'>
      <AdminBreadcrumbWrapper />
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight'>Admin Dashboard</h1>
        <p className='text-muted-foreground mt-2'>
          Manage clubs and users across the platform
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch'>
        <Link href='/admin/clubs' className='group h-full block'>
          <Card className='h-full flex flex-col transition-all hover:shadow-lg hover:border-primary/50'>
            <CardHeader className='p-4 flex-1 flex items-center'>
              <div className='flex items-center justify-between w-full'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors'>
                    <Building2 className='h-6 w-6 text-primary' />
                  </div>
                  <div>
                    <CardTitle>Clubs</CardTitle>
                    <CardDescription>
                      Manage clubs and assign admins/coaches
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className='h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all' />
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href='/admin/users' className='group h-full block'>
          <Card className='h-full flex flex-col transition-all hover:shadow-lg hover:border-primary/50'>
            <CardHeader className='p-4 flex-1 flex items-center'>
              <div className='flex items-center justify-between w-full'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors'>
                    <Users className='h-6 w-6 text-primary' />
                  </div>
                  <div>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>
                      Manage user accounts, roles, and permissions
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className='h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all' />
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href='/admin/federations' className='group h-full block'>
          <Card className='h-full flex flex-col transition-all hover:shadow-lg hover:border-primary/50'>
            <CardHeader className='p-4 flex-1 flex items-center'>
              <div className='flex items-center justify-between w-full'>
                <div className='flex items-center gap-3'>
                  <div className='rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors'>
                    <Globe className='h-6 w-6 text-primary' />
                  </div>
                  <div>
                    <CardTitle>Federations</CardTitle>
                    <CardDescription>
                      Manage federations and their settings
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className='h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all' />
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}

export default AdminPage
