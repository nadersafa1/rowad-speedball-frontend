import { Area } from 'react-easy-crop'

/**
 * Creates a cropped image blob from the original image and crop area
 */
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.src = url
  })

/**
 * Gets the cropped image blob from the original image and crop area
 * pixelCrop should be in pixels relative to the natural image size
 */
export const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<Blob> => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  // Calculate scale factor between displayed image and natural image
  // react-easy-crop provides pixelCrop relative to natural image size
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height

  // Set canvas dimensions to crop size
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Draw the cropped portion of the image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'))
          return
        }
        resolve(blob)
      },
      'image/jpeg',
      0.95
    )
  })
}

