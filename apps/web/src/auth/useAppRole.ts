import { useAuth } from './AuthContext';
import { useMobileProfile } from '../hooks/useMobileProfile';
import {
  isGroomingStaff,
  isMedicalStaff,
  isStaffRole,
  normalizeAppRole,
  type AppRole,
} from './mobileUser';

export function useAppRole(): {
  role: AppRole;
  isStaff: boolean;
  isMedical: boolean;
  isGroomer: boolean;
} {
  const { user } = useAuth();
  const { data: profile } = useMobileProfile();
  const role = normalizeAppRole(profile?.app_role ?? user?.appRole);
  return {
    role,
    isStaff: isStaffRole(role),
    isMedical: isMedicalStaff(role),
    isGroomer: isGroomingStaff(role),
  };
}
