CREATE TABLE IF NOT EXISTS key_points (
  id           CHAR(36) NOT NULL,
  tour_id      CHAR(36) NOT NULL,
  name         VARCHAR(120) NOT NULL,
  description  VARCHAR(2048) NOT NULL,
  lat          DOUBLE NOT NULL,
  lng          DOUBLE NOT NULL,
  image_url    VARCHAR(1024),
  seq          INT NOT NULL,
  created_at   TIMESTAMP NOT NULL,
  updated_at   TIMESTAMP NOT NULL,
  PRIMARY KEY (id),
  INDEX idx_key_points_tour (tour_id),
  INDEX idx_key_points_tour_seq (tour_id, seq),
  CONSTRAINT fk_key_points_tour 
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sim_locations (
  id         CHAR(36) NOT NULL,
  user_id    CHAR(36) NOT NULL,
  lat        DOUBLE NOT NULL,
  lng        DOUBLE NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sim_locations_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;