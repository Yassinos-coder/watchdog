import type { PlatformOption } from '../types/project.types';

export const PLATFORMS: PlatformOption[] = [
  { value: 'react', label: 'React' },
  { value: 'javascript', label: 'Browser JavaScript' },
  { value: 'nestjs', label: 'NestJS' },
  { value: 'node', label: 'Node.js' },
  { value: 'python', label: 'Python' },
  { value: 'react-native', label: 'React Native / Expo' },
  { value: 'other', label: 'Something else' },
];

export const DEFAULT_PLATFORM = 'react';
