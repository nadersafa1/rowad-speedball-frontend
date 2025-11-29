/**
 * Cloudinary Integration Usage Examples
 * 
 * This file demonstrates how to use the Cloudinary integration throughout the app.
 * All examples use the reusable hooks and utilities.
 */

/* Example 1: Simple Image Upload (No Cropping)
 * 
 * import { useCloudinaryUpload } from '@/hooks/use-cloudinary-upload'
 * import { saveOrganizationLogo } from '@/lib/cloudinary-entity-helpers'
 * 
 * const MyComponent = () => {
 *   const { uploadToCloudinary, isUploading } = useCloudinaryUpload({
 *     folder: 'organization-logos',
 *     onSuccess: async (result) => {
 *       const response = await saveOrganizationLogo(orgId, result.public_id, result.secure_url)
 *       if (response.ok) {
 *         toast.success('Logo updated!')
 *       }
 *     },
 *   })
 * 
 *   const handleFileSelect = async (file: File) => {
 *     await uploadToCloudinary(file)
 *   }
 * 
 *   return <Upload onUpload={handleFileSelect} disabled={isUploading} />
 * }
 */

/* Example 2: Image Upload with Cropping
 * 
 * import { useState } from 'react'
 * import { useCloudinaryUpload } from '@/hooks/use-cloudinary-upload'
 * import { ImageCropper } from '@/components/ui/image-cropper'
 * import { Upload } from '@/components/ui/upload'
 * import { saveUserImage } from '@/lib/cloudinary-entity-helpers'
 * 
 * const ProfileImageComponent = () => {
 *   const [cropperOpen, setCropperOpen] = useState(false)
 *   const [imageToCrop, setImageToCrop] = useState<string | null>(null)
 * 
 *   const { uploadToCloudinary, isUploading } = useCloudinaryUpload({
 *     folder: 'profile-images',
 *     onSuccess: async (result) => {
 *       await saveUserImage(result.public_id, result.secure_url)
 *       toast.success('Image updated!')
 *     },
 *   })
 * 
 *   const handleFileSelect = (file: File) => {
 *     const reader = new FileReader()
 *     reader.onloadend = () => {
 *       setImageToCrop(reader.result as string)
 *       setCropperOpen(true)
 *     }
 *     reader.readAsDataURL(file)
 *   }
 * 
 *   const handleCropComplete = async (croppedFile: File) => {
 *     setCropperOpen(false)
 *     await uploadToCloudinary(croppedFile)
 *   }
 * 
 *   return (
 *     <>
 *       <Upload onUpload={handleFileSelect} disabled={isUploading} />
 *       {imageToCrop && (
 *         <ImageCropper
 *           imageSrc={imageToCrop}
 *           open={cropperOpen}
 *           onClose={() => setCropperOpen(false)}
 *           onCropComplete={handleCropComplete}
 *           aspect={1}
 *           cropShape="round"
 *         />
 *       )}
 *     </>
 *   )
 * }
 */

/* Example 3: Custom Entity Upload (e.g., Player Photo)
 * 
 * import { useCloudinaryUpload } from '@/hooks/use-cloudinary-upload'
 * 
 * const PlayerPhotoUpload = ({ playerId }: { playerId: string }) => {
 *   const { uploadToCloudinary, isUploading } = useCloudinaryUpload({
 *     folder: 'player-photos',
 *     onSuccess: async (result) => {
 *       // Custom save logic
 *       await fetch(`/api/v1/players/${playerId}/photo`, {
 *         method: 'POST',
 *         headers: { 'Content-Type': 'application/json' },
 *         body: JSON.stringify({
 *           public_id: result.public_id,
 *           secure_url: result.secure_url,
 *         }),
 *       })
 *     },
 *   })
 * 
 *   return <Upload onUpload={uploadToCloudinary} disabled={isUploading} />
 * }
 */

/* Example 4: Multiple Images Upload
 * 
 * import { useCloudinaryUpload } from '@/hooks/use-cloudinary-upload'
 * 
 * const GalleryUpload = () => {
 *   const { uploadToCloudinary, isUploading } = useCloudinaryUpload({
 *     folder: 'gallery',
 *   })
 * 
 *   const handleMultipleFiles = async (files: FileList) => {
 *     const uploadPromises = Array.from(files).map(file => 
 *       uploadToCloudinary(file)
 *     )
 *     await Promise.all(uploadPromises)
 *     toast.success('All images uploaded!')
 *   }
 * 
 *   return (
 *     <Upload
 *       onUpload={(file) => handleMultipleFiles([file] as any)}
 *       multiple
 *       disabled={isUploading}
 *     />
 *   )
 * }
 */

export {}

