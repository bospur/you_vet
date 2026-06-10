DROP INDEX IF EXISTS idx_mobile_users_clinic_linked;

ALTER TABLE mobile_users DROP COLUMN IF EXISTS photo_url;
