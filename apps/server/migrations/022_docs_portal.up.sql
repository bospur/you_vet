CREATE TABLE docs_visitors (
    id BIGSERIAL PRIMARY KEY,
    display_name VARCHAR(40) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE docs_comments (
    id BIGSERIAL PRIMARY KEY,
    page_slug VARCHAR(120) NOT NULL,
    visitor_id BIGINT NOT NULL REFERENCES docs_visitors(id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_docs_comments_page_slug ON docs_comments(page_slug, created_at);
