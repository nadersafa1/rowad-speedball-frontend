// Re-export types from the backend API contract
export type Player = {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  age: number;
  ageGroup: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Test = {
  id: string;
  name: string;
  testType: '60_30' | '30_30' | '30_60';
  dateConducted: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
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

export type CreatePlayerData = Omit<Player, 'id' | 'age' | 'ageGroup' | 'createdAt' | 'updatedAt'>;
export type CreateTestData = Omit<Test, 'id' | 'createdAt' | 'updatedAt'>;
export type CreateTestResultData = Omit<TestResult, 'id' | 'totalScore' | 'createdAt' | 'updatedAt'>;

export type AuthUser = {
  email: string;
};

export type AuthResponse = {
  authenticated: boolean;
  user?: AuthUser;
};

