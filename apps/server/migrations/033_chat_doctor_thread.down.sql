DROP INDEX IF EXISTS chat_one_open_consult_doctor;
DROP INDEX IF EXISTS chat_one_open_consult_generic;

CREATE UNIQUE INDEX chat_one_open_consult
    ON chat_rooms (clinic_id, created_by_mobile_user_id)
    WHERE kind = 'consult' AND status = 'open';

ALTER TABLE chat_rooms
    DROP COLUMN IF EXISTS doctor_id;
