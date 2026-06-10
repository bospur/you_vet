DROP INDEX IF EXISTS idx_booking_requests_mobile_user;
ALTER TABLE booking_requests DROP COLUMN IF EXISTS mobile_user_id;

DROP INDEX IF EXISTS idx_mobile_users_vk;
ALTER TABLE mobile_users DROP CONSTRAINT IF EXISTS mobile_users_clinic_vk_unique;
ALTER TABLE mobile_users DROP COLUMN IF EXISTS display_name;
ALTER TABLE mobile_users DROP COLUMN IF EXISTS vk_user_id;

-- phone снова NOT NULL только если нет NULL-строк
UPDATE mobile_users SET phone = '' WHERE phone IS NULL;
ALTER TABLE mobile_users ALTER COLUMN phone SET NOT NULL;
