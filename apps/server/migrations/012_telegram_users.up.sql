CREATE TABLE telegram_users (
    id               BIGSERIAL PRIMARY KEY,
    clinic_id        INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    telegram_user_id BIGINT NOT NULL,
    first_seen       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    username         VARCHAR(255),
    first_name       VARCHAR(255),
    UNIQUE (clinic_id, telegram_user_id)
);

CREATE INDEX idx_telegram_users_clinic_last_seen
    ON telegram_users (clinic_id, last_seen DESC);
