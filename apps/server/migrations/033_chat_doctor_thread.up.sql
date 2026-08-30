-- Тред консультации с конкретным врачом из списка

ALTER TABLE chat_rooms
    ADD COLUMN IF NOT EXISTS doctor_id INT REFERENCES doctors(id) ON DELETE SET NULL;

DROP INDEX IF EXISTS chat_one_open_consult;

CREATE UNIQUE INDEX chat_one_open_consult_generic
    ON chat_rooms (clinic_id, created_by_mobile_user_id)
    WHERE kind = 'consult' AND status = 'open' AND doctor_id IS NULL;

CREATE UNIQUE INDEX chat_one_open_consult_doctor
    ON chat_rooms (clinic_id, created_by_mobile_user_id, doctor_id)
    WHERE kind = 'consult' AND status = 'open' AND doctor_id IS NOT NULL;
