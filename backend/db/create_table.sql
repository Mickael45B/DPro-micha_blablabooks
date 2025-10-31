BEGIN;

-- S'assurer qu'on est dans la bonne base
\c blablabook;

-- Extensions utiles (optionnelles mais recommandées)
-- CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA public; --nécessaire pour la recherche full-text sans accents
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA public;--nécessaire pour les index trigrammes

-- Crée une fonction IMMUTABLE pour encapsuler unaccent
-- CREATE OR REPLACE FUNCTION immutable_unaccent(text)
-- RETURNS text AS $$
-- SELECT unaccent($1);
-- $$ LANGUAGE sql IMMUTABLE;

-- Vérifie si l'extension unaccent est disponible
-- DO $$ 
-- BEGIN
--     IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'unaccent') THEN
--         RAISE EXCEPTION 'Extension unaccent not available';
--     END IF;
-- END $$;
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public; -- pour la génération d'UUID si besoin
-- CREATE EXTENSION IF NOT EXISTS citext SCHEMA public; -- pour le type de données insensible à la casse (utile pour les emails et pseudos)
-- CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA public; -- pour les fonctions cryptographiques (hashage, etc.)

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

-- Indexes pour optimiser les recherches par rôle ou permission
CREATE INDEX idx_rolehaspermissions_role ON rolehaspermissions(id_role);
CREATE INDEX idx_rolehaspermissions_permission ON rolehaspermissions(id_permission);

-- ---------------------------------------------------------
-- 5) STATUS
-- ---------------------------------------------------------
-- Option A (développement) : utiliser des identifiants de type VARCHAR (UUID)
-- Cela facilite la manipulation côté front et l'uniformité des IDs à travers les tables.
CREATE TABLE status (
  id_status     VARCHAR(42) PRIMARY KEY,
  status_name   VARCHAR(100) NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ
);

CREATE INDEX idx_status_name ON status(status_name);

-- Option B (production) : utiliser INT GENERATED ALWAYS AS IDENTITY
-- Si vous préférez garder une colonne entière auto-incrémentée, remplacez la définition
-- ci-dessus par :
-- CREATE TABLE status (
--   id_status     INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
--   status_name   VARCHAR(100) NOT NULL UNIQUE,
--   created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
--   updated_at    TIMESTAMPTZ
-- );

-- ---------------------------------------------------------
-- 6) USERS
-- ---------------------------------------------------------
CREATE TABLE users (
  id_user       VARCHAR(42) PRIMARY KEY,
  name          VARCHAR(255) CHECK (length(btrim(name)) > 0), -- nom optionnel, servira pour la personnalisation des messages entre utilisateurs et admins (si non renseigné, on utilisera le pseudo)
  email         VARCHAR(255) NOT NULL UNIQUE 
                CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'), -- format d'email basique
  password      VARCHAR(255) NOT NULL,
  pseudo VARCHAR(100) UNIQUE NOT NULL CHECK (pseudo ~ '^[A-Za-z0-9](?:[A-Za-z0-9_'' ]*[A-Za-z0-9])?$') CHECK (length(btrim(pseudo)) >= 3 AND length(pseudo) <= 32),
  id_role       VARCHAR(42) REFERENCES roles(id_role) ON DELETE SET NULL,
  id_status     VARCHAR(42) REFERENCES status(id_status) ON DELETE SET NULL,
  refresh_token TEXT, -- pour stocker le refresh token (optionnel)
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ
);

-- Index classiques pour accélérer les FK et recherches courantes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_pseudo ON users(pseudo) WHERE pseudo IS NOT NULL;
CREATE INDEX idx_users_role ON users(id_role) WHERE id_role IS NOT NULL;
CREATE INDEX idx_users_pseudo_lower ON users(LOWER(pseudo));
CREATE INDEX IF NOT EXISTS idx_users_refresh_token ON users(refresh_token) WHERE refresh_token IS NOT NULL;
CREATE INDEX idx_users_last_login ON users(last_login) WHERE last_login IS NOT NULL;

