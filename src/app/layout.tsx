import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ConditionalLayout } from '@/components/layouts/conditional-layout'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ImpersonationIndicator } from '@/components/auth/impersonation-indicator'
import { ThemeProvider } from '@/components/ui/theme-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SpeedballHub - Rowad Club',
  description:
    'A comprehensive web application for managing speedball sport data for Rowad club',
  keywords: 'speedball, rowad, sport, analytics, performance',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute='class' defaultTheme='light' enableSystem>
          <TooltipProvider>
            <ConditionalLayout>{children}</ConditionalLayout>
            <Toaster />
            <ImpersonationIndicator />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

export default RootLayout
