import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/navigation/header'
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
            <Header />
            <main className='min-h-[90dvh]'>{children}</main>
            <Toaster />
            <ImpersonationIndicator />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

export default RootLayout
