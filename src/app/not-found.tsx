import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const NotFound = () => {
  return (
    <div className='container mx-auto px-4 py-16'>
      <Card className='max-w-2xl mx-auto'>
        <CardHeader className='text-center'>
          <CardTitle className='text-4xl font-bold'>404</CardTitle>
          <CardDescription className='text-xl mt-2'>
            Page Not Found
          </CardDescription>
        </CardHeader>
        <CardContent className='text-center space-y-6'>
          <p className='text-muted-foreground'>
            The page you are looking for does not exist or has been moved.
          </p>
          <div className='flex justify-center gap-4'>
            <Button asChild>
              <Link href='/'>Go Home</Link>
            </Button>
            <Button variant='outline' asChild>
              <Link href='/admin/users'>Admin Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default NotFound

