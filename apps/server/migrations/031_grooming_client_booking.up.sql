-- Клиентская запись на груминг: владелец и статус

ALTER TABLE grooming_appointments
    ADD COLUMN IF NOT EXISTS mobile_user_id BIGINT REFERENCES mobile_users(id) ON DELETE SET NULL;

ALTER TABLE grooming_appointments
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'confirmed';

ALTER TABLE grooming_appointments
    ADD CONSTRAINT grooming_appointments_status_check
    CHECK (status IN ('pending', 'confirmed', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_grooming_appointments_mobile_user
    ON grooming_appointments (clinic_id, mobile_user_id)
    WHERE mobile_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_grooming_appointments_status
    ON grooming_appointments (clinic_id, date, status);
