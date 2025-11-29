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
  User,
  ChevronDown,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { OrganizationRole } from '@/types/organization'

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
  const { data: session } = authClient.useSession()

  const {
    isSystemAdmin,
    isAdmin,
    isOwner,
    isCoach,
    isAuthenticated,
    role,
    organization,
  } = context
  const pathname = usePathname()

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)

  const logout = async () => {
    await authClient.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const getUserRoleLabel = () => {
    if (isSystemAdmin) return 'System Admin'
    if (role === OrganizationRole.OWNER) return 'Owner'
    if (role === OrganizationRole.ADMIN) return 'Admin'
    if (role === OrganizationRole.COACH) return 'Coach'
    if (role === OrganizationRole.PLAYER) return 'Player'
    if (role === OrganizationRole.MEMBER) return 'Member'
    return 'User'
  }

  const getUserInitials = (name: string | null | undefined) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name[0].toUpperCase()
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

          {/* User Actions */}
          <div className='hidden md:flex md:items-center md:space-x-4'>
            {isAuthenticated && session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='ghost'
                    className='flex items-center gap-2 h-auto py-2 px-3 hover:bg-gray-50'
                  >
                    <Avatar className='h-8 w-8'>
                      <AvatarImage
                        src={session.user.image || undefined}
                        alt={session.user.name || 'User'}
                      />
                      <AvatarFallback>
                        {getUserInitials(session.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex flex-col items-start text-left'>
                      <span className='text-sm font-medium text-gray-900'>
                        {session.user.name || 'User'}
                      </span>
                      <span className='text-xs text-gray-500'>
                        {organization?.name || getUserRoleLabel()}
                      </span>
                    </div>
                    <ChevronDown className='h-4 w-4 text-gray-500' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-56'>
                  <DropdownMenuLabel>
                    <div className='flex flex-col space-y-1'>
                      <p className='text-sm font-medium leading-none'>
                        {session.user.name || 'User'}
                      </p>
                      <p className='text-xs leading-none text-muted-foreground'>
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className='text-xs text-muted-foreground'>
                    {organization?.name && (
                      <div className='flex flex-col space-y-1'>
                        <span className='font-medium'>Organization</span>
                        <span>{organization.name}</span>
                      </div>
                    )}
                    <div className='flex flex-col space-y-1 mt-2'>
                      <span className='font-medium'>Role</span>
                      <span>{getUserRoleLabel()}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href='/profile' className='cursor-pointer'>
                      <User className='mr-2 h-4 w-4' />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault()
                          setLogoutDialogOpen(true)
                        }}
                        className='text-destructive cursor-pointer'
                      >
                        <LogOut className='mr-2 h-4 w-4' />
                        Logout
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to logout? You will need to login
                          again to access your account.
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
                </DropdownMenuContent>
              </DropdownMenu>
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
              {isAuthenticated && session?.user ? (
                <>
                  <div className='flex items-center gap-3 px-3 py-2'>
                    <Avatar className='h-10 w-10'>
                      <AvatarImage
                        src={session.user.image || undefined}
                        alt={session.user.name || 'User'}
                      />
                      <AvatarFallback>
                        {getUserInitials(session.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex flex-col flex-1 min-w-0'>
                      <span className='text-sm font-medium text-gray-900 truncate'>
                        {session.user.name || 'User'}
                      </span>
                      <span className='text-xs text-gray-500 truncate'>
                        {organization?.name || getUserRoleLabel()}
                      </span>
                    </div>
                  </div>
                  <Link
                    href='/profile'
                    onClick={() => setMobileMenuOpen(false)}
                    className='flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-rowad-600 hover:bg-gray-50'
                  >
                    <User className='h-5 w-5' />
                    <span>Profile</span>
                  </Link>
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
                          Are you sure you want to logout? You will need to login
                          again to access your account.
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
                </>
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
