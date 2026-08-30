DROP INDEX IF EXISTS idx_mobile_users_app_role;

ALTER TABLE mobile_users
    DROP CONSTRAINT IF EXISTS mobile_users_app_role_check;

ALTER TABLE mobile_users
    DROP COLUMN IF EXISTS app_role;
