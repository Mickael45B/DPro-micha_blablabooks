<!-- 

PK = clé primaire
FK = clé étrangère

[U] = unique
[NN] = not null

-->


Users(
    id_user PK [VARCHAR(42)],
    name [VARCHAR(255)],
    email [U, NN, VARCHAR(255)],
    pseudo [U, NN, VARCHAR(100)],
    password [NN, VARCHAR(255)],
    refresh_token [TEXT],
    last_login [TIMESTAMPTZ],
    id_role FK → Roles.id_role [VARCHAR(42)],
    id_status FK → Status.id_status [VARCHAR(42)],
    created_at [NN, TIMESTAMPTZ],
    updated_at [TIMESTAMPTZ]
)

Roles(
    id_role PK [VARCHAR(42)],
    role_name [U, NN, VARCHAR(50)],
    created_at [NN, TIMESTAMPTZ],
    updated_at [TIMESTAMPTZ]
)
Permissions(
    id_permission PK [VARCHAR(42)],
    permission_name [U, NN, VARCHAR(50)],
    created_at [NN, TIMESTAMPTZ],
    updated_at [TIMESTAMPTZ]
)

RoleHasPermissions(
    id_rolehaspermission PK [VARCHAR(42)],
    id_role FK → Roles.id_role [NN, VARCHAR(42)],
    id_permission FK → Permissions.id_permission [NN, VARCHAR(42)],
    created_at [NN, TIMESTAMPTZ],
    updated_at [TIMESTAMPTZ],
    CONSTRAINT uq_role_permission UNIQUE(id_role, id_permission)
)

Status(
    id_status PK [VARCHAR(42)],
    status_name [U, NN, VARCHAR(100)],
    created_at [NN, TIMESTAMPTZ],
    updated_at [TIMESTAMPTZ]
)

Books(
    id_book PK [VARCHAR(42)],
    title [NN, VARCHAR(255)],
    isbn [VARCHAR(42)],
    publication_date [TIMESTAMPTZ],
    author [VARCHAR(255)],
    editor [VARCHAR(255)],
    genre [VARCHAR(100)],
    vignetteimage [VARCHAR(255)],
    bookimage [VARCHAR(255)],
    age_limit [INTEGER],
    description [TEXT],
    series [VARCHAR(255)],
    is_in_favorite [INTEGER, DEFAULT 0],
    nb_reviews [INTEGER, DEFAULT 0],
    is_in_library [INTEGER, DEFAULT 0],
    avg_rating [NUMERIC(3,2)],
    created_at [NN, TIMESTAMPTZ],
    updated_at [TIMESTAMPTZ]
)

Libraries(
    id_library PK [VARCHAR(42)],
    name [NN, VARCHAR(255)],
    is_editable [BOOLEAN, DEFAULT FALSE],
    id_user FK → Users.id_user [VARCHAR(42)],
    created_at [NN, TIMESTAMPTZ],
    updated_at [TIMESTAMPTZ]
)

Reviews(
    id_review PK [VARCHAR(42)],
    title_rating [NN, VARCHAR(255)],
    rating [NN, INTEGER CHECK(1-5)],
    comment [NN, VARCHAR(1024)],
    id_user FK → Users.id_user [VARCHAR(42)],
    id_book FK → Books.id_book [NN, VARCHAR(42)],
    created_at [NN, TIMESTAMPTZ],
    updated_at [TIMESTAMPTZ],
    CONSTRAINT uq_user_book_review UNIQUE(id_user, id_book)
)

BookHasLibrary(
    id_bookhaslibrary PK [VARCHAR(42)],
    id_library FK → Libraries.id_library [VARCHAR(42)],
    id_book FK → Books.id_book [VARCHAR(42)],
    is_read [BOOLEAN, DEFAULT FALSE],
    is_favorite [BOOLEAN, DEFAULT FALSE],
    created_at [NN, TIMESTAMPTZ],
    updated_at [TIMESTAMPTZ],
    CONSTRAINT uq_library_book UNIQUE(id_library, id_book)
)

Messages(
    id_message PK [VARCHAR(42)],
    subject [NN, VARCHAR(255)],
    content [NN, TEXT],
    is_read [BOOLEAN, DEFAULT FALSE],
    id_sender FK → Users.id_user [VARCHAR(42)],
    id_receiver FK → Users.id_user [VARCHAR(42)],
    created_at [NN, TIMESTAMPTZ],
    updated_at [TIMESTAMPTZ]
)

Reports(
    id_report PK [VARCHAR(42)],
    report_type [NN, VARCHAR(50) CHECK('user','review','message','other')],
    reported_id [VARCHAR(42)],
    reason [NN, VARCHAR(255)],
    details [TEXT],
    status [NN, VARCHAR(50) CHECK('pending','in_review','resolved','dismissed'), DEFAULT 'pending'],
    id_user FK → Users.id_user [VARCHAR(42)],
    created_at [NN, TIMESTAMPTZ],
    updated_at [TIMESTAMPTZ]
)



