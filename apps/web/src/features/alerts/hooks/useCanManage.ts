import { useAuthSession } from '@/features/auth/hooks/useAuthQueries';

export function useCanManage(): boolean {
  const { data: session } = useAuthSession();
  const role = session?.user?.role;
  return role === 'OWNER' || role === 'ADMIN';
}
