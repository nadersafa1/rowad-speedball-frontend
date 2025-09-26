import { TestType, TEST_TYPE_CONFIG } from "../types/enums";
import { Test } from "@/types";

/**
 * Get test type from playing time and recovery time
 */
export const getTestTypeFromTimes = (
  playingTime: number,
  recoveryTime: number
): TestType => {
  if (playingTime === 60 && recoveryTime === 30) return TestType.SUPER_SOLO;
  if (playingTime === 30 && recoveryTime === 30) return TestType.JUNIORS_SOLO;
  if (playingTime === 30 && recoveryTime === 60) return TestType.SPEED_SOLO;
  return TestType.CUSTOM;
};

/**
 * Get test type configuration from playing time and recovery time
 */
export const getTestTypeConfig = (
  playingTime: number,
  recoveryTime: number
) => {
  const testType = getTestTypeFromTimes(playingTime, recoveryTime);
  return TEST_TYPE_CONFIG[testType];
};

/**
 * Get test type configuration from test object
 */
export const getTestTypeConfigFromTest = (test: Test) => {
  return getTestTypeConfig(test.playingTime, test.recoveryTime);
};

/**
 * Get all available test types (excluding custom)
 */
export const getAvailableTestTypes = () => {
  return [
    {
      type: TestType.SUPER_SOLO,
      config: TEST_TYPE_CONFIG[TestType.SUPER_SOLO],
    },
    {
      type: TestType.JUNIORS_SOLO,
      config: TEST_TYPE_CONFIG[TestType.JUNIORS_SOLO],
    },
    {
      type: TestType.SPEED_SOLO,
      config: TEST_TYPE_CONFIG[TestType.SPEED_SOLO],
    },
  ];
};

/**
 * Check if a test matches specific playing/recovery times
 */
export const isTestTypeMatch = (
  test: Test,
  playingTime: number,
  recoveryTime: number
) => {
  return test.playingTime === playingTime && test.recoveryTime === recoveryTime;
};

/**
 * Count tests by type
 */
export const countTestsByType = (
  tests: Test[],
  playingTime: number,
  recoveryTime: number
) => {
  return tests.filter((test) =>
    isTestTypeMatch(test, playingTime, recoveryTime)
  ).length;
};
