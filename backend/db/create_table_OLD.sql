
BEGIN;

DROP TABLE IF EXISTS "reviews" CASCADE;
DROP TABLE IF EXISTS "library" CASCADE;
DROP TABLE IF EXISTS "bookhaslibrary" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "book" CASCADE;

-- Création des tables
CREATE TABLE users ( 
  id_user             VARCHAR(42) PRIMARY KEY,
  name                VARCHAR(255) NOT NULL,
  email               VARCHAR(42) NOT NULL UNIQUE,
  password            VARCHAR(255) NOT NULL,
  is_admin            BOOLEAN DEFAULT FALSE,
  created_at           DATE DEFAULT NOW(), 
  updated_at           DATE
);

CREATE TABLE book (
  id_book          VARCHAR(42) PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    isbn             VARCHAR(42),
    publication_date  DATE,
    price            FLOAT,
    author           VARCHAR(42),
    editor           VARCHAR(42),
    gender            VARCHAR(42),
  vignetteimage     VARCHAR(100),
  bookimage     VARCHAR(100),
  age_limit         INTEGER,
  description      TEXT,
  created_at        DATE DEFAULT NOW(), 
  updated_at        DATE,
  series            VARCHAR(42)

);

CREATE TABLE reviews (
  id_review     VARCHAR(42) PRIMARY KEY,
  id_user       VARCHAR(42)  REFERENCES "users"("id_user") ON DELETE SET NULL,
  id_book       VARCHAR(42)  REFERENCES "book"("id_book") ON DELETE SET NULL,
  comment       VARCHAR(255) NOT NULL,
  rating        INTEGER NOT NULL,
  created_at     DATE DEFAULT NOW(), 
  updated_at     DATE
);

CREATE TABLE library (
  id_library          VARCHAR(42) PRIMARY KEY,
  name                VARCHAR(42),
  is_editable         BOOLEAN,
  id_user             VARCHAR(42) REFERENCES "users"("id_user")  ON DELETE SET NULL,
  created_at           DATE DEFAULT NOW(), 
  updated_at           DATE
);

CREATE TABLE bookhaslibrary (
  id                VARCHAR(42) PRIMARY KEY,
  id_library           VARCHAR(42)  REFERENCES "library"("id_library")  ON DELETE SET NULL,
  id_book           VARCHAR(42)  REFERENCES "book"("id_book")  ON DELETE SET NULL,    
  is_read           BOOLEAN,
  is_favorite       BOOLEAN,
  created_at         DATE DEFAULT NOW(), 
  updated_at         DATE
);

COMMIT;
