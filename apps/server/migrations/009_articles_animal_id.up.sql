-- Статьи привязаны к животному напрямую; категории удаляются.

ALTER TABLE articles ADD COLUMN animal_id INT REFERENCES animals(id) ON DELETE CASCADE;

UPDATE articles a
SET animal_id = (
    SELECT c.animal_id
    FROM article_categories ac
    JOIN categories c ON c.id = ac.category_id
    WHERE ac.article_id = a.id
    ORDER BY c.id
    LIMIT 1
);

UPDATE articles a
SET animal_id = (
    SELECT an.id FROM animals an
    WHERE an.clinic_id = a.clinic_id
    ORDER BY an.sort_order, an.id
    LIMIT 1
)
WHERE animal_id IS NULL;

ALTER TABLE articles ALTER COLUMN animal_id SET NOT NULL;

ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_slug_key;
CREATE UNIQUE INDEX IF NOT EXISTS articles_clinic_slug_idx ON articles (clinic_id, slug);

DROP TABLE IF EXISTS article_categories;
DROP TABLE IF EXISTS categories;
