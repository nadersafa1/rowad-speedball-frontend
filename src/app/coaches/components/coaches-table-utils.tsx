type SortableField =
  | 'name'
  | 'nameRtl'
  | 'gender'
  | 'createdAt'
  | 'updatedAt'
  | 'organizationId'

export const columnToApiFieldMap: Record<string, SortableField> = {
  name: 'name',
  nameRtl: 'nameRtl',
  gender: 'gender',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  organizationId: 'organizationId',
}

export type { SortableField }

