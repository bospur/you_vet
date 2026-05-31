-- Фаза 5 B3: заявки на запись

CREATE TABLE booking_requests (
    id                  SERIAL PRIMARY KEY,
    clinic_id           INT             NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    service_type_id     INT             NOT NULL REFERENCES booking_service_types(id) ON DELETE RESTRICT,
    requested_date      DATE            NOT NULL,
    slot_time           TIME,
    client_name         VARCHAR(255)    NOT NULL,
    client_phone        VARCHAR(50)     NOT NULL DEFAULT '',
    pet_name            VARCHAR(255)    NOT NULL,
    pet_species         VARCHAR(50),
    pet_age_years       SMALLINT        CHECK (pet_age_years IS NULL OR pet_age_years >= 0),
    telegram_user_id    BIGINT,
    status              VARCHAR(20)     NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'rescheduled')),
    staff_note          TEXT,
    reject_reason       TEXT,
    handled_by_user_id  INT             REFERENCES users(id) ON DELETE SET NULL,
    rules_ack           JSONB           NOT NULL DEFAULT '[]'::jsonb,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_booking_requests_clinic_date
    ON booking_requests (clinic_id, requested_date DESC);

CREATE INDEX idx_booking_requests_clinic_status
    ON booking_requests (clinic_id, status, created_at DESC);

CREATE INDEX idx_booking_requests_capacity
    ON booking_requests (clinic_id, service_type_id, requested_date)
    WHERE status IN ('pending', 'confirmed');

CREATE INDEX idx_booking_requests_telegram
    ON booking_requests (clinic_id, telegram_user_id, requested_date)
    WHERE telegram_user_id IS NOT NULL AND status IN ('pending', 'confirmed');

CREATE INDEX idx_booking_requests_phone
    ON booking_requests (clinic_id, client_phone, requested_date)
    WHERE client_phone <> '' AND status IN ('pending', 'confirmed');
