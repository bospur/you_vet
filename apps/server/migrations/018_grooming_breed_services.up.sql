-- Груминг: тип услуги на породу, диапазон цены

ALTER TABLE grooming_breeds
    ADD COLUMN service_name VARCHAR(100) NOT NULL DEFAULT 'Стрижка',
    ADD COLUMN price_from   NUMERIC(10, 2),
    ADD COLUMN price_to     NUMERIC(10, 2);

UPDATE grooming_breeds
SET price_from = price,
    price_to   = price
WHERE price IS NOT NULL;

ALTER TABLE grooming_breeds DROP COLUMN price;
