<!-- 

PK = clé primaire
FK = clé étrangère

[U] = unique
[NN] = not null

-->

Users(
    uuid PK,
    name [NN],
    mail [U, NN],
    pseudo [U, NN],
    id_roles FK → ROLES.id_roles,
    password [NN]
)

Roles(
    uuid PK,
    name [U, NN]
)

Permissions(
    uuid PK,
    name [U, NN]
)

Rolehaspermissions(
    uuid PK,
    id_roles FK → ROLES.id_roles,
    id_autorisations FK → PERMISSIONS.uuid,
)

Libraries(
    uuid PK,
    id_utilisateur FK → USERS.uuid,
    name [NN],
    is_edidable [NN]
)

Reviews(
    uuid PK,
    note [NN],
    comment [NN],
    id_utilisateur FK → USERS.uuid,
    id_book FK → BOOKS.uuid
)

Books(
    uuid PK,
    title [NN],
    isbn,
    publication_date,
    author,
    editor,
    gender, 
    vignetteimage,
    bookimage,
    age_limit,
    description,
    series,
    is_in_favorite,
    nb_reviews,
    is_in_library,
    avg_rating

)

Bookhaslibrary(
    uuid PK,
    id_library FK → LIBRARIES.uuid,
    id_book FK → BOOKS.uuid
    is_read,
    is_favorite
)