COMMENT ON TABLE users IS 'Utilisateurs de l''application BlablaBook';
COMMENT ON COLUMN users.refresh_token IS 'Token JWT de renouvellement (validité 90 jours)';
COMMENT ON COLUMN users.last_login IS 'Date de dernière connexion réussie';
COMMENT ON COLUMN users.id_status IS 'Référence au statut utilisateur (actif, bloqué, etc.)';
COMMENT ON COLUMN users.password IS 'Mot de passe hashé avec bcrypt (10 rounds)';
-- ---------------------------------------------------------
-- 6) BOOKS
-- ---------------------------------------------------------
CREATE TABLE books (
  id_book            VARCHAR(42) PRIMARY KEY,
  title              VARCHAR(255) NOT NULL CHECK (length(btrim(title)) > 0),
  isbn               VARCHAR(42),
  publication_date   TIMESTAMPTZ CHECK (publication_date IS NULL OR publication_date <= CURRENT_DATE), -- date format européen (jj/mm/aaaa)
  author             VARCHAR(255),
  editor             VARCHAR(255),
  genre              VARCHAR(100), 
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
  updated_at         TIMESTAMPTZ
  
  -- Contrainte ISBN améliorée
  -- CONSTRAINT chk_book_isbn CHECK (isbn IS NULL OR isbn ~ '^(?:ISBN(?:-1[03])?:?\s?)?(?:\d{9}[\dXx]|\d{13})$')
);

-- Index pour recherche full-text (français) avec unaccent
-- CREATE INDEX idx_books_fulltext
-- ON books
-- USING GIN (to_tsvector('french',
--   immutable_unaccent(coalesce(title,'') || ' ' ||
--                      coalesce(author,'') || ' ' ||
--                      coalesce(editor,'') || ' ' ||
--                      coalesce(series,'') || ' ' ||
--                      coalesce(description,'')))
-- );

-- Index trigramme pour recherche floue
CREATE INDEX idx_books_author_title_trgm ON books USING GIN ((coalesce(author,'') || ' ' || title) gin_trgm_ops);
CREATE INDEX idx_books_author_trgm ON books USING GIN (author gin_trgm_ops);
CREATE INDEX idx_books_title_trgm ON books USING GIN (title gin_trgm_ops);
-- Index composite optimisé pour tri par popularité/qualité
CREATE INDEX idx_books_popularity 
ON books(avg_rating DESC NULLS LAST, is_in_favorite DESC, nb_reviews DESC);
CREATE INDEX idx_books_publication_date ON books(publication_date DESC) WHERE publication_date IS NOT NULL;
CREATE INDEX idx_books_genre ON books(genre) WHERE genre IS NOT NULL; -- Nouvel index pour le genre
CREATE INDEX idx_books_isbn ON books(isbn) WHERE isbn IS NOT NULL;






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

CREATE INDEX idx_libraries_user ON libraries(id_user) WHERE id_user IS NOT NULL;


-- ---------------------------------------------------------
-- 8) REVIEWS
-- ---------------------------------------------------------
CREATE TABLE reviews (
  id_review    VARCHAR(42) PRIMARY KEY,
  id_user   VARCHAR(42) REFERENCES users(id_user) ON DELETE SET NULL, 
  id_book      VARCHAR(42) NOT NULL REFERENCES books(id_book) ON DELETE SET NULL, 
  title_rating  VARCHAR(255) NOT NULL CHECK (length(btrim(title_rating)) > 0), 
  comment      VARCHAR(1024) NOT NULL CHECK (length(btrim(comment)) > 0),
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ,
  
  -- Contrainte d'unicité : un utilisateur ne peut reviewer qu'une fois le même livre
  CONSTRAINT uq_user_book_review UNIQUE(id_user, id_book)
);

CREATE INDEX idx_reviews_user ON reviews(id_user);
CREATE INDEX idx_reviews_book ON reviews(id_book);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_user_book ON reviews(id_user, id_book); -- Index composite
CREATE INDEX idx_reviews_created_brin ON reviews USING BRIN(created_at); -- Index BRIN pour les dates de création des reviews (partitionnées)
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);


-- Partitionnement par année de création pour performance (optionnel)
-- PARTITION BY RANGE (created_at);

-- CREATE TABLE reviews_2024 PARTITION OF reviews
--   FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
  
-- CREATE TABLE reviews_2025 PARTITION OF reviews
--   FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- ---------------------------------------------------------
-- 9) BOOKHASLIBRARY (relation livre ↔ bibliothèque)
-- ---------------------------------------------------------
CREATE TABLE bookhaslibrary (
  id_bookhaslibrary VARCHAR(42) PRIMARY KEY,
  id_library        VARCHAR(42) REFERENCES libraries(id_library) ON DELETE SET NULL, 
  id_book           VARCHAR(42) REFERENCES books(id_book) ON DELETE SET NULL, 
  is_read           BOOLEAN DEFAULT FALSE,
  is_favorite       BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ,
  
  -- Contrainte d'unicité : un livre ne peut être qu'une fois dans la même bibliothèque
  CONSTRAINT uq_library_book UNIQUE(id_library, id_book)
);

