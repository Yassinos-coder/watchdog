import { SetMetadata } from '@nestjs/common';
import {
  ALLOW_MFA_SETUP_KEY,
  ALLOW_PENDING_MFA_KEY,
  IS_PUBLIC_KEY,
} from '../constants/auth.constants';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
export const AllowPendingMfa = () => SetMetadata(ALLOW_PENDING_MFA_KEY, true);
export const AllowMfaSetup = () => SetMetadata(ALLOW_MFA_SETUP_KEY, true);
