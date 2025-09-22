-- Tačka 15: nova polja na tours
ALTER TABLE tours ADD COLUMN length_km DOUBLE NULL;
ALTER TABLE tours ADD COLUMN published_at TIMESTAMP NULL;
ALTER TABLE tours ADD COLUMN archived_at TIMESTAMP NULL;


-- Tačka 15: mapa trajanja po tipu prevoza
CREATE TABLE IF NOT EXISTS tour_durations (
  tour_id   CHAR(36) NOT NULL,
  transport VARCHAR(16) NOT NULL, -- WALK | BIKE | CAR
  minutes   INT NOT NULL,
  PRIMARY KEY (tour_id, transport),
  CONSTRAINT fk_tour_durations_tour
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;