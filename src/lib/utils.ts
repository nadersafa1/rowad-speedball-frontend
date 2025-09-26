import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAgeCategory(age: number): string {
  if (age < 7) return "Mini";
  if (age < 9) return "U-09";
  if (age < 11) return "U-11";
  if (age < 13) return "U-13";
  if (age < 15) return "U-15";
  if (age < 17) return "U-17";
  if (age < 19) return "U-19";
  if (age < 21) return "U-21";
  return "Seniors";
}

export function getTestTypeLabel(
  playingTime: number,
  recoveryTime: number
): string {
  if (playingTime === 60 && recoveryTime === 30) return "Super Solo (60s/30s)";
  if (playingTime === 30 && recoveryTime === 60) return "Speed Solo (30s/60s)";
  if (playingTime === 30 && recoveryTime === 30)
    return "Juniors Solo (30s/30s)";
  return `${playingTime}s/${recoveryTime}s`;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString();
}

export function calculateAge(birthDate: string | Date): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

export function getAgeGroup(birthDate: string | Date): string {
  const age = calculateAge(birthDate);
  return getAgeCategory(age);
}