-- Pour "livres non lus d'un utilisateur"
CREATE INDEX idx_bookhaslibrary_user_unread 
ON bookhaslibrary(id_library, is_read) 
WHERE is_read = FALSE;
CREATE INDEX idx_bookhaslibrary_library ON bookhaslibrary(id_library);
CREATE INDEX idx_bookhaslibrary_book ON bookhaslibrary(id_book);
CREATE INDEX idx_bookhaslibrary_is_favorite ON bookhaslibrary(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_bookhaslibrary_library_book ON bookhaslibrary(id_library, id_book); -- Index composite


-- ---------------------------------------------------------
-- 10) MESSAGES 
-- ---------------------------------------------------------

-- Nouvelle fonctionnalité : ajout de tags pour vos livres
-- Problème de connexion à votre compte
-- Mise à jour de vos préférences de lecture
-- Invitation à rejoindre une bibliothèque partagée
-- Confirmation de suppression de compte
-- Message privé concernant un livre favori
-- Notification de sécurité : changement de mot de passe
-- Suggestions de lecture personnalisées
-- Rapport signalé concernant un commentaire
-- Bienvenue dans la communauté des lecteurs

CREATE TABLE messages (
  id_message    VARCHAR(42) PRIMARY KEY,
  id_sender     VARCHAR(42) REFERENCES users(id_user) ON DELETE SET NULL,
  id_receiver   VARCHAR(42) REFERENCES users(id_user) ON DELETE SET NULL,
  subject       VARCHAR(255) NOT NULL CHECK (length(btrim(subject)) > 0),
  content       TEXT NOT NULL CHECK (length(btrim(content)) > 0),
  is_read       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ
);

-- Index pour les messages
CREATE INDEX idx_messages_sender ON messages(id_sender);
CREATE INDEX idx_messages_receiver ON messages(id_receiver);
CREATE INDEX idx_messages_unread ON messages(id_receiver, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_messages_created_brin ON messages USING BRIN(created_at); -- Index BRIN pour les dates de création des messages (partitionnées)


-- ---------------------------------------------------------
-- 10) REPORTING 
-- ---------------------------------------------------------
-- cette table sera utilisée dans une version ultérieure pour la modération
-- Table pour les signalements (reports)

-- Un utilisateur peut signaler un autre utilisateur, une review, un message, etc.
-- Harcèlement / propos insultants
-- Contenu haineux / discriminatoire
-- Spam / publicité non sollicitée
-- Usurpation d’identité
-- Propagation de fausses informations
-- Partage d’informations personnelles (doxing)
-- Menaces / appels à la violence
-- Pornographie / contenu sexuel explicite
-- Contenu inapproprié pour mineurs
-- Violation du droit d’auteur
-- Escroquerie / tentative de fraude
-- Comportement agressif dans les messages privés
-- Commentaire diffamatoire
-- Harcèlement ciblé répétitif
-- Publication de coordonnées bancaires / sensibles
-- Contenu offensant lié à la religion
-- Violation des règles de la communauté
-- Non-respect des conditions d’utilisation (TOS)
-- Contenu trompeur (clickbait / phishing)
-- Autre — préciser dans details

CREATE TABLE reports (
  id_report     VARCHAR(42) PRIMARY KEY,
  id_user       VARCHAR(42) REFERENCES users(id_user) ON DELETE SET NULL,-- Le champ id_user référence l'utilisateur qui a fait le signalement
  report_type   VARCHAR(50) NOT NULL CHECK (report_type IN ('user', 'review', 'message', 'other')),-- Le champ report_type indique le type d'entité signalée
  reported_id   VARCHAR(42), -- Le champ reported_id contient l'ID de l'entité signalée. ID de l'entité signalée (user, review, message, etc.)
  reason        VARCHAR(255) NOT NULL CHECK (length(btrim(reason)) > 0),-- Le champ reason contient la raison du signalement
  details       TEXT,-- Le champ details peut contenir des informations supplémentaires
  status        VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'in_review', 'resolved', 'dismissed')) DEFAULT 'pending',-- Le champ status indique l'état du signalement (en attente, en cours de traitement, résolu, rejeté)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ
);

