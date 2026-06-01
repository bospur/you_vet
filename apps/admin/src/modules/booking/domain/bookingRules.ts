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

export interface BookingServiceRules {
  pet_age?: BookingPetAgeRules;
  messages?: BookingMessageRules;
}

export const DEFAULT_CONFIRM_MESSAGE =
  'Заявка подтверждена. Ждём вас в клинике в указанный день.';

export const DEFAULT_REJECT_MESSAGE = 'Отклонено клиникой';

export const DEFAULT_PET_AGE_WARN_MESSAGE =
  'Питомцу 8 лет и старше — перед операцией нужен осмотр и анализы.';

export function parseBookingRules(raw: unknown): BookingServiceRules {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {};
  }
  const o = raw as Record<string, unknown>;
  const petAgeRaw = o.pet_age;
  const messagesRaw = o.messages;
  const rules: BookingServiceRules = {};

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

  if (messagesRaw && typeof messagesRaw === 'object' && !Array.isArray(messagesRaw)) {
    const m = messagesRaw as Record<string, unknown>;
    rules.messages = {
      confirm_default: typeof m.confirm_default === 'string' ? m.confirm_default : undefined,
      reject_default: typeof m.reject_default === 'string' ? m.reject_default : undefined,
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
}): BookingServiceRules {
  const rules: BookingServiceRules = {
    messages: {
      confirm_default: input.confirmDefault.trim() || DEFAULT_CONFIRM_MESSAGE,
      reject_default: input.rejectDefault.trim() || DEFAULT_REJECT_MESSAGE,
    },
  };

  if (input.petAgeCollect) {
    rules.pet_age = {
      collect: true,
      required: input.petAgeRequired,
      warn_from_years: input.petAgeWarnYears === '' ? undefined : input.petAgeWarnYears,
      warn_message: input.petAgeWarnMessage.trim() || DEFAULT_PET_AGE_WARN_MESSAGE,
    };
  }

  return rules;
}

export function rulesToFormFields(rules: BookingServiceRules) {
  const pet = rules.pet_age;
  return {
    petAgeCollect: pet?.collect === true,
    petAgeRequired: pet?.required === true,
    petAgeWarnYears: pet?.warn_from_years ?? 8,
    petAgeWarnMessage: pet?.warn_message ?? DEFAULT_PET_AGE_WARN_MESSAGE,
    confirmDefault: rules.messages?.confirm_default ?? DEFAULT_CONFIRM_MESSAGE,
    rejectDefault: rules.messages?.reject_default ?? DEFAULT_REJECT_MESSAGE,
  };
}

export function getConfirmDefault(rules: unknown): string {
  return parseBookingRules(rules).messages?.confirm_default?.trim() || DEFAULT_CONFIRM_MESSAGE;
}

export function getRejectDefault(rules: unknown): string {
  return parseBookingRules(rules).messages?.reject_default?.trim() || DEFAULT_REJECT_MESSAGE;
}
