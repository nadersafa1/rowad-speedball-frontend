import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/navigation/header'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SpeedballHub - Rowad Club',
  description:
    'A comprehensive web application for managing speedball sport data for Rowad club',
  keywords: 'speedball, rowad, sport, analytics, performance',
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <TooltipProvider>
          <Header />
          <main className='container mx-auto px-4 sm:px-6 lg:px-8 min-h-screen'>
            {children}
          </main>
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  )
}

export default RootLayout
