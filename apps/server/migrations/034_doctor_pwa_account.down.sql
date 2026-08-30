DROP INDEX IF EXISTS doctors_one_mobile_user;

ALTER TABLE doctors
    DROP COLUMN IF EXISTS mobile_user_id;

DROP INDEX IF EXISTS mobile_users_clinic_staff_login;

ALTER TABLE mobile_users
    DROP COLUMN IF EXISTS password_hash,
    DROP COLUMN IF EXISTS staff_login;
