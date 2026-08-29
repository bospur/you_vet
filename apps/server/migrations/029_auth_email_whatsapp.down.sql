DROP INDEX IF EXISTS idx_auth_codes_login_expires;

ALTER TABLE auth_codes DROP COLUMN IF EXISTS login;
ALTER TABLE auth_codes DROP COLUMN IF EXISTS channel;

ALTER TABLE auth_codes
    ALTER COLUMN phone SET NOT NULL;

ALTER TABLE mobile_users DROP CONSTRAINT IF EXISTS mobile_users_clinic_email_unique;
ALTER TABLE mobile_users DROP COLUMN IF EXISTS email;
