import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { LoadingButton } from '@/components/forms/loading-button'
import { Button } from '@/components/ui/button'
import { useChampionshipEditionsStore } from '@/store/championship-editions-store'
import { toast } from 'sonner'
import { ChampionshipEditionWithRelations } from './championship-editions-table-types'
import { formatDateForAPI } from '@/lib/date-utils'

const editSchema = z
  .object({
    year: z.number().int().min(2000).max(2100),
    status: z.enum(['draft', 'published', 'archived']),
    registrationStartDate: z.date().optional(),
    registrationEndDate: z.date().optional(),
  })
  .refine(
    (data) => {
      // If both dates are provided, end date must be after start date
      if (data.registrationStartDate && data.registrationEndDate) {
        return data.registrationEndDate >= data.registrationStartDate
      }
      return true
    },
    {
      message: 'Registration end date must be after start date',
      path: ['registrationEndDate'],
    }
  )

type EditFormData = z.infer<typeof editSchema>

interface ChampionshipEditionsTableEditDialogProps {
  edition: ChampionshipEditionWithRelations | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  onCancel: () => void
}

export function ChampionshipEditionsTableEditDialog({
  edition,
  open,
  onOpenChange,
  onSuccess,
  onCancel,
}: ChampionshipEditionsTableEditDialogProps) {
  const { updateEdition, isLoading } = useChampionshipEditionsStore()

  const form = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      year: edition?.year || new Date().getFullYear(),
      status: edition?.status || 'draft',
      registrationStartDate: edition?.registrationStartDate
        ? new Date(edition.registrationStartDate)
        : undefined,
      registrationEndDate: edition?.registrationEndDate
        ? new Date(edition.registrationEndDate)
        : undefined,
    },
  })

  useEffect(() => {
    if (edition) {
      form.reset({
        year: edition.year,
        status: edition.status,
        registrationStartDate: edition.registrationStartDate
          ? new Date(edition.registrationStartDate)
          : undefined,
        registrationEndDate: edition.registrationEndDate
          ? new Date(edition.registrationEndDate)
          : undefined,
      })
    }
  }, [edition, form])

  const onSubmit = async (data: EditFormData) => {
    if (!edition) return

    try {
      const payload = {
        year: data.year,
        status: data.status,
        registrationStartDate: data.registrationStartDate
          ? formatDateForAPI(data.registrationStartDate)
          : null,
        registrationEndDate: data.registrationEndDate
          ? formatDateForAPI(data.registrationEndDate)
          : null,
      }

      await updateEdition(edition.id, payload)
      toast.success('Championship edition updated successfully')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update championship edition')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Edit Championship Edition</DialogTitle>
          <DialogDescription>
            Update the championship edition details
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='year'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select status' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='draft'>Draft</SelectItem>
                      <SelectItem value='published'>Published</SelectItem>
                      <SelectItem value='archived'>Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='registrationStartDate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Start Date (Optional)</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      onDateChange={field.onChange}
                      placeholder='Pick registration start date'
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='registrationEndDate'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration End Date (Optional)</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      onDateChange={field.onChange}
                      placeholder='Pick registration end date'
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <LoadingButton type='submit' isLoading={isLoading}>
                Save Changes
              </LoadingButton>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
