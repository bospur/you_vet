import type { ScheduleStyle } from './scheduleStyle';

export interface BookingPetAgeRules {
  collect?: boolean;
  required?: boolean;
  warn_from_years?: number;
  warn_message?: string;
}

export interface BookingMessageRules {
  confirm_default?: string;
  reject_default?: string;
}

export interface BookingLimitsRules {
  max_active_per_user_per_date?: number;
  max_active_per_user_per_day?: number;
}

export interface BookingServiceRules {
  pet_age?: BookingPetAgeRules;
  messages?: BookingMessageRules;
  limits?: BookingLimitsRules;
}

export const DEFAULT_CONFIRM_MESSAGE =
  'Заявка подтверждена. Ждём вас в клинике в указанный день.';

export const DEFAULT_REJECT_MESSAGE = 'Отклонено клиникой';

export const DEFAULT_PET_AGE_WARN_MESSAGE =
  'Питомцу 8 лет и старше — перед операцией нужен осмотр и анализы.';

export const DEFAULT_MAX_PER_DAY = 5;

export function defaultMaxPerServiceDate(scheduleStyle: ScheduleStyle): number {
  return scheduleStyle === 'time_slots' ? 1 : 2;
}

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

  const messagesRaw = o.messages;
  if (messagesRaw && typeof messagesRaw === 'object' && !Array.isArray(messagesRaw)) {
    const m = messagesRaw as Record<string, unknown>;
    rules.messages = {
      confirm_default: typeof m.confirm_default === 'string' ? m.confirm_default : undefined,
      reject_default: typeof m.reject_default === 'string' ? m.reject_default : undefined,
    };
  }

  const limitsRaw = o.limits;
  if (limitsRaw && typeof limitsRaw === 'object' && !Array.isArray(limitsRaw)) {
    const l = limitsRaw as Record<string, unknown>;
    rules.limits = {
      max_active_per_user_per_date:
        typeof l.max_active_per_user_per_date === 'number' && l.max_active_per_user_per_date > 0
          ? l.max_active_per_user_per_date
          : undefined,
      max_active_per_user_per_day:
        typeof l.max_active_per_user_per_day === 'number' && l.max_active_per_user_per_day > 0
          ? l.max_active_per_user_per_day
          : undefined,
    };
  }

  return rules;
}

export function buildBookingRules(input: {
  petAgeCollect: boolean;
  petAgeRequired: boolean;
  petAgeWarnYears: number | '';
  petAgeWarnMessage: string;
  confirmDefault: string;
  rejectDefault: string;
  maxPerServiceDate: number;
  maxPerDay: number;
}): BookingServiceRules {
  return {
    messages: {
      confirm_default: input.confirmDefault.trim() || DEFAULT_CONFIRM_MESSAGE,
      reject_default: input.rejectDefault.trim() || DEFAULT_REJECT_MESSAGE,
    },
    limits: {
      max_active_per_user_per_date: input.maxPerServiceDate,
      max_active_per_user_per_day: input.maxPerDay,
    },
    ...(input.petAgeCollect
      ? {
          pet_age: {
            collect: true,
            required: input.petAgeRequired,
            warn_from_years: input.petAgeWarnYears === '' ? undefined : input.petAgeWarnYears,
            warn_message: input.petAgeWarnMessage.trim() || DEFAULT_PET_AGE_WARN_MESSAGE,
          },
        }
      : {}),
  };
}

export function rulesToFormFields(rules: BookingServiceRules, scheduleStyle: ScheduleStyle) {
  const pet = rules.pet_age;
  const lim = rules.limits;
  return {
    petAgeCollect: pet?.collect === true,
    petAgeRequired: pet?.required === true,
    petAgeWarnYears: pet?.warn_from_years ?? 8,
    petAgeWarnMessage: pet?.warn_message ?? DEFAULT_PET_AGE_WARN_MESSAGE,
    confirmDefault: rules.messages?.confirm_default ?? DEFAULT_CONFIRM_MESSAGE,
    rejectDefault: rules.messages?.reject_default ?? DEFAULT_REJECT_MESSAGE,
    maxPerServiceDate: lim?.max_active_per_user_per_date ?? defaultMaxPerServiceDate(scheduleStyle),
    maxPerDay: lim?.max_active_per_user_per_day ?? DEFAULT_MAX_PER_DAY,
  };
}

export function getConfirmDefault(rules: unknown): string {
  return parseBookingRules(rules).messages?.confirm_default?.trim() || DEFAULT_CONFIRM_MESSAGE;
}

export function getRejectDefault(rules: unknown): string {
  return parseBookingRules(rules).messages?.reject_default?.trim() || DEFAULT_REJECT_MESSAGE;
}
