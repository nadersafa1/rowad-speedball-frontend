export enum TestType {
  SUPER_SOLO = "60_30",
  JUNIORS_SOLO = "30_30",
  SPEED_SOLO = "30_60",
  CUSTOM = "custom",
}

export const TEST_TYPE_CONFIG = {
  [TestType.SUPER_SOLO]: {
    label: "Super Solo",
    playingTime: 60,
    recoveryTime: 30,
    color: "bg-red-100 text-red-800 border-red-200",
    description: "High-intensity endurance test with extended play time",
  },
  [TestType.JUNIORS_SOLO]: {
    label: "Juniors Solo",
    playingTime: 30,
    recoveryTime: 30,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Balanced intensity test with equal play and rest periods",
  },
  [TestType.SPEED_SOLO]: {
    label: "Speed Solo",
    playingTime: 30,
    recoveryTime: 60,
    color: "bg-green-100 text-green-800 border-green-200",
    description: "Recovery-focused test with extended rest periods",
  },
  [TestType.CUSTOM]: {
    label: "Custom",
    playingTime: 0,
    recoveryTime: 0,
    color: "bg-gray-100 text-gray-800 border-gray-200",
    description: "Custom test configuration",
  },
} as const;
