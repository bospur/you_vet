-- Аккаунт PWA врача: логин/пароль + связь карточки с mobile_users

ALTER TABLE mobile_users
    ADD COLUMN IF NOT EXISTS staff_login VARCHAR(64),
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

CREATE UNIQUE INDEX IF NOT EXISTS mobile_users_clinic_staff_login
    ON mobile_users (clinic_id, lower(staff_login))
    WHERE staff_login IS NOT NULL AND staff_login <> '';

ALTER TABLE doctors
    ADD COLUMN IF NOT EXISTS mobile_user_id BIGINT REFERENCES mobile_users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS doctors_one_mobile_user
    ON doctors (mobile_user_id)
    WHERE mobile_user_id IS NOT NULL;
