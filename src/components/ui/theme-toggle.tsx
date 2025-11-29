'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant='ghost' size='icon' className='h-9 w-9'>
        <Sun className='h-4 w-4' />
      </Button>
    )
  }

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    if (theme === 'light') {
      return <Sun className='h-4 w-4' />
    }
    if (theme === 'dark') {
      return <Moon className='h-4 w-4' />
    }
    return <Monitor className='h-4 w-4' />
  }

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={cycleTheme}
      className='h-9 w-9'
      aria-label='Toggle theme'
    >
      {getIcon()}
    </Button>
  )
}

export default ThemeToggle

