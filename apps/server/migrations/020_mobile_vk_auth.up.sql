-- VK ID auth + booking по mobile_user_id (без Telegram)

ALTER TABLE mobile_users
    ADD COLUMN vk_user_id BIGINT,
    ADD COLUMN display_name VARCHAR(255);

ALTER TABLE mobile_users
    ALTER COLUMN phone DROP NOT NULL;

ALTER TABLE mobile_users
    ADD CONSTRAINT mobile_users_clinic_vk_unique UNIQUE (clinic_id, vk_user_id);

CREATE INDEX idx_mobile_users_vk ON mobile_users (clinic_id, vk_user_id)
    WHERE vk_user_id IS NOT NULL;

ALTER TABLE booking_requests
    ADD COLUMN mobile_user_id BIGINT REFERENCES mobile_users(id);

CREATE INDEX idx_booking_requests_mobile_user ON booking_requests (clinic_id, mobile_user_id)
    WHERE mobile_user_id IS NOT NULL;
