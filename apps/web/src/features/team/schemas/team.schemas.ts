import { z } from 'zod';

const MIN_PASSWORD_LENGTH = 12;

export const acceptInviteSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter your name').max(100),
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters`)
      .max(128),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type AcceptInviteFormValues = z.infer<typeof acceptInviteSchema>;
