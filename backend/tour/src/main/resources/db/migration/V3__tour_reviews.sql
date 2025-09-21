CREATE TABLE IF NOT EXISTS tour_reviews (
  id         CHAR(36) NOT NULL,
  tour_id    CHAR(36) NOT NULL,
  user_id    CHAR(36) NOT NULL,
  rating     INT NOT NULL,
  comment    VARCHAR(2048),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_tour_reviews_tour (tour_id),
  CONSTRAINT fk_tour_reviews_tour FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
