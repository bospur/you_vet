ALTER TABLE grooming_breeds ADD COLUMN price NUMERIC(10, 2);

UPDATE grooming_breeds
SET price = COALESCE(price_from, price_to)
WHERE price_from IS NOT NULL OR price_to IS NOT NULL;

ALTER TABLE grooming_breeds
    DROP COLUMN service_name,
    DROP COLUMN price_from,
    DROP COLUMN price_to;
