ALTER TABLE articles
    ADD COLUMN featured BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_articles_featured ON articles (clinic_id, featured)
    WHERE featured = true AND status = 'published';
