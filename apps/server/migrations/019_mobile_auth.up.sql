-- Mobile app auth (RuStore / Capacitor)

CREATE TABLE mobile_users (
    id               BIGSERIAL PRIMARY KEY,
    clinic_id        INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    phone            VARCHAR(20) NOT NULL,
    telegram_user_id BIGINT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    linked_at        TIMESTAMPTZ,
    UNIQUE (clinic_id, phone)
);

CREATE INDEX idx_mobile_users_phone ON mobile_users (clinic_id, phone);
CREATE INDEX idx_mobile_users_telegram ON mobile_users (clinic_id, telegram_user_id)
    WHERE telegram_user_id IS NOT NULL;

CREATE TABLE auth_codes (
    id         BIGSERIAL PRIMARY KEY,
    clinic_id  INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    phone      VARCHAR(20) NOT NULL,
    code_hash  TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_codes_phone_expires ON auth_codes (clinic_id, phone, expires_at DESC);
