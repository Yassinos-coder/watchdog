import { z } from 'zod';

const MIN_PASSWORD_LENGTH = 12;

export const setupSchema = z
  .object({
    setupToken: z.string().min(1, 'Enter the setup token'),
    name: z.string().trim().min(1, 'Enter your name').max(100),
    email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
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

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address')),
  password: z.string().min(1, 'Enter your password'),
});

export const recoveryCodeSchema = z.object({
  code: z.string().trim().min(1, 'Enter a recovery code'),
});

export type SetupFormValues = z.infer<typeof setupSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type RecoveryCodeFormValues = z.infer<typeof recoveryCodeSchema>;
