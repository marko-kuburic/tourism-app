CREATE TABLE IF NOT EXISTS tours (
  id          CHAR(36) NOT NULL,
  author_id   CHAR(36) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  difficulty  VARCHAR(32) NOT NULL,   -- EASY | MEDIUM | HARD
  status      VARCHAR(32) NOT NULL,   -- DRAFT | ACTIVE | ...
  price_cents BIGINT NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tour_tags (
  tour_id CHAR(36) NOT NULL,
  tag     VARCHAR(64) NOT NULL,
  PRIMARY KEY (tour_id, tag),
  CONSTRAINT fk_tour_tags_tour
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
