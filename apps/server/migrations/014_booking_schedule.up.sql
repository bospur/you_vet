-- Фаза 5 B2: расписание записи

CREATE TABLE booking_weekly_rules (
    id              SERIAL PRIMARY KEY,
    clinic_id       INT             NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    service_type_id INT             REFERENCES booking_service_types(id) ON DELETE CASCADE,
    capacity_group  VARCHAR(50),
    day_of_week     SMALLINT        NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    intake_from     TIME,
    intake_to       TIME,
    pickup_after    TIME,
    max_per_day     INT             NOT NULL CHECK (max_per_day > 0),
    slot_mode       VARCHAR(20)     NOT NULL DEFAULT 'day_capacity'
                    CHECK (slot_mode IN ('day_capacity', 'fixed_times')),
    valid_from      DATE,
    valid_to        DATE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT booking_weekly_target CHECK (
        (service_type_id IS NOT NULL AND capacity_group IS NULL) OR
        (service_type_id IS NULL AND capacity_group IS NOT NULL)
    )
);

CREATE UNIQUE INDEX idx_booking_weekly_service_day
    ON booking_weekly_rules (clinic_id, service_type_id, day_of_week)
    WHERE service_type_id IS NOT NULL;

CREATE UNIQUE INDEX idx_booking_weekly_group_day
    ON booking_weekly_rules (clinic_id, capacity_group, day_of_week)
    WHERE capacity_group IS NOT NULL;

CREATE TABLE booking_availability_windows (
    id              SERIAL PRIMARY KEY,
    clinic_id       INT             NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    service_type_id INT             REFERENCES booking_service_types(id) ON DELETE CASCADE,
    capacity_group  VARCHAR(50),
    date_from       DATE            NOT NULL,
    date_to         DATE            NOT NULL,
    days_of_week    SMALLINT[],
    max_per_day     INT             NOT NULL CHECK (max_per_day > 0),
    intake_from     TIME,
    intake_to       TIME,
    pickup_after    TIME,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT booking_window_target CHECK (
        (service_type_id IS NOT NULL AND capacity_group IS NULL) OR
        (service_type_id IS NULL AND capacity_group IS NOT NULL)
    ),
    CONSTRAINT booking_window_dates CHECK (date_from <= date_to)
);

CREATE INDEX idx_booking_windows_clinic_dates
    ON booking_availability_windows (clinic_id, date_from, date_to);

CREATE TABLE booking_day_overrides (
    id              SERIAL PRIMARY KEY,
    clinic_id       INT             NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    service_type_id INT             REFERENCES booking_service_types(id) ON DELETE CASCADE,
    capacity_group  VARCHAR(50),
    date            DATE            NOT NULL,
    max_per_day     INT             CHECK (max_per_day IS NULL OR max_per_day > 0),
    is_closed       BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT booking_override_target CHECK (
        (service_type_id IS NOT NULL AND capacity_group IS NULL) OR
        (service_type_id IS NULL AND capacity_group IS NOT NULL)
    )
);

CREATE UNIQUE INDEX idx_booking_override_service_date
    ON booking_day_overrides (clinic_id, service_type_id, date)
    WHERE service_type_id IS NOT NULL;

CREATE UNIQUE INDEX idx_booking_override_group_date
    ON booking_day_overrides (clinic_id, capacity_group, date)
    WHERE capacity_group IS NOT NULL;

CREATE TABLE booking_day_staff (
    id              SERIAL PRIMARY KEY,
    clinic_id       INT             NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    service_type_id INT             NOT NULL REFERENCES booking_service_types(id) ON DELETE CASCADE,
    date            DATE            NOT NULL,
    doctor_id       INT             REFERENCES doctors(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (clinic_id, service_type_id, date)
);