-- Index pour les reports
CREATE INDEX idx_reports_user ON reports(id_user);
CREATE INDEX idx_reports_type_status ON reports(report_type, status);
CREATE INDEX idx_reports_status ON reports(status) WHERE status = 'pending';


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

-- Fonction trigger corrigée pour la mise à jour des statistiques de reviews
CREATE OR REPLACE FUNCTION update_books_reviews_stats()
RETURNS TRIGGER AS $$
DECLARE
  new_avg NUMERIC(3,2);
  new_count INTEGER;
BEGIN
  -- ✅ Vérifier que id_book existe pour INSERT et UPDATE
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.id_book IS NULL THEN
    RAISE EXCEPTION 'id_book cannot be NULL';
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Nouveau review ajouté
    SELECT COUNT(*), ROUND(AVG(rating)::NUMERIC, 2) 
    INTO new_count, new_avg
    FROM reviews
    WHERE id_book = NEW.id_book;
    
    UPDATE books
    SET avg_rating = new_avg,
        nb_reviews = new_count
    WHERE id_book = NEW.id_book;
    
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    -- Review supprimé
    SELECT COUNT(*), ROUND(AVG(rating)::NUMERIC, 2) 
    INTO new_count, new_avg
    FROM reviews
    WHERE id_book = OLD.id_book;
    
    UPDATE books
    SET avg_rating = CASE WHEN new_count = 0 THEN NULL ELSE new_avg END,
        nb_reviews = new_count
    WHERE id_book = OLD.id_book;
    
    RETURN OLD;

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
    
    RETURN NEW;
  END IF;

  -- Clause de sécurité (ne devrait jamais être atteinte)
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
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

-- 4)Fonction pour recherche floue de livres par titre avec trigrammes
CREATE OR REPLACE FUNCTION fuzzy_search_books(
  search_term TEXT,
  threshold REAL DEFAULT 0.3,
  search_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  id_book VARCHAR(42),
  title VARCHAR(255),
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id_book,
    b.title,
    similarity(b.title, search_term) as sim
  FROM books b
  WHERE similarity(b.title, search_term) > threshold
  ORDER BY sim DESC
  LIMIT search_limit;
END;
$$ LANGUAGE plpgsql;

-- 5) is_in_favorite : incrémenté/décrémenté quand un livre est marqué/démarqué favori
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


-- 6) Trigger pour messages : mise à jour du updated_at
CREATE TRIGGER set_timestamp_messages
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
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
  WHERE u.id_user = user_id; 
END;
$$ LANGUAGE plpgsql;

-- Fonction pour la recherche full-text de livres
-- CREATE OR REPLACE FUNCTION search_books(search_term TEXT, search_limit INTEGER DEFAULT 50)
-- RETURNS TABLE(
--   id_book VARCHAR(42),
--   title VARCHAR(255),
--   author VARCHAR(255),
--   avg_rating NUMERIC(3,2),
--   nb_reviews INTEGER,
--   rank REAL
-- ) AS $$
-- BEGIN
--   RETURN QUERY
--   -- Recherche FTS combinée avec trigrammes
--   SELECT 
--     b.id_book,
--     b.title,
--     b.author,
--     b.avg_rating,
--     b.nb_reviews,
--     GREATEST(
--       ts_rank_cd(to_tsvector('french', immutable_unaccent(
--         coalesce(b.title,'') || ' ' || coalesce(b.author,'')
--       )), plainto_tsquery('french', immutable_unaccent(search_term))),
--       similarity(coalesce(b.title,'') || ' ' || coalesce(b.author,''), search_term) * 0.5
--     ) as rank
--   FROM books b
--   WHERE to_tsvector('french', immutable_unaccent(
--     coalesce(b.title,'') || ' ' || coalesce(b.author,'')
--   )) @@ plainto_tsquery('french', immutable_unaccent(search_term))
--      OR (coalesce(b.title,'') || ' ' || coalesce(b.author,'')) % search_term  -- trigramme
--   ORDER BY rank DESC, b.avg_rating DESC NULLS LAST
--   LIMIT search_limit;
-- END;
-- $$ LANGUAGE plpgsql;

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

-- Fonction trigger gestion erreurs triggers reviews
CREATE OR REPLACE FUNCTION update_books_reviews_stats()
RETURNS TRIGGER AS $$
DECLARE
  new_avg NUMERIC(3,2);
  new_count INTEGER;
