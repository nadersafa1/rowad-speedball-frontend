type SortableField = 'name' | 'createdAt' | 'updatedAt'

export const columnToApiFieldMap: Record<string, SortableField> = {
  name: 'name',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
}

export type { SortableField }

