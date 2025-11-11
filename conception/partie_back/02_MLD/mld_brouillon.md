

## Relations et cardinalités

### Relations Users
- **Users** `(1,1)` ─ attribuer ─ `(0,n)` **Roles**
  - Un utilisateur a un rôle (obligatoire)
  - Un rôle peut être attribué à plusieurs utilisateurs

- **Users** `(1,1)` ─ conditionner ─ `(0,n)` **Status**
  - Un utilisateur a un statut (obligatoire)
  - Un statut peut concerner plusieurs utilisateurs

- **Users** `(1,1)` ─ ajouter ─ `(0,n)` **Libraries**
  - Un utilisateur peut créer plusieurs bibliothèques
  - Une bibliothèque appartient à un utilisateur

- **Users** `(1,1)` ─ écrire ─ `(0,n)` **Reviews**
  - Un utilisateur peut écrire plusieurs avis
  - Un avis est écrit par un utilisateur

- **Users** `(1,1)` ─ adresser ─ `(0,n)` **Messages** (expéditeur)
  - Un utilisateur peut envoyer plusieurs messages
  - Un message a un expéditeur

- **Users** `(1,1)` ─ recevoir ─ `(0,n)` **Messages** (destinataire)
  - Un utilisateur peut recevoir plusieurs messages
  - Un message a un destinataire

- **Users** `(1,1)` ─ dénoncer ─ `(0,n)` **Reports**
  - Un utilisateur peut faire plusieurs signalements
  - Un signalement est fait par un utilisateur

### Relations Roles et Permissions
- **Roles** `(1,n)` ─ affecter ─ `(0,n)` **Permissions**
  - Un rôle peut avoir plusieurs permissions
  - Une permission peut être affectée à plusieurs rôles
  - **Table de liaison** : RoleHasPermissions

### Relations Books
- **Books** `(1,1)` ─ posséder ─ `(0,n)` **Reviews**
  - Un livre peut avoir plusieurs avis
  - Un avis concerne un livre

- **Books** `(0,n)` ─ livre_bibliothèque ─ `(0,n)` **Libraries**
  - Un livre peut être dans plusieurs bibliothèques
  - Une bibliothèque peut contenir plusieurs livres
  - **Table de liaison** : BookHasLibrary

---

## Contraintes d'intégrité

### Contraintes CHECK
```sql
-- Users
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
CHECK (pseudo ~ '^[A-Za-z0-9](?:[A-Za-z0-9_'' ]*[A-Za-z0-9])?$')
CHECK (length(btrim(pseudo)) >= 3 AND length(pseudo) <= 32)

-- Books
CHECK (age_limit IS NULL OR age_limit >= 0)
CHECK (avg_rating IS NULL OR (avg_rating >= 1.0 AND avg_rating <= 5.0))
CHECK (is_in_favorite >= 0)
CHECK (nb_reviews >= 0)
CHECK (is_in_library >= 0)
CHECK (publication_date IS NULL OR publication_date <= CURRENT_DATE)

-- Reviews
CHECK (rating BETWEEN 1 AND 5)
CHECK (length(btrim(title_rating)) > 0)
CHECK (length(btrim(comment)) > 0)

-- Messages
CHECK (length(btrim(subject)) > 0)
CHECK (length(btrim(content)) > 0)

-- Reports
CHECK (report_type IN ('user', 'review', 'message', 'other'))
CHECK (status IN ('pending', 'in_review', 'resolved', 'dismissed'))
CHECK (length(btrim(reason)) > 0)
```

### Contraintes UNIQUE
```sql
-- Users
UNIQUE(email)
UNIQUE(pseudo)

-- Roles
UNIQUE(role_name)

-- Permissions
UNIQUE(permission_name)

-- Status
UNIQUE(status_name)

-- RoleHasPermissions
UNIQUE(id_role, id_permission)

-- Reviews
UNIQUE(id_user, id_book) -- Un utilisateur = 1 avis par livre

-- BookHasLibrary
UNIQUE(id_library, id_book) -- Un livre = 1 fois par bibliothèque
```

### Clés étrangères avec actions
```sql
-- ON DELETE SET NULL
Users.id_role → Roles.id_role
Users.id_status → Status.id_status
Libraries.id_user → Users.id_user
Reviews.id_user → Users.id_user
Reviews.id_book → Books.id_book
BookHasLibrary.id_library → Libraries.id_library
BookHasLibrary.id_book → Books.id_book
Messages.id_sender → Users.id_user
Messages.id_receiver → Users.id_user
Reports.id_user → Users.id_user

-- ON DELETE CASCADE
RoleHasPermissions.id_role → Roles.id_role
RoleHasPermissions.id_permission → Permissions.id_permission
```

