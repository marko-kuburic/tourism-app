CREATE DATABASE IF NOT EXISTS tourism CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tourism;

CREATE TABLE IF NOT EXISTS users (
  id              CHAR(36) NOT NULL PRIMARY KEY,
  username        VARCHAR(25) NOT NULL UNIQUE,
  user_password   VARCHAR(255) NOT NULL,
  email           VARCHAR(255) NOT NULL UNIQUE,
  role            ENUM('tourist','guide','admin') NOT NULL DEFAULT 'tourist',
  first_name      VARCHAR(80) NULL,
  last_name       VARCHAR(80) NULL,
  profile_picture VARCHAR(512) NULL,
  biography       TEXT NULL,
  motto           VARCHAR(255) NULL,
  activated       TINYINT(1) DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blogs (
  id              CHAR(36) PRIMARY KEY,
  author_id       CHAR(36) NOT NULL,
  title           VARCHAR(200) NOT NULL,
  description_md  MEDIUMTEXT NOT NULL,
  description_html MEDIUMTEXT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS blog_images (
  id       CHAR(36) PRIMARY KEY,
  blog_id  CHAR(36) NOT NULL,
  url      VARCHAR(512) NOT NULL,
  FOREIGN KEY (blog_id) REFERENCES blogs(id)
);