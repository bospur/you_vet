-- Email / WhatsApp OTP: login key on auth_codes, optional email on mobile_users

ALTER TABLE mobile_users
    ADD COLUMN IF NOT EXISTS email VARCHAR(255);

ALTER TABLE mobile_users
    ADD CONSTRAINT mobile_users_clinic_email_unique UNIQUE (clinic_id, email);

ALTER TABLE auth_codes
    ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE auth_codes
    ADD COLUMN IF NOT EXISTS channel VARCHAR(20) NOT NULL DEFAULT 'telegram';

ALTER TABLE auth_codes
    ADD COLUMN IF NOT EXISTS login VARCHAR(255);

UPDATE auth_codes SET login = phone WHERE login IS NULL AND phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_auth_codes_login_expires
    ON auth_codes (clinic_id, channel, login, expires_at DESC);
