import { Priority } from './types';

export const PRIORITY_STYLES: { [key in Priority]: string } = {
  [Priority.Low]: 'bg-sky-600',
  [Priority.Medium]: 'bg-amber-600',
  [Priority.High]: 'bg-orange-600',
  [Priority.Urgent]: 'bg-red-600',
};