BEGIN
  -- ✅ Vérifier que id_book existe
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.id_book IS NULL THEN
    RAISE EXCEPTION 'id_book cannot be NULL';
  END IF;
  
  -- ... reste du code
END;
$$ LANGUAGE plpgsql;





-- Créer une fonction pour détecter les patterns dangereux
CREATE OR REPLACE FUNCTION detect_malicious_content()
RETURNS TRIGGER AS $$
BEGIN
  -- Sécurité : ne tester que les champs pertinents selon la table déclenchée
  IF TG_TABLE_NAME = 'users' THEN
    IF NEW.pseudo IS NOT NULL AND NEW.pseudo ~* '<script|<iframe|javascript:|onerror=|onload=' THEN
      RAISE EXCEPTION 'Contenu suspect détecté dans le pseudo: %', NEW.pseudo;
    END IF;

    IF NEW.name IS NOT NULL AND NEW.name ~* '<script|<iframe|javascript:|onerror=|onload=' THEN
      RAISE EXCEPTION 'Contenu suspect détecté dans le nom: %', NEW.name;
    END IF;

    IF NEW.email IS NOT NULL AND NEW.email ~* '<script|javascript:' THEN
      RAISE EXCEPTION 'Contenu suspect détecté dans l''email: %', NEW.email;
    END IF;

    IF NEW.pseudo IS NOT NULL AND NEW.pseudo ~* '(union\s+select|drop\s+table|exec\s*\(|insert\s+into)' THEN
      RAISE EXCEPTION 'Pattern SQL suspect dans le pseudo: %', NEW.pseudo;
    END IF;

  ELSIF TG_TABLE_NAME = 'messages' THEN
    -- messages : vérifier subject et content
    IF NEW.subject IS NOT NULL AND NEW.subject ~* '<script|<iframe|javascript:|onerror=|onload=' THEN
      RAISE EXCEPTION 'Contenu suspect détecté dans le subject des messages: %', NEW.subject;
    END IF;

    IF NEW.content IS NOT NULL AND NEW.content ~* '<script|<iframe|javascript:|onerror=|onload=' THEN
      RAISE EXCEPTION 'Contenu suspect détecté dans le content des messages';
    END IF;

  ELSIF TG_TABLE_NAME = 'reviews' THEN
    -- reviews : vérifier title_rating et comment
    IF NEW.title_rating IS NOT NULL AND NEW.title_rating ~* '<script|<iframe|javascript:|onerror=|onload=' THEN
      RAISE EXCEPTION 'Contenu suspect détecté dans title_rating: %', NEW.title_rating;
    END IF;

    IF NEW.comment IS NOT NULL AND NEW.comment ~* '<script|<iframe|javascript:|onerror=|onload=' THEN
      RAISE EXCEPTION 'Contenu suspect détecté dans le commentaire: %', NEW.comment;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur INSERT et UPDATE
CREATE TRIGGER trg_detect_malicious_users
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION detect_malicious_content();

-- Trigger pour la table messages
CREATE TRIGGER trg_detect_malicious_messages
BEFORE INSERT OR UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION detect_malicious_content();

-- Trigger pour la table reviews
CREATE TRIGGER trg_detect_malicious_reviews
BEFORE INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION detect_malicious_content();









COMMIT;

-- ============================
-- STATISTIQUES
-- ============================

-- 📚 TABLE books
-- On veut améliorer les recherches par titre + auteur (corrélés)
CREATE STATISTICS books_search_stats (dependencies, ndistinct) ON title, author FROM books;

-- Rôle + statut actif sont souvent utilisés ensemble => dependencies
-- Utiliser id_status (clé étrangère) au lieu de "status" qui n'existe plus
CREATE STATISTICS users_role_stats (dependencies, ndistinct) ON id_role, id_status FROM users;

-- Corrélation user/book pour éviter doublons reviews
CREATE STATISTICS reviews_user_book_stats (dependencies, ndistinct) 
ON id_user, id_book FROM reviews;

-- Corrélation library/book/statuts pour requêtes complexes bibliothèques
CREATE STATISTICS bookhaslibrary_stats (dependencies, ndistinct) 
ON id_library, id_book, is_read, is_favorite FROM bookhaslibrary;


-- Mise à jour des statistiques pour prise en compte immédiate
ANALYZE;


