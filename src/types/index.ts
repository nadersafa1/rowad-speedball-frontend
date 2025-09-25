// Re-export types from the backend API contract
export type Player = {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: "male" | "female";
  preferredHand: "left" | "right";
  age: number;
  ageGroup: string;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type Test = {
  id: string;
  name: string;
  playingTime: number;
  recoveryTime: number;
  dateConducted: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  // Calculated fields from backend
  totalTime?: number;
  formattedTotalTime?: string;
  status?: string;
};

export type TestResult = {
  id: string;
  playerId: string;
  testId: string;
  leftHandScore: number;
  rightHandScore: number;
  forehandScore: number;
  backhandScore: number;
  totalScore: number;
  createdAt: Date;
  updatedAt: Date;
};

export type PlayerWithResults = Player & {
  testResults?: (TestResult & { test?: Test })[];
};

export type TestWithResults = Test & {
  testResults?: (TestResult & { player?: Player })[];
};

export type CreatePlayerData = Omit<
  Player,
  "id" | "age" | "ageGroup" | "createdAt" | "updatedAt"
>;
export type CreateTestData = Omit<Test, "id" | "createdAt" | "updatedAt">;
export type CreateTestResultData = Omit<
  TestResult,
  "id" | "totalScore" | "createdAt" | "updatedAt"
>;

export type AuthUser = {
  email: string;
};

export type AuthResponse = {
  authenticated: boolean;
  user?: AuthUser;
};
