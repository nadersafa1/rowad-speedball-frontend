type SortableField =
  | 'name'
  | 'startDate'
  | 'endDate'
  | 'createdAt'
  | 'updatedAt'

export const columnToApiFieldMap: Record<string, SortableField> = {
  name: 'name',
  startDate: 'startDate',
  endDate: 'endDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
}

export type { SortableField }
