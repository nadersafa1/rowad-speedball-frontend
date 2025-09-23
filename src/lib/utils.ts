import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};

export const formatDate = (date: string | Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const getAgeGroup = (dateOfBirth: string): string => {
  const age = calculateAge(dateOfBirth);
  
  if (age < 7) return 'Mini';
  if (age < 9) return 'U-09';
  if (age < 11) return 'U-11';
  if (age < 13) return 'U-13';
  if (age < 15) return 'U-15';
  if (age < 17) return 'U-17';
  if (age < 19) return 'U-19';
  if (age < 21) return 'U-21';
  return 'Seniors';
};

export const getAgeCategory = (ageGroup: string): string => {
  switch (ageGroup) {
    case 'Mini':
      return 'Mini';
    case 'U-09':
    case 'U-11':
    case 'U-13':
    case 'U-15':
      return 'Juniors';
    case 'U-17':
    case 'U-19':
    case 'U-21':
    case 'Seniors':
      return 'Seniors';
    default:
      return 'Unknown';
  }
};

export const getTestTypeLabel = (testType: string): string => {
  switch (testType) {
    case '60_30':
      return 'Super Solo (60s/30s)';
    case '30_30':
      return 'Juniors Solo (30s/30s)';
    case '30_60':
      return 'Speed Solo (30s/60s)';
    default:
      return testType;
  }
};

