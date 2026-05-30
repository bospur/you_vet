DROP INDEX IF EXISTS idx_articles_featured;
ALTER TABLE articles DROP COLUMN IF EXISTS featured;
