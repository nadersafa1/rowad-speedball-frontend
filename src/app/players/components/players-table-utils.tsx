type SortableField =
  | "name"
  | "nameRtl"
  | "dateOfBirth"
  | "createdAt"
  | "updatedAt"
  | "gender"
  | "preferredHand"
  | "isFirstTeam"
  | "organizationId";

export const columnToApiFieldMap: Record<string, SortableField> = {
  name: "name",
  nameRtl: "nameRtl",
  gender: "gender",
  ageGroup: "dateOfBirth",
  preferredHand: "preferredHand",
  age: "dateOfBirth",
  dateOfBirth: "dateOfBirth",
  createdAt: "createdAt",
  organizationId: "organizationId",
};

export type { SortableField };

