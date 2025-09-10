BEGIN;

-- Extensions utiles (optionnelles mais recommandées)
CREATE EXTENSION IF NOT EXISTS unaccent; --nécessaire pour la recherche full-text sans accents
CREATE EXTENSION IF NOT EXISTS pg_trgm; --nécessaire pour les index trigrammes

-- ---------------------------------------------------------
-- 1) DROP TABLES 
-- ---------------------------------------------------------
DROP TABLE IF EXISTS rolehaspermissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS bookhaslibrary CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS libraries CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ---------------------------------------------------------
-- 2) ROLES
-- ---------------------------------------------------------
CREATE TABLE roles (
  id_role       VARCHAR(42) PRIMARY KEY,
  role_name     VARCHAR(50) NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ
);

-- ---------------------------------------------------------
-- 3) PERMISSIONS
-- ---------------------------------------------------------
CREATE TABLE permissions (
  id_permission     VARCHAR(42) PRIMARY KEY,
  permission_name   VARCHAR(50) NOT NULL UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ
);

-- ---------------------------------------------------------
-- 4) ROLEHASPERMISSIONS (relation rôle ↔ permission)
-- ---------------------------------------------------------
CREATE TABLE rolehaspermissions (
  id_rolehaspermission VARCHAR(42) PRIMARY KEY,
  id_role              VARCHAR(42) NOT NULL REFERENCES roles(id_role) ON DELETE CASCADE,
  id_permission        VARCHAR(42) NOT NULL REFERENCES permissions(id_permission) ON DELETE CASCADE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ,
  
  -- Contrainte d'unicité pour éviter les doublons
  CONSTRAINT uq_role_permission UNIQUE(id_role, id_permission)
);

-- ---------------------------------------------------------
-- 5) USERS
-- ---------------------------------------------------------
CREATE TABLE users (
  id_user       VARCHAR(42) PRIMARY KEY,
  name          VARCHAR(255) NOT NULL CHECK (length(btrim(name)) > 0),
  email         VARCHAR(255) NOT NULL UNIQUE
                CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  password      VARCHAR(255) NOT NULL,
  pseudo        VARCHAR(100) UNIQUE NOT NULL CHECK ( pseudo ~ '^[A-Za-z0-9_]{3,30}$'),
  id_role       VARCHAR(42) REFERENCES roles(id_role) ON DELETE SET NULL,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ
);

-- ---------------------------------------------------------
-- 6) BOOKS
-- ---------------------------------------------------------
CREATE TABLE books (
  id_book            VARCHAR(42) PRIMARY KEY,
  title              VARCHAR(255) NOT NULL CHECK (length(btrim(title)) > 0),
  isbn               VARCHAR(42),
  publication_date   DATE,
  author             VARCHAR(255),
  editor             VARCHAR(255),
  gender              VARCHAR(100), 
  vignetteimage      VARCHAR(255),
  bookimage          VARCHAR(255),
  age_limit          INTEGER CHECK (age_limit IS NULL OR age_limit >= 0),
  description        TEXT,
  series             VARCHAR(255),
  is_in_favorite     INTEGER DEFAULT 0 CHECK (is_in_favorite >= 0),
  nb_reviews         INTEGER DEFAULT 0 CHECK (nb_reviews >= 0),
  is_in_library      INTEGER DEFAULT 0 CHECK (is_in_library >= 0),
  avg_rating         NUMERIC(3,2) CHECK (avg_rating IS NULL OR (avg_rating >= 1.0 AND avg_rating <= 5.0)), 
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ,
  
  -- Contrainte ISBN améliorée
  CONSTRAINT chk_book_isbn CHECK (isbn IS NULL OR isbn ~* '^(?:ISBN(?:-1[03])?:?\s*)?(?=.{10,17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?(?:[0-9]+[- ]?){2}[0-9Xx]$')
);

-- ---------------------------------------------------------
-- 7) LIBRARIES 
-- ---------------------------------------------------------
CREATE TABLE libraries (
  id_library   VARCHAR(42) PRIMARY KEY,
  name         VARCHAR(255) NOT NULL CHECK (length(btrim(name)) > 0),
  is_editable  BOOLEAN DEFAULT FALSE,
  id_user      VARCHAR(42) REFERENCES users(id_user) ON DELETE SET NULL, 
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ
);

