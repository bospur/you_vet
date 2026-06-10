-- Профиль пользователя mobile app

ALTER TABLE mobile_users
    ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500) NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_mobile_users_clinic_linked
    ON mobile_users (clinic_id, linked_at DESC NULLS LAST);
