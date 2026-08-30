-- Роль пользователя в PWA: клиент / врач / грумер / главврач

ALTER TABLE mobile_users
    ADD COLUMN IF NOT EXISTS app_role VARCHAR(20) NOT NULL DEFAULT 'client';

ALTER TABLE mobile_users
    ADD CONSTRAINT mobile_users_app_role_check
    CHECK (app_role IN ('client', 'doctor', 'groomer', 'chief_vet'));

CREATE INDEX IF NOT EXISTS idx_mobile_users_app_role
    ON mobile_users (clinic_id, app_role)
    WHERE app_role <> 'client';
