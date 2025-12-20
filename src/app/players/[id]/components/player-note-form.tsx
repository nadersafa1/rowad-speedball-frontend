'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { usePlayerNotesStore } from '@/store/player-notes-store'
import { toast } from 'sonner'
import type { PlayerNoteWithUser } from '@/types'

const playerNoteSchema = z.object({
  content: z
    .string()
    .min(1, 'Note content is required')
    .max(5000, 'Note content is too long (max 5000 characters)'),
  noteType: z.enum(['performance', 'medical', 'behavioral', 'general'], {
    message: 'Please select a note category',
  }),
})

type PlayerNoteFormData = z.infer<typeof playerNoteSchema>

interface PlayerNoteFormProps {
  playerId: string
  note?: PlayerNoteWithUser
  onSuccess?: () => void
  onCancel?: () => void
}

const NOTE_TYPE_OPTIONS = [
  { value: 'performance', label: 'Performance' },
  { value: 'medical', label: 'Medical' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'general', label: 'General' },
] as const

const PlayerNoteForm = ({
  playerId,
  note,
  onSuccess,
  onCancel,
}: PlayerNoteFormProps) => {
  const { createNote, updateNote, isLoading, error, clearError } =
    usePlayerNotesStore()
  const isEditing = !!note

  const form = useForm<PlayerNoteFormData>({
    resolver: zodResolver(playerNoteSchema),
    defaultValues: {
      content: note?.content || '',
      noteType: note?.noteType || 'general',
    },
  })

  const onSubmit = async (data: PlayerNoteFormData) => {
    try {
      clearError()

      if (isEditing) {
        await updateNote(playerId, note.id, data)
        toast.success('Note updated successfully')
      } else {
        await createNote(playerId, data)
        toast.success('Note created successfully')
      }

      form.reset()
      onSuccess?.()
    } catch (error) {
      toast.error(
        isEditing ? 'Failed to update note' : 'Failed to create note'
      )
    }
  }

  // Get character count
  const content = form.watch('content')
  const characterCount = content?.length || 0
  const maxCharacters = 5000

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Edit Note' : 'Add New Note'}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? 'Update the note content and category below.'
            : 'Add a note about this player. This will be visible to all coaches and administrators in your organization.'}
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="noteType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {NOTE_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Categorize this note for easier filtering
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note Content</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter your note here..."
                    disabled={isLoading}
                    rows={8}
                    className="resize-none"
                  />
                </FormControl>
                <FormDescription className="flex justify-between">
                  <span>Write detailed observations or comments</span>
                  <span
                    className={
                      characterCount > maxCharacters
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    }
                  >
                    {characterCount} / {maxCharacters}
                  </span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.reset()
                onCancel?.()
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading
                ? isEditing
                  ? 'Updating...'
                  : 'Creating...'
                : isEditing
                  ? 'Update Note'
                  : 'Create Note'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  )
}

export default PlayerNoteForm
