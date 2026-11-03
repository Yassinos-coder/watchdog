import type { PlatformOption } from '../types/project.types';

export const PLATFORMS: PlatformOption[] = [
  { value: 'react', label: 'React' },
  { value: 'javascript', label: 'Browser JavaScript' },
  { value: 'nestjs', label: 'NestJS' },
  { value: 'node', label: 'Node.js' },
  { value: 'other', label: 'Something else' },
];

export const DEFAULT_PLATFORM = 'react';
