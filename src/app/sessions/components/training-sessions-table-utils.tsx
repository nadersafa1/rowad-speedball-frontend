type SortableField =
  | 'name'
  | 'intensity'
  | 'date'
  | 'createdAt'
  | 'updatedAt'

export const columnToApiFieldMap: Record<string, SortableField> = {
  name: 'name',
  intensity: 'intensity',
  date: 'date',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
}

export type { SortableField }

