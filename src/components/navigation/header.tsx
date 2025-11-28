'use client'

import { Button } from '@/components/ui/button'
import { useOrganizationContext } from '@/hooks/use-organization-context'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import {
  Calendar,
  LogOut,
  Menu,
  ShieldCheck,
  Table2,
  Trophy,
  UserCheck,
  Volleyball,
  X,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const navigation = [
  // { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Players', href: '/players', icon: Volleyball },
  { name: 'Tests', href: '/tests', icon: Table2 },
  { name: 'Events', href: '/events', icon: Trophy },
]

const adminNavigation = [
  { name: 'Coaches', href: '/coaches', icon: UserCheck },
  { name: 'Sessions', href: '/sessions', icon: Calendar },
  // { name: 'Clubs', href: '/clubs', icon: Building2 },
  { name: 'Admin', href: '/admin', icon: ShieldCheck },
]

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()

  const { context } = useOrganizationContext()

  const { isSystemAdmin, isAdmin, isOwner, isCoach, isAuthenticated } = context
  const pathname = usePathname()

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  const logout = async () => {
    await authClient.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className='bg-white shadow-sm border-b'>
      <nav className='container mx-auto px-4 sm:px-6 lg:px-8' aria-label='Top'>
        <div className='flex w-full items-center justify-between py-4'>
          {/* Logo */}
          <div className='flex items-center'>
            <Link href='/' className='flex items-center'>
              <Image src='/logo.png' alt='Rowad Club' width={60} height={60} />
              <div className='hidden sm:block'>
                <Image
                  src='/logo-text.png'
                  alt='Rowad Speedball Team'
                  width={120}
                  height={20}
                />
              </div>
              <div className='sm:hidden'>
                <span className='text-xl font-bold text-gray-900'>
                  SpeedballHub
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className='hidden md:flex md:space-x-8'>
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-rowad-100 text-rowad-700'
                      : 'text-gray-600 hover:text-rowad-600 hover:bg-gray-50'
                  )}
                >
                  <Icon className='h-4 w-4' />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            {(isSystemAdmin || isAdmin || isOwner || isCoach) &&
              adminNavigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                if (
                  item.name === 'Coaches' &&
                  !isSystemAdmin &&
                  !isAdmin &&
                  !isOwner
                ) {
                  return null
                }
                if (item.name === 'Admin' && !isSystemAdmin) {
                  return null
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-rowad-100 text-rowad-700'
                        : 'text-gray-600 hover:text-rowad-600 hover:bg-gray-50'
                    )}
                  >
                    <Icon className='h-4 w-4' />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
          </div>

          {/* Admin Actions */}
          <div className='hidden md:flex md:items-center md:space-x-4'>
            {isAuthenticated ? (
              <>
                <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant='outline'
                      size='sm'
                      className='gap-2'
                    >
                      <LogOut className='h-4 w-4' />
                      Logout
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to logout? You will need to login again to access your account.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={logout}
                        className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                      >
                        Logout
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <Link href='/auth/login'>
                <Button variant='outline' size='sm'>
                  Login
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className='md:hidden'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className='p-2'
            >
              {mobileMenuOpen ? (
                <X className='h-6 w-6' />
              ) : (
                <Menu className='h-6 w-6' />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className='md:hidden border-t pt-4 pb-4'>
            <div className='space-y-1'>
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors',
                      isActive
                        ? 'bg-rowad-100 text-rowad-700'
                        : 'text-gray-600 hover:text-rowad-600 hover:bg-gray-50'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className='h-5 w-5' />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
              {(isSystemAdmin || isAdmin || isOwner || isCoach) &&
                adminNavigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  if (
                    item.name === 'Coaches' &&
                    !isSystemAdmin &&
                    !isAdmin &&
                    !isOwner
                  ) {
                    return null
                  }
                  if (item.name === 'Admin' && !isSystemAdmin) {
                    return null
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors',
                        isActive
                          ? 'bg-rowad-100 text-rowad-700'
                          : 'text-gray-600 hover:text-rowad-600 hover:bg-gray-50'
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className='h-5 w-5' />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
            </div>
            <div className='mt-4 pt-4 border-t space-y-2'>
              {isAuthenticated ? (
                <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setMobileMenuOpen(false)}
                      className='w-full gap-2'
                    >
                      <LogOut className='h-4 w-4' />
                      Logout
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to logout? You will need to login again to access your account.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          logout()
                          setMobileMenuOpen(false)
                        }}
                        className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                      >
                        Logout
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Link
                  href='/auth/login'
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button variant='outline' size='sm' className='w-full'>
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}

export default Header