-- ---------------------------------------------------------
-- 8) REVIEWS
-- ---------------------------------------------------------
CREATE TABLE reviews (
  id_review    VARCHAR(42) PRIMARY KEY,
  id_user      VARCHAR(42) NOT NULL REFERENCES users(id_user) ON DELETE SET NULL, 
  id_book      VARCHAR(42) NOT NULL REFERENCES books(id_book) ON DELETE SET NULL, 
  comment      VARCHAR(1024) NOT NULL CHECK (length(btrim(comment)) > 0),
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ,
  
  -- Contrainte d'unicité : un utilisateur ne peut reviewer qu'une fois le même livre
  CONSTRAINT uq_user_book_review UNIQUE(id_user, id_book)
);

-- ---------------------------------------------------------
-- 9) BOOKHASLIBRARY (relation livre ↔ bibliothèque)
-- ---------------------------------------------------------
CREATE TABLE bookhaslibrary (
  id_bookhaslibrary VARCHAR(42) PRIMARY KEY,
  id_library        VARCHAR(42) NOT NULL REFERENCES libraries(id_library) ON DELETE SET NULL, 
  id_book           VARCHAR(42) NOT NULL REFERENCES books(id_book) ON DELETE SET NULL, 
  is_read           BOOLEAN DEFAULT FALSE,
  is_favorite       BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ,
  
  -- Contrainte d'unicité : un livre ne peut être qu'une fois dans la même bibliothèque
  CONSTRAINT uq_library_book UNIQUE(id_library, id_book)
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

-- Index trigramme pour recherche floue
CREATE INDEX idx_books_author_title_trgm ON books USING GIN ((coalesce(author,'') || ' ' || title) gin_trgm_ops);
CREATE INDEX idx_books_author_trgm ON books USING GIN (author gin_trgm_ops);
CREATE INDEX idx_books_title_trgm ON books USING GIN (title gin_trgm_ops);

-- Index classiques pour accélérer les FK et recherches courantes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_pseudo ON users(pseudo) WHERE pseudo IS NOT NULL;
CREATE INDEX idx_users_role ON users(id_role) WHERE id_role IS NOT NULL;
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;

CREATE INDEX idx_reviews_user ON reviews(id_user);
CREATE INDEX idx_reviews_book ON reviews(id_book);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_user_book ON reviews(id_user, id_book); -- Index composite

CREATE INDEX idx_libraries_user ON libraries(id_user) WHERE id_user IS NOT NULL;

CREATE INDEX idx_bookhaslibrary_library ON bookhaslibrary(id_library);
CREATE INDEX idx_bookhaslibrary_book ON bookhaslibrary(id_book);
CREATE INDEX idx_bookhaslibrary_is_read ON bookhaslibrary(is_read) WHERE is_read = TRUE;
CREATE INDEX idx_bookhaslibrary_is_favorite ON bookhaslibrary(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_bookhaslibrary_library_book ON bookhaslibrary(id_library, id_book); -- Index composite

CREATE INDEX idx_rolehaspermissions_role ON rolehaspermissions(id_role);
CREATE INDEX idx_rolehaspermissions_permission ON rolehaspermissions(id_permission);

-- Index composite optimisé pour tri par popularité/qualité
CREATE INDEX idx_books_popularity 
ON books(avg_rating DESC NULLS LAST, is_in_favorite DESC, nb_reviews DESC);

-- Index pour recherches par date
CREATE INDEX idx_books_publication_date ON books(publication_date DESC) WHERE publication_date IS NOT NULL;
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX idx_books_genre ON books(genre) WHERE genre IS NOT NULL; -- Nouvel index pour le genre

-- Index pour recherche par ISBN
CREATE INDEX idx_books_isbn ON books(isbn) WHERE isbn IS NOT NULL;

-- ============================
-- TRIGGERS
-- ============================

-- 1) Fonction trigger : mise à jour automatique du updated_at
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur toutes les tables avec updated_at
CREATE TRIGGER set_timestamp_roles
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_permissions
BEFORE UPDATE ON permissions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_rolehaspermissions
BEFORE UPDATE ON rolehaspermissions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

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

-- 2) Fonction trigger pour mise à jour de la note moyenne et du compteur d'avis
CREATE OR REPLACE FUNCTION update_books_reviews_stats()
RETURNS TRIGGER AS $$
DECLARE
  new_avg NUMERIC(3,2);
  new_count INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT COUNT(*), ROUND(AVG(rating)::NUMERIC, 2) 
    INTO new_count, new_avg
    FROM reviews
    WHERE id_book = NEW.id_book;
    
    UPDATE books
    SET avg_rating = new_avg,
        nb_reviews = new_count
    WHERE id_book = NEW.id_book;

  ELSIF TG_OP = 'DELETE' THEN
    SELECT COUNT(*), ROUND(AVG(rating)::NUMERIC, 2) 
    INTO new_count, new_avg
    FROM reviews
    WHERE id_book = OLD.id_book;
    
    UPDATE books
    SET avg_rating = CASE WHEN new_count = 0 THEN NULL ELSE new_avg END,
        nb_reviews = new_count
    WHERE id_book = OLD.id_book;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.id_book = NEW.id_book THEN
      -- Même livre, recalculer les stats
      SELECT COUNT(*), ROUND(AVG(rating)::NUMERIC, 2) 
      INTO new_count, new_avg
      FROM reviews
      WHERE id_book = NEW.id_book;
      
      UPDATE books
      SET avg_rating = new_avg,
          nb_reviews = new_count
      WHERE id_book = NEW.id_book;
    
    ELSE
      -- Changement de livre (rare mais possible)
      -- Ancien livre
      SELECT COUNT(*), ROUND(AVG(rating)::NUMERIC, 2) 
      INTO new_count, new_avg
      FROM reviews
      WHERE id_book = OLD.id_book;
      
      UPDATE books
      SET avg_rating = CASE WHEN new_count = 0 THEN NULL ELSE new_avg END,
          nb_reviews = new_count
      WHERE id_book = OLD.id_book;
      
      -- Nouveau livre
      SELECT COUNT(*), ROUND(AVG(rating)::NUMERIC, 2) 
      INTO new_count, new_avg
      FROM reviews
      WHERE id_book = NEW.id_book;
      
      UPDATE books
      SET avg_rating = new_avg,
          nb_reviews = new_count
      WHERE id_book = NEW.id_book;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reviews_stats
