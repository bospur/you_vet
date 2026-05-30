-- Откат упрощённой модели (данные категорий не восстанавливаются).

CREATE TABLE categories (
    id         SERIAL PRIMARY KEY,
    clinic_id  INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    animal_id  INT NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    slug       VARCHAR(255) NOT NULL,
    icon       VARCHAR(50),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE article_categories (
    article_id  INT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, category_id)
);

DROP INDEX IF EXISTS articles_clinic_slug_idx;
ALTER TABLE articles ADD CONSTRAINT articles_slug_key UNIQUE (slug);

ALTER TABLE articles DROP COLUMN animal_id;
