type SortableField =
  | "name"
  | "dateOfBirth"
  | "createdAt"
  | "updatedAt"
  | "gender"
  | "preferredHand";

export const columnToApiFieldMap: Record<string, SortableField> = {
  name: "name",
  gender: "gender",
  ageGroup: "dateOfBirth",
  preferredHand: "preferredHand",
  age: "dateOfBirth",
  dateOfBirth: "dateOfBirth",
  createdAt: "createdAt",
};

export type { SortableField };