---

## Index de performance

### Index simples
```sql
-- Users
idx_users_email (email)
idx_users_pseudo (pseudo)
idx_users_pseudo_lower (LOWER(pseudo))
idx_users_role (id_role)
idx_users_refresh_token (refresh_token) WHERE refresh_token IS NOT NULL
idx_users_last_login (last_login) WHERE last_login IS NOT NULL

-- Books
idx_books_isbn (isbn) WHERE isbn IS NOT NULL
idx_books_genre (genre) WHERE genre IS NOT NULL
idx_books_publication_date (publication_date DESC) WHERE publication_date IS NOT NULL
idx_books_popularity (avg_rating DESC NULLS LAST, is_in_favorite DESC, nb_reviews DESC)

-- Reviews
idx_reviews_user (id_user)
idx_reviews_book (id_book)
idx_reviews_rating (rating)
idx_reviews_created_at (created_at DESC)

-- Libraries
idx_libraries_user (id_user) WHERE id_user IS NOT NULL

-- BookHasLibrary
idx_bookhaslibrary_library (id_library)
idx_bookhaslibrary_book (id_book)
idx_bookhaslibrary_is_favorite (is_favorite) WHERE is_favorite = TRUE
idx_bookhaslibrary_user_unread (id_library, is_read) WHERE is_read = FALSE

-- Messages
idx_messages_sender (id_sender)
idx_messages_receiver (id_receiver)
idx_messages_unread (id_receiver, is_read) WHERE is_read = FALSE

-- Reports
idx_reports_user (id_user)
idx_reports_status (status) WHERE status = 'pending'
```

### Index composites
```sql
idx_reviews_user_book (id_user, id_book)
idx_bookhaslibrary_library_book (id_library, id_book)
idx_rolehaspermissions_role (id_role)
idx_rolehaspermissions_permission (id_permission)
idx_reports_type_status (report_type, status)
```

### Index GIN (recherche textuelle)
```sql
idx_books_author_title_trgm ((coalesce(author,'') || ' ' || title) gin_trgm_ops)
idx_books_author_trgm (author gin_trgm_ops)
idx_books_title_trgm (title gin_trgm_ops)
```

### Index BRIN (séries temporelles)
```sql
idx_reviews_created_brin (created_at)
idx_messages_created_brin (created_at)
```

---

## Statistiques PostgreSQL
```sql
-- Corrélation titre + auteur (recherche livres)
CREATE STATISTICS books_search_stats (dependencies, ndistinct) 
ON title, author FROM books;

-- Corrélation rôle + statut (requêtes utilisateurs)
CREATE STATISTICS users_role_stats (dependencies, ndistinct) 
ON id_role, id_status FROM users;

-- Corrélation user/book (éviter doublons reviews)
CREATE STATISTICS reviews_user_book_stats (dependencies, ndistinct) 
ON id_user, id_book FROM reviews;

-- Corrélation library/book/statuts (requêtes bibliothèques)
CREATE STATISTICS bookhaslibrary_stats (dependencies, ndistinct) 
ON id_library, id_book, is_read, is_favorite FROM bookhaslibrary;
```

---

## Triggers automatiques

### Mise à jour `updated_at`
```sql
-- Toutes les tables avec colonne updated_at
TRIGGER: set_timestamp_{table}
FUNCTION: update_timestamp()
```

### Compteurs automatiques Books
```sql
-- Mise à jour nb_reviews + avg_rating
TRIGGER: trg_books_reviews_stats (reviews)
FUNCTION: update_books_reviews_stats()

-- Mise à jour is_in_library
TRIGGER: trg_books_in_library (bookhaslibrary)
FUNCTION: update_books_in_library()

-- Mise à jour is_in_favorite
TRIGGER: trg_books_favorites (bookhaslibrary)
FUNCTION: update_books_favorites()
```

### Détection contenu malveillant
```sql
-- Validation XSS/SQLi avant insertion
TRIGGER: trg_detect_malicious_users (users)
TRIGGER: trg_detect_malicious_messages (messages)
TRIGGER: trg_detect_malicious_reviews (reviews)
FUNCTION: detect_malicious_content()