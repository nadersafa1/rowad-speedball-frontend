'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Users,
  Calendar,
  ClipboardCheck,
  Trophy,
  UserCheck,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  User,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useOrganizationContext } from '@/hooks/authorization/use-organization-context'

const features = [
  {
    icon: Users,
    title: 'Player Management',
    description:
      'Comprehensive player profiles with age groups, gender, and team assignments. Track player information and performance metrics.',
  },
  {
    icon: Calendar,
    title: 'Training Sessions',
    description:
      'Schedule and manage training sessions with attendance tracking. Monitor player participation and session details.',
  },
  {
    icon: ClipboardCheck,
    title: 'Tests & Assessments',
    description:
      'Conduct and track player tests and assessments. Monitor progress and performance over time.',
  },
  {
    icon: Trophy,
    title: 'Events & Matches',
    description:
      'Organize events and matches. Track registrations, results, and match statistics.',
  },
  {
    icon: UserCheck,
    title: 'Coach Management',
    description:
      'Manage coach profiles and assignments. Track coach responsibilities and team associations.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description:
      'View comprehensive analytics and insights for team performance and player development.',
  },
]

const benefits = [
  'Centralized player and team management',
  'Real-time attendance tracking',
  'Performance monitoring and analytics',
  'Event and match organization',
  'Coach assignment and management',
  'Secure and role-based access control',
]

export default function LandingPage() {
  const { data: session } = authClient.useSession()
  const { isLoading: isContextLoading, context } = useOrganizationContext()
  const { isSystemAdmin, isPlayer } = context
  const isAuthenticated = !!session?.user

  const isLoading = isContextLoading

  return (
    <div className='min-h-screen bg-gradient-to-b from-background to-card'>
      {/* Hero Section */}
      <section className='container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24'>
        <div className='max-w-4xl mx-auto text-center'>
          <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6'>
            Rowad Speedball
            <span className='block text-rowad-600 dark:text-rowad-400 mt-2'>
              Management Platform
            </span>
          </h1>
          <p className='text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto'>
            Streamline your speedball team management with comprehensive tools
            for players, coaches, training sessions, and events.
          </p>
          {!isLoading && (
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              {isAuthenticated && !isSystemAdmin ? (
                <>
                  <Button asChild size='lg' className='text-lg px-8 py-6'>
                    <Link href={isPlayer ? '/attendance' : '/attendance/club'}>
                      {isPlayer ? 'My Attendance' : 'My Club Attendance'}
                      <ArrowRight className='ml-2 h-5 w-5' />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant='outline'
                    size='lg'
                    className='text-lg px-8 py-6'
                  >
                    <Link href='/profile'>
                      <User className='mr-2 h-5 w-5' />
                      My Profile
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size='lg' className='text-lg px-8 py-6'>
                    <Link href='/auth/login'>
                      Get Started
                      <ArrowRight className='ml-2 h-5 w-5' />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant='outline'
                    size='lg'
                    className='text-lg px-8 py-6'
                  >
                    <Link href='/auth/login'>Sign In</Link>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className='container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 bg-card'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-12 sm:mb-16'>
            <h2 className='text-3xl sm:text-4xl font-bold text-foreground mb-4'>
              Everything You Need to Manage Your Team
            </h2>
            <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
              Powerful features designed to help you manage players, track
              attendance, organize events, and monitor performance.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8'>
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className='p-6 rounded-lg border border-border hover:border-rowad-300 dark:hover:border-rowad-700 hover:shadow-lg transition-all duration-200 bg-background'
                >
                  <div className='bg-rowad-50 dark:bg-rowad-900/30 rounded-lg p-3 w-fit mb-4'>
                    <Icon className='h-6 w-6 text-rowad-600 dark:text-rowad-400' />
                  </div>
                  <h3 className='text-xl font-semibold text-foreground mb-2'>
                    {feature.title}
                  </h3>
                  <p className='text-muted-foreground'>{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className='container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 bg-muted/50'>
        <div className='max-w-4xl mx-auto'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl sm:text-4xl font-bold text-foreground mb-4'>
              Why Choose Rowad Speedball Platform?
            </h2>
            <p className='text-lg text-muted-foreground'>
              Built for speedball teams and organizations of all sizes
            </p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6'>
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className='flex items-start gap-3 p-4 bg-card rounded-lg border border-border'
              >
                <CheckCircle2 className='h-5 w-5 text-rowad-600 dark:text-rowad-400 flex-shrink-0 mt-0.5' />
                <p className='text-foreground'>{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isLoading && (
        <section className='container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24'>
          <div className='max-w-3xl mx-auto text-center bg-rowad-50 dark:bg-rowad-900/30 rounded-2xl p-8 sm:p-12 border border-border'>
            {isAuthenticated ? (
              <>
                <h2 className='text-3xl sm:text-4xl font-bold text-foreground mb-4'>
                  Welcome back, {session?.user?.name || 'User'}!
                </h2>
                <p className='text-lg text-muted-foreground mb-8'>
                  Continue managing your team with our comprehensive platform.
                </p>
                <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                  <Button asChild size='lg' className='text-lg px-8 py-6'>
                    <Link href={isPlayer ? '/attendance' : '/attendance/club'}>
                      {isPlayer ? 'My Attendance' : 'My Club Attendance'}
                      <ArrowRight className='ml-2 h-5 w-5' />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant='outline'
                    size='lg'
                    className='text-lg px-8 py-6'
                  >
                    <Link href='/profile'>My Profile</Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className='text-3xl sm:text-4xl font-bold text-foreground mb-4'>
                  Ready to Get Started?
                </h2>
                <p className='text-lg text-muted-foreground mb-8'>
                  Join teams already using Rowad Speedball Platform to manage
                  their players and events.
                </p>
                <Button asChild size='lg' className='text-lg px-8 py-6'>
                  <Link href='/auth/login'>
                    Sign In to Your Account
                    <ArrowRight className='ml-2 h-5 w-5' />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className='border-t border-border bg-card'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='text-center text-muted-foreground'>
            <p>
              © {new Date().getFullYear()} Rowad Speedball Platform. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
