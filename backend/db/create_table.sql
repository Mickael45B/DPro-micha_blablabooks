BEGIN;

-- Extensions utiles (optionnelles mais recommandées)
CREATE EXTENSION IF NOT EXISTS unaccent; --nécessaire pour la recherche full-text sans accents
CREATE EXTENSION IF NOT EXISTS pg_trgm; --nécessaire pour les index trigrammes

-- ---------------------------------------------------------
-- 1) DROP TABLES 
-- ---------------------------------------------------------
DROP TABLE IF EXISTS bookhaslibrary;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS libraries;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS users;

-- ---------------------------------------------------------
-- 2) USERS
-- ---------------------------------------------------------
CREATE TABLE users (
  id_user       VARCHAR(42) PRIMARY KEY,
  name          VARCHAR(255) NOT NULL CHECK (length(btrim(name)) > 0),
  email         VARCHAR(255) NOT NULL UNIQUE
                CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'), -- format basique d'email
  password      VARCHAR(255) NOT NULL,
  is_admin      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ
);

-- ---------------------------------------------------------
-- 3) BOOKS
-- ---------------------------------------------------------
CREATE TABLE books (
  id_book            VARCHAR(42) PRIMARY KEY,
  title              VARCHAR(255) NOT NULL CHECK (length(btrim(title)) > 0), -- titre obligatoire et non vide 
  isbn               VARCHAR(42),
  publication_date   DATE,
  price              NUMERIC(10,2) CHECK (price IS NULL OR price >= 0), -- prix positif ou NULL
  author             VARCHAR(255),
  editor             VARCHAR(255),
  gender             VARCHAR(100), 
  vignetteimage      VARCHAR(255),
  bookimage          VARCHAR(255),
  age_limit          INTEGER CHECK (age_limit IS NULL OR age_limit >= 0), -- âge minimum (positif ou NULL)
  description        TEXT,
  series             VARCHAR(255),
  is_in_favorite     INTEGER DEFAULT 0 CHECK (is_in_favorite >= 0), -- nombre de fois où le livre est dans les favoris
  nb_reviews         INTEGER DEFAULT 0 CHECK (nb_reviews >= 0), -- nombre d'avis
  is_in_library      INTEGER DEFAULT 0 CHECK (is_in_library >= 0), -- nombre de bibliothèques où le livre est présent
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ
);

-- ISBN format "souple" (10/13 chars, tirets/lettres X possibles)
ALTER TABLE books
  ADD CONSTRAINT chk_book_isbn
  CHECK (isbn IS NULL OR isbn ~* '^[0-9Xx-]{10,17}$');  

-- ---------------------------------------------------------
-- 4) LIBRARIES (nom corrigé)
-- ---------------------------------------------------------
CREATE TABLE libraries (
  id_library   VARCHAR(42) PRIMARY KEY,
  name         VARCHAR(255) NOT NULL CHECK (length(btrim(name)) > 0), -- nom obligatoire et non vide
  is_editable  BOOLEAN DEFAULT FALSE,
  id_user      VARCHAR(42) REFERENCES users(id_user) ON DELETE SET NULL,  -- bibliothèque "personnelle" d'un user (optionnel)
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ
);

-- ---------------------------------------------------------
-- 5) REVIEWS
-- ---------------------------------------------------------
CREATE TABLE reviews (
  id_review    VARCHAR(42) PRIMARY KEY,
  id_user      VARCHAR(42) REFERENCES users(id_user) ON DELETE SET NULL,
  id_book      VARCHAR(42) REFERENCES books(id_book) ON DELETE SET NULL,
  comment      VARCHAR(1024) NOT NULL CHECK (length(btrim(comment)) > 0), -- commentaire obligatoire et non vide
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ
);

-- ---------------------------------------------------------
-- 6) BOOKHASLIBRARY (relation livre ↔ bibliothèque)
-- ---------------------------------------------------------
CREATE TABLE bookhaslibrary (
  id            VARCHAR(42) PRIMARY KEY,
  id_library    VARCHAR(42) REFERENCES libraries(id_library) ON DELETE SET NULL,
  id_book       VARCHAR(42) REFERENCES books(id_book) ON DELETE SET NULL,
  is_read       BOOLEAN DEFAULT FALSE,
  is_favorite   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ
);

-- ============================
-- INDEXES (-> PERFORMANCE)
-- ============================

