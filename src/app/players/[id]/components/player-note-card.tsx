'use client'

import React, { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Edit, Trash2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useOrganizationContext } from '@/hooks/use-organization-context'
import { usePlayerNotesStore } from '@/store/player-notes-store'
import { toast } from 'sonner'
import type { PlayerNoteWithUser } from '@/types'
import PlayerNoteForm from './player-note-form'

interface PlayerNoteCardProps {
  note: PlayerNoteWithUser
  playerId: string
}

const NOTE_TYPE_COLORS = {
  performance: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  medical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  behavioral:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  general: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
} as const

const NOTE_TYPE_DOT_COLORS = {
  performance: 'bg-blue-500',
  medical: 'bg-red-500',
  behavioral: 'bg-yellow-500',
  general: 'bg-gray-400',
} as const

const NOTE_TYPE_LABELS = {
  performance: 'Performance',
  medical: 'Medical',
  behavioral: 'Behavioral',
  general: 'General',
} as const

const PlayerNoteCard = ({ note, playerId }: PlayerNoteCardProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { context } = useOrganizationContext()
  const { deleteNote, isLoading } = usePlayerNotesStore()
  const { isSystemAdmin, isAdmin, isOwner, userId } = context

  // Permission checks
  const canEdit = userId === note.createdBy || isSystemAdmin
  const canDelete =
    userId === note.createdBy || isSystemAdmin || isAdmin || isOwner

  const handleDelete = async () => {
    try {
      await deleteNote(playerId, note.id)
      toast.success('Note deleted successfully')
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.error('Failed to delete note')
    }
  }

  const formattedCreatedAt = formatDistanceToNow(new Date(note.createdAt), {
    addSuffix: true,
  })

  const wasEdited = note.updatedBy && note.updatedBy !== note.createdBy

  return (
    <div className="relative flex gap-4">
      {/* Timeline dot and line */}
      <div className="flex flex-col items-center">
        <div
          className={`h-3 w-3 rounded-full border-2 border-background ${NOTE_TYPE_DOT_COLORS[note.noteType]}`}
        />
        <div className="w-px flex-1 bg-border" />
      </div>

      {/* Note card */}
      <Card className="mb-4 flex-1">
        <CardContent className="p-4">
          {/* Header */}
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className={NOTE_TYPE_COLORS[note.noteType]}
              >
                {NOTE_TYPE_LABELS[note.noteType]}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{note.createdByName}</span>
              </div>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                {formattedCreatedAt}
              </span>
              {wasEdited && (
                <>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    Edited by {note.updatedByName}
                  </span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-1">
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditDialogOpen(true)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit note</span>
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete note</span>
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="whitespace-pre-wrap text-sm">{note.content}</div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <PlayerNoteForm
          playerId={playerId}
          note={note}
          onSuccess={() => setIsEditDialogOpen(false)}
          onCancel={() => setIsEditDialogOpen(false)}
        />
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default PlayerNoteCard
