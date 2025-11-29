'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Camera, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Upload } from '@/components/ui/upload'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import ImageCropper from '@/components/ui/image-cropper'
import { useCloudinaryUpload } from '@/hooks/use-cloudinary-upload'
import { saveUserImage } from '@/lib/cloudinary-entity-helpers'
import type { User } from 'better-auth'

const ProfileImageUpload = ({ user }: { user: User }) => {
  const router = useRouter()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cropperOpen, setCropperOpen] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)

  const { uploadToCloudinary, isUploading } = useCloudinaryUpload({
    folder: 'profile-images',
    onSuccess: async (result) => {
      // Save to database
      const saveResponse = await saveUserImage(
        result.public_id,
        result.secure_url
      )

      if (!saveResponse.ok) {
        throw new Error('Failed to save image')
      }

      toast.success('Profile image updated successfully')
      setPreviewUrl(null)
      router.refresh()
    },
    onError: (error) => {
      console.error('Error uploading image:', error)
      setPreviewUrl(null)
    },
  })

  const handleUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Create preview URL and open cropper
    const reader = new FileReader()
    reader.onloadend = () => {
      const imageSrc = reader.result as string
      setImageToCrop(imageSrc)
      setCropperOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedFile: File) => {
    setCropperOpen(false)
    await uploadToCloudinary(croppedFile)
  }

  const displayImage = previewUrl || user.image

  return (
    <>
      <div className='flex flex-col items-center gap-4'>
        <div className='relative'>
          <Avatar className='h-24 w-24'>
            {displayImage ? (
              <AvatarImage src={displayImage} alt={user.name || 'Profile'} />
            ) : (
              <AvatarFallback className='text-2xl'>
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            )}
          </Avatar>
          {isUploading && (
            <div className='absolute inset-0 flex items-center justify-center rounded-full bg-black/50'>
              <Loader2 className='h-6 w-6 animate-spin text-white' />
            </div>
          )}
        </div>

        <div className='flex flex-col items-center gap-2'>
          <Upload
            onUpload={handleUpload}
            accept='image/*'
            maxSize={5 * 1024 * 1024}
            disabled={isUploading}
          >
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={isUploading}
              className='gap-2'
            >
              <Camera className='h-4 w-4' />
              {isUploading ? 'Uploading...' : 'Change Photo'}
            </Button>
          </Upload>
          <p className='text-xs text-muted-foreground'>
            JPG, PNG or GIF. Max size 5MB
          </p>
        </div>
      </div>

      {imageToCrop && (
        <ImageCropper
          imageSrc={imageToCrop}
          open={cropperOpen}
          onClose={() => {
            setCropperOpen(false)
            setImageToCrop(null)
          }}
          onCropComplete={handleCropComplete}
          aspect={1}
          cropShape='round'
        />
      )}
    </>
  )
}

export default ProfileImageUpload