AFTER INSERT OR UPDATE OR DELETE ON reviews 
FOR EACH ROW
EXECUTE FUNCTION update_books_reviews_stats(); 

-- 3) is_in_library : incrémenté/décrémenté quand un livre est ajouté/supprimé d'une bibliothèque
CREATE OR REPLACE FUNCTION update_books_in_library()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE books
    SET is_in_library = is_in_library + 1
    WHERE id_book = NEW.id_book;
    
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE books
    SET is_in_library = GREATEST(is_in_library - 1, 0)
    WHERE id_book = OLD.id_book;
    
  ELSIF TG_OP = 'UPDATE' AND OLD.id_book != NEW.id_book THEN
    -- Décrémenter l'ancien livre
    UPDATE books
    SET is_in_library = GREATEST(is_in_library - 1, 0)
    WHERE id_book = OLD.id_book;
    
    -- Incrémenter le nouveau livre
    UPDATE books
    SET is_in_library = is_in_library + 1
    WHERE id_book = NEW.id_book;
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
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_favorite = TRUE THEN
      UPDATE books
      SET is_in_favorite = is_in_favorite + 1
      WHERE id_book = NEW.id_book;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.is_favorite = TRUE THEN
      UPDATE books
      SET is_in_favorite = GREATEST(is_in_favorite - 1, 0)
      WHERE id_book = OLD.id_book;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Gestion du changement de livre
    IF OLD.id_book != NEW.id_book THEN
      -- Décrémenter l'ancien livre s'il était favori
      IF OLD.is_favorite = TRUE THEN
        UPDATE books
        SET is_in_favorite = GREATEST(is_in_favorite - 1, 0)
        WHERE id_book = OLD.id_book;
      END IF;
      -- Incrémenter le nouveau livre s'il devient favori
      IF NEW.is_favorite = TRUE THEN
        UPDATE books
        SET is_in_favorite = is_in_favorite + 1
        WHERE id_book = NEW.id_book;
      END IF;
    -- Même livre, changement du statut favori
    ELSIF OLD.is_favorite != NEW.is_favorite THEN
      IF OLD.is_favorite = FALSE AND NEW.is_favorite = TRUE THEN
        UPDATE books
        SET is_in_favorite = is_in_favorite + 1
        WHERE id_book = NEW.id_book;
      ELSIF OLD.is_favorite = TRUE AND NEW.is_favorite = FALSE THEN
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