-- Index pour recherche full-text (français) avec unaccent
CREATE INDEX idx_books_fulltext
ON books
USING GIN (to_tsvector('french',
  unaccent(coalesce(title,'') || ' ' ||
           coalesce(author,'') || ' ' ||
           coalesce(editor,'') || ' ' ||
           coalesce(series,'') || ' ' ||
           coalesce(description,'')))
);

-- Index trigramme pour recherche floue sur auteur
CREATE INDEX idx_books_author_trgm ON books USING GIN (author gin_trgm_ops);

-- Index trigramme pour recherche floue sur titre
CREATE INDEX idx_books_title_trgm ON books USING GIN (title gin_trgm_ops);

-- Index trigramme pour recherche combinée auteur + titre
CREATE INDEX idx_books_author_title_trgm ON books USING GIN ((author || ' ' || title) gin_trgm_ops);

-- Index classiques pour accélérer les FK et recherches courantes
CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_reviews_user ON reviews(id_user);
CREATE INDEX idx_reviews_book ON reviews(id_book);

CREATE INDEX idx_libraries_user ON libraries(id_user);

CREATE INDEX idx_bookhaslibrary_library ON bookhaslibrary(id_library);
CREATE INDEX idx_bookhaslibrary_book ON bookhaslibrary(id_book);
CREATE INDEX idx_bookhaslibrary_is_read ON bookhaslibrary(is_read);
CREATE INDEX idx_bookhaslibrary_is_favorite ON bookhaslibrary(is_favorite);

-- Index pour optimiser les requêtes de tri par popularité
CREATE INDEX idx_books_stats ON books(is_in_favorite DESC, nb_reviews DESC, is_in_library DESC);

-- Contraintes d'unicité partielles (supportent les valeurs NULL)
-- Un avis par (user, book) quand les deux sont connus
CREATE UNIQUE INDEX uq_reviews_user_book
ON reviews(id_user, id_book)
WHERE id_user IS NOT NULL AND id_book IS NOT NULL;

-- Un même livre ne peut apparaître qu'une fois dans la même bibliothèque
CREATE UNIQUE INDEX uq_bookhaslibrary_library_book
ON bookhaslibrary(id_library, id_book)
WHERE id_library IS NOT NULL AND id_book IS NOT NULL;

-- ============================
-- TRIGGERS
-- ============================

-- 1)Fonction trigger : mise à jour automatique du updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur toutes les tables avec updated_at
CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_books
BEFORE UPDATE ON books
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_libraries
BEFORE UPDATE ON libraries
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_reviews
BEFORE UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_bookhaslibrary
BEFORE UPDATE ON bookhaslibrary
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 2) nb_reviews : incrémenté/décrémenté quand un avis est ajouté ou supprimé
CREATE OR REPLACE FUNCTION update_books_nb_reviews()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.id_book IS NOT NULL THEN
    UPDATE books
    SET nb_reviews = nb_reviews + 1
    WHERE id_book = NEW.id_book;
  ELSIF TG_OP = 'DELETE' AND OLD.id_book IS NOT NULL THEN
    UPDATE books
    SET nb_reviews = GREATEST(nb_reviews - 1, 0)
    WHERE id_book = OLD.id_book;
  -- Gestion du UPDATE (changement de livre dans l'avis)
  ELSIF TG_OP = 'UPDATE' AND OLD.id_book != NEW.id_book THEN
    -- Décrémenter l'ancien livre
    IF OLD.id_book IS NOT NULL THEN
      UPDATE books
      SET nb_reviews = GREATEST(nb_reviews - 1, 0)
      WHERE id_book = OLD.id_book;
    END IF;
    -- Incrémenter le nouveau livre
    IF NEW.id_book IS NOT NULL THEN
      UPDATE books
      SET nb_reviews = nb_reviews + 1
      WHERE id_book = NEW.id_book;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reviews_count
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_books_nb_reviews();

-- 3) is_in_library : incrémenté/décrémenté quand un livre est ajouté/supprimé d'une bibliothèque
CREATE OR REPLACE FUNCTION update_books_in_library()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.id_book IS NOT NULL THEN
    UPDATE books
    SET is_in_library = is_in_library + 1
    WHERE id_book = NEW.id_book;
  ELSIF TG_OP = 'DELETE' AND OLD.id_book IS NOT NULL THEN
    UPDATE books
    SET is_in_library = GREATEST(is_in_library - 1, 0)
    WHERE id_book = OLD.id_book;
  -- Gestion du UPDATE (changement de livre dans la relation)
  ELSIF TG_OP = 'UPDATE' AND OLD.id_book != NEW.id_book THEN
    -- Décrémenter l'ancien livre
    IF OLD.id_book IS NOT NULL THEN
      UPDATE books
      SET is_in_library = GREATEST(is_in_library - 1, 0)
      WHERE id_book = OLD.id_book;
    END IF;
    -- Incrémenter le nouveau livre
    IF NEW.id_book IS NOT NULL THEN
      UPDATE books
      SET is_in_library = is_in_library + 1
      WHERE id_book = NEW.id_book;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_books_in_library
