import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '../services/authService';
import type {
  AuthSession,
  EnrollmentResult,
  LoginInput,
  SetupInput,
  VerifyMethod,
} from '../types/auth.types';
import { authKeys } from './useAuthQueries';

function useSessionWriter() {
  const queryClient = useQueryClient();
  return (session: AuthSession | null) => queryClient.setQueryData(authKeys.session, session);
}

function useEnrollmentWriter() {
  const queryClient = useQueryClient();
  return async (result: EnrollmentResult): Promise<EnrollmentResult> => {
    queryClient.setQueryData<AuthSession | null>(authKeys.session, (current) =>
      current ? { ...current, user: result.user } : current,
    );
    await queryClient.invalidateQueries({ queryKey: authKeys.security });
    return result;
  };
}

export function useSetup() {
  const write = useSessionWriter();
  return useMutation({
    mutationFn: (input: SetupInput) => authService.setup(input),
    onSuccess: write,
  });
}

export function useLogin() {
  const write = useSessionWriter();
  return useMutation({
    mutationFn: (input: LoginInput) => authService.login(input),
    onSuccess: (session) =>
      write(session.mfaRequired ? { mfaRequired: true, methods: session.methods, user: null } : session),
  });
}

export function useVerifyMfa() {
  const write = useSessionWriter();
  return useMutation({
    mutationFn: (input: { method: VerifyMethod; code: string }) =>
      authService.verify(input.method, input.code),
    onSuccess: write,
  });
}

export function useSendEmailCode() {
  return useMutation({ mutationFn: () => authService.sendEmailCode() });
}

export function usePasskeySignIn() {
  const write = useSessionWriter();
  return useMutation({
    mutationFn: async () => {
      const options = await authService.passkeyAuthenticationOptions();
      const response = await startAuthentication({ optionsJSON: options });
      return authService.verifyPasskeyAuthentication(response);
    },
    onSuccess: write,
  });
}

export function useBeginTotp() {
  return useMutation({ mutationFn: () => authService.beginTotp() });
}

export function useConfirmTotp() {
  const write = useEnrollmentWriter();
  return useMutation({ mutationFn: (code: string) => authService.confirmTotp(code), onSuccess: write });
}

export function useConfirmEmailMethod() {
  const write = useEnrollmentWriter();
  return useMutation({ mutationFn: (code: string) => authService.confirmEmail(code), onSuccess: write });
}

export function useRegisterPasskey() {
  const write = useEnrollmentWriter();
  return useMutation({
    mutationFn: async (name?: string) => {
      const options = await authService.passkeyRegistrationOptions();
      const response = await startRegistration({ optionsJSON: options });
      return authService.verifyPasskeyRegistration(response, name);
    },
    onSuccess: write,
  });
}

export function useRemovePasskey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (passkeyId: string) => authService.removePasskey(passkeyId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.security });
      await queryClient.invalidateQueries({ queryKey: authKeys.session });
    },
  });
}

export function useDisableMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (method: 'TOTP' | 'EMAIL') => authService.disableMethod(method),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.security });
      await queryClient.invalidateQueries({ queryKey: authKeys.session });
    },
  });
}

export function useRegenerateRecoveryCodes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authService.regenerateRecoveryCodes(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: authKeys.security }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      queryClient.clear();
      queryClient.setQueryData(authKeys.session, null);
    },
  });
}
