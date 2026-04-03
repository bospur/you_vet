export interface ClinicInfo {
  id: number;
  clinic_id: number;
  name: string;
  description: string;
  phone: string;
  address: string;
  email: string;
  website: string;
  logo_url: string;
  banner_url: string;
  updated_at: string;
}

export interface ClinicInfoInput {
  name: string;
  description: string;
  phone: string;
  address: string;
  email: string;
  website: string;
}