-- Fonction pour recalculer tous les compteurs ET la moyenne
CREATE OR REPLACE FUNCTION recalculate_books_counters()
RETURNS void AS $$
BEGIN
  UPDATE books SET
    nb_reviews = COALESCE((
      SELECT COUNT(*)
      FROM reviews
      WHERE reviews.id_book = books.id_book
    ), 0),
    avg_rating = (
      SELECT ROUND(AVG(rating)::NUMERIC, 2)
      FROM reviews
      WHERE reviews.id_book = books.id_book
    ),
    is_in_library = COALESCE((
      SELECT COUNT(*)
      FROM bookhaslibrary
      WHERE bookhaslibrary.id_book = books.id_book
    ), 0),
    is_in_favorite = COALESCE((
      SELECT COUNT(*)
      FROM bookhaslibrary
      WHERE bookhaslibrary.id_book = books.id_book
        AND bookhaslibrary.is_favorite = TRUE
    ), 0);
    
  RAISE NOTICE 'Recalcul des compteurs terminé pour % livres', (SELECT COUNT(*) FROM books);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les permissions d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_permissions(user_id VARCHAR(42))
RETURNS TABLE(permission_name VARCHAR(50)) AS $$
BEGIN
  RETURN QUERY
  SELECT p.permission_name
  FROM users u
  JOIN roles r ON u.id_role = r.id_role
  JOIN rolehaspermissions rhp ON r.id_role = rhp.id_role
  JOIN permissions p ON rhp.id_permission = p.id_permission
  WHERE u.id_user = user_id 
    AND u.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour la recherche full-text de livres
CREATE OR REPLACE FUNCTION search_books(search_term TEXT, search_limit INTEGER DEFAULT 50)
RETURNS TABLE(
  id_book VARCHAR(42),
  title VARCHAR(255),
  author VARCHAR(255),
  avg_rating NUMERIC(3,2),
  nb_reviews INTEGER,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id_book,
    b.title,
    b.author,
    b.avg_rating,
    b.nb_reviews,
    ts_rank_cd(to_tsvector('french', unaccent(
      coalesce(b.title,'') || ' ' ||
      coalesce(b.author,'') || ' ' ||
      coalesce(b.editor,'') || ' ' ||
      coalesce(b.series,'') || ' ' ||
      coalesce(b.description,'')
    )), plainto_tsquery('french', unaccent(search_term))) as rank
  FROM books b
  WHERE to_tsvector('french', unaccent(
    coalesce(b.title,'') || ' ' ||
    coalesce(b.author,'') || ' ' ||
    coalesce(b.editor,'') || ' ' ||
    coalesce(b.series,'') || ' ' ||
    coalesce(b.description,'')
  )) @@ plainto_tsquery('french', unaccent(search_term))
  ORDER BY rank DESC, b.avg_rating DESC NULLS LAST, b.nb_reviews DESC
  LIMIT search_limit;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les données orphelines (maintenance)
CREATE OR REPLACE FUNCTION cleanup_orphaned_data()
RETURNS TEXT AS $$
DECLARE
  result_text TEXT := '';
BEGIN
  -- Supprimer les relations role-permission orphelines
  DELETE FROM rolehaspermissions 
  WHERE id_role NOT IN (SELECT id_role FROM roles)
     OR id_permission NOT IN (SELECT id_permission FROM permissions);
     
  -- Supprimer les reviews orphelines
  DELETE FROM reviews 
  WHERE id_user NOT IN (SELECT id_user FROM users)
     OR id_book NOT IN (SELECT id_book FROM books);
     
  -- Supprimer les bookhaslibrary orphelines  
  DELETE FROM bookhaslibrary
  WHERE id_library NOT IN (SELECT id_library FROM libraries)
     OR id_book NOT IN (SELECT id_book FROM books);
  
  result_text := 'Nettoyage des données orphelines terminé';
  RAISE NOTICE '%', result_text;
  RETURN result_text;
END;
$$ LANGUAGE plpgsql;

COMMIT;