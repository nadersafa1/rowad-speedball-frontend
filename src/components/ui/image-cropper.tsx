'use client'

import { useState, useCallback } from 'react'
import Cropper, { Area, Point } from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Slider } from '@/components/ui/slider'
import { getCroppedImg } from '@/lib/crop-image'

interface ImageCropperProps {
  imageSrc: string
  open: boolean
  onClose: () => void
  onCropComplete: (croppedFile: File) => void
  aspect?: number
  cropShape?: 'rect' | 'round'
}

const ImageCropper = ({
  imageSrc,
  open,
  onClose,
  onCropComplete,
  aspect = 1,
  cropShape = 'round',
}: ImageCropperProps) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropChange = useCallback((crop: Point) => {
    setCrop(crop)
  }, [])

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom)
  }, [])

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const handleCrop = async () => {
    if (!croppedAreaPixels) return

    setIsProcessing(true)
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, 0)
      const croppedFile = new File([croppedBlob], 'cropped-image.jpg', {
        type: 'image/jpeg',
      })
      onCropComplete(croppedFile)
      onClose()
    } catch (error) {
      console.error('Error cropping image:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
          <DialogDescription>
            Adjust the image to your liking. You can zoom and move the image
            around.
          </DialogDescription>
        </DialogHeader>

        <div className='relative h-[400px] w-full bg-black rounded-lg overflow-hidden'>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={cropShape}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            style={{
              containerStyle: {
                width: '100%',
                height: '100%',
                position: 'relative',
              },
            }}
          />
        </div>

        <div className='space-y-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Zoom</label>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(value) => setZoom(value[0])}
              className='w-full'
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleCrop} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Crop & Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ImageCropper

