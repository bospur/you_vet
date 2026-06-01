-- Стиль расписания на услуге: day_capacity (только места), dropoff (сдача/забор), time_slots (выбор времени)

ALTER TABLE booking_service_types
    ADD COLUMN schedule_style VARCHAR(20) NOT NULL DEFAULT 'day_capacity'
        CHECK (schedule_style IN ('day_capacity', 'dropoff', 'time_slots'));

UPDATE booking_service_types
SET schedule_style = 'dropoff'
WHERE category = 'surgery';
