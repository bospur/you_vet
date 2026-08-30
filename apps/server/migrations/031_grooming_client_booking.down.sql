DROP INDEX IF EXISTS idx_grooming_appointments_status;
DROP INDEX IF EXISTS idx_grooming_appointments_mobile_user;

ALTER TABLE grooming_appointments
    DROP CONSTRAINT IF EXISTS grooming_appointments_status_check;

ALTER TABLE grooming_appointments
    DROP COLUMN IF EXISTS status;

ALTER TABLE grooming_appointments
    DROP COLUMN IF EXISTS mobile_user_id;
