type SortableField =
  | 'name'
  | 'competitionScope'
  | 'createdAt'
  | 'updatedAt'

export const columnToApiFieldMap: Record<string, SortableField> = {
  name: 'name',
  competitionScope: 'competitionScope',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
}

export type { SortableField }
