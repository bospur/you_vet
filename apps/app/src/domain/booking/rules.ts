export interface BookingPetAgeRules {
  collect?: boolean;
  required?: boolean;
  warn_from_years?: number;
  warn_message?: string;
}

export interface BookingLimitsRules {
  max_active_per_user_per_date?: number;
  max_active_per_user_per_day?: number;
}

export interface BookingServiceRules {
  pet_age?: BookingPetAgeRules;
  limits?: BookingLimitsRules;
}

const DEFAULT_WARN =
  'Питомцу 8 лет и старше — перед операцией нужен осмотр и анализы.';

export function parseBookingRules(raw: unknown): BookingServiceRules {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  const o = raw as Record<string, unknown>;
  const rules: BookingServiceRules = {};

  const petAgeRaw = o.pet_age;
  if (petAgeRaw && typeof petAgeRaw === 'object' && !Array.isArray(petAgeRaw)) {
    const p = petAgeRaw as Record<string, unknown>;
    rules.pet_age = {
      collect: p.collect === true,
      required: p.required === true,
      warn_from_years:
        typeof p.warn_from_years === 'number' && p.warn_from_years >= 0
          ? p.warn_from_years
          : undefined,
      warn_message: typeof p.warn_message === 'string' ? p.warn_message : undefined,
    };
  }

  const limitsRaw = o.limits;
  if (limitsRaw && typeof limitsRaw === 'object' && !Array.isArray(limitsRaw)) {
    const l = limitsRaw as Record<string, unknown>;
    rules.limits = {
      max_active_per_user_per_date:
        typeof l.max_active_per_user_per_date === 'number'
          ? l.max_active_per_user_per_date
          : undefined,
      max_active_per_user_per_day:
        typeof l.max_active_per_user_per_day === 'number'
          ? l.max_active_per_user_per_day
          : undefined,
    };
  }

  return rules;
}

export function shouldCollectPetAge(rules: BookingServiceRules): boolean {
  return rules.pet_age?.collect === true;
}

export function isPetAgeRequired(rules: BookingServiceRules): boolean {
  return rules.pet_age?.required === true;
}

export function getPetAgeWarning(
  rules: BookingServiceRules,
  ageYears: number | undefined,
): string | null {
  const pet = rules.pet_age;
  if (!pet?.collect || ageYears === undefined || Number.isNaN(ageYears)) return null;
  const from = pet.warn_from_years ?? 8;
  if (ageYears < from) return null;
  return pet.warn_message?.trim() || DEFAULT_WARN;
}