AFTER INSERT OR UPDATE OR DELETE ON bookhaslibrary
FOR EACH ROW
EXECUTE FUNCTION update_books_in_library();

-- 4) is_in_favorite : incrémenté/décrémenté quand un livre est marqué/démarqué favori
CREATE OR REPLACE FUNCTION update_books_favorites()
RETURNS TRIGGER AS $$
BEGIN
  -- Si un enregistrement est inséré et marqué en favori
  IF TG_OP = 'INSERT' AND NEW.is_favorite = TRUE AND NEW.id_book IS NOT NULL THEN
    UPDATE books
    SET is_in_favorite = is_in_favorite + 1
    WHERE id_book = NEW.id_book;

  -- Si suppression d'un enregistrement favori
  ELSIF TG_OP = 'DELETE' AND OLD.is_favorite = TRUE AND OLD.id_book IS NOT NULL THEN
    UPDATE books
    SET is_in_favorite = GREATEST(is_in_favorite - 1, 0)
    WHERE id_book = OLD.id_book;

  -- Si un UPDATE change la valeur de is_favorite
  ELSIF TG_OP = 'UPDATE' THEN
    -- Gestion du changement de livre
    IF OLD.id_book != NEW.id_book THEN
      -- Décrémenter l'ancien livre s'il était favori
      IF OLD.is_favorite = TRUE AND OLD.id_book IS NOT NULL THEN
        UPDATE books
        SET is_in_favorite = GREATEST(is_in_favorite - 1, 0)
        WHERE id_book = OLD.id_book;
      END IF;
      -- Incrémenter le nouveau livre s'il devient favori
      IF NEW.is_favorite = TRUE AND NEW.id_book IS NOT NULL THEN
        UPDATE books
        SET is_in_favorite = is_in_favorite + 1
        WHERE id_book = NEW.id_book;
      END IF;
    -- Même livre, changement du statut favori
    ELSE
      -- passage de FALSE -> TRUE
      IF OLD.is_favorite = FALSE AND NEW.is_favorite = TRUE AND NEW.id_book IS NOT NULL THEN
        UPDATE books
        SET is_in_favorite = is_in_favorite + 1
        WHERE id_book = NEW.id_book;
      -- passage de TRUE -> FALSE
      ELSIF OLD.is_favorite = TRUE AND NEW.is_favorite = FALSE AND NEW.id_book IS NOT NULL THEN
        UPDATE books
        SET is_in_favorite = GREATEST(is_in_favorite - 1, 0)
        WHERE id_book = NEW.id_book;
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_books_favorites
AFTER INSERT OR UPDATE OR DELETE ON bookhaslibrary
FOR EACH ROW
EXECUTE FUNCTION update_books_favorites();

-- ============================
-- FONCTIONS UTILITAIRES DE MAINTENANCE
-- ============================

-- Fonction pour recalculer tous les compteurs (en cas de désynchronisation)
CREATE OR REPLACE FUNCTION recalculate_books_counters()
RETURNS void AS $$
BEGIN
  UPDATE books SET
    nb_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE reviews.id_book = books.id_book
    ),
    is_in_library = (
      SELECT COUNT(*)
      FROM bookhaslibrary
      WHERE bookhaslibrary.id_book = books.id_book
    ),
    is_in_favorite = (
      SELECT COUNT(*)
      FROM bookhaslibrary
      WHERE bookhaslibrary.id_book = books.id_book
        AND bookhaslibrary.is_favorite = TRUE
    );
END;
$$ LANGUAGE plpgsql;

COMMIT;