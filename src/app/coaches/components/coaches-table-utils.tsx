type SortableField =
  | 'name'
  | 'gender'
  | 'createdAt'
  | 'updatedAt'
  | 'organizationId'

export const columnToApiFieldMap: Record<string, SortableField> = {
  name: 'name',
  gender: 'gender',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  organizationId: 'organizationId',
}

export type { SortableField }

