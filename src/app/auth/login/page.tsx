'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { authClient } from '@/lib/auth-client'
import EmailVerification from './_components/email-verification'
import ForgotPasswordTab from './_components/forgot-password'
import SignInTab from './_components/sign-in.tab'
import SignUpTab from './_components/sign-up.tab'
import SocialAuthButtons from './_components/social-auth-buttons'

type SelectedTab =
  | 'signin'
  | 'signup'
  | 'email-verification'
  | 'forgot-password'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [selectedTab, setSelectedTab] = useState<SelectedTab>('signin')

  const router = useRouter()

  useEffect(() => {
    authClient.getSession().then((session) => {
      if (session?.data) {
        router.push('/')
      }
    })
  }, [router])

  const openEmailVerification = (email: string) => {
    setEmail(email)
    setSelectedTab('email-verification')
  }

  const openForgotPassword = () => {
    setSelectedTab('forgot-password')
  }

  return (
    <div className='flex items-center justify-center min-h-[calc(90vh-80px)] py-8 px-4'>
      <div className='w-full max-w-md'>
        <Tabs
          className='w-full'
          onValueChange={(value) => setSelectedTab(value as SelectedTab)}
          value={selectedTab}
        >
          {['signin', 'signup'].includes(selectedTab) && (
            <TabsList>
              <TabsTrigger value='signin'>Sign In</TabsTrigger>
              <TabsTrigger value='signup'>Sign Up</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value='signin'>
            <Card>
              <CardHeader className='text-2xl font-bold'>
                <CardTitle>Sign In</CardTitle>
              </CardHeader>
              <CardContent>
                <SignInTab
                  openEmailVerification={openEmailVerification}
                  openForgotPassword={openForgotPassword}
                />
              </CardContent>
              <CardFooter className='grid grid-cols-1 gap-3'>
                <SocialAuthButtons />
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value='signup'>
            <Card>
              <CardHeader className='text-2xl font-bold'>
                <CardTitle>Sign Up</CardTitle>
              </CardHeader>
              <CardContent>
                <SignUpTab openEmailVerification={openEmailVerification} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value='email-verification'>
            <Card>
              <CardHeader className='text-2xl font-bold'>
                <CardTitle>Verify Your Email</CardTitle>
              </CardHeader>
              <CardContent>
                <EmailVerification email={email} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value='forgot-password'>
            <Card>
              <CardHeader className='text-2xl font-bold'>
                <CardTitle>Forgot Password</CardTitle>
              </CardHeader>
              <CardContent>
                <ForgotPasswordTab
                  openSignIn={() => setSelectedTab('signin')}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default LoginPage
