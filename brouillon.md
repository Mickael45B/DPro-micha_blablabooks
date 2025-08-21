

CREATE TABLE UTILISATEUR (
    id_utilisateur UUID PRIMARY KEY,
    nom VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    mot_de_passe_hache VARCHAR(255),
    date_creation TIMESTAMP,
    date_modification TIMESTAMP
);

CREATE TABLE BIBLIOTHEQUE (
    id_bibliotheque UUID PRIMARY KEY,
    id_utilisateur UUID REFERENCES UTILISATEUR(id_utilisateur),
    nom VARCHAR(255),
    date_creation TIMESTAMP,
    date_modification TIMESTAMP
);

CREATE TABLE LIVRE (
    id_livre UUID PRIMARY KEY,
    ISBN VARCHAR,
    titre VARCHAR,
    auteur VARCHAR,
    date_publication DATE,
    prix DECIMAL,
    genre VARCHAR,
    editeur VARCHAR(100),
    image VARCHAR,
    limiteAge INTEGER,
    date_creation TIMESTAMP,
    date_modification TIMESTAMP,
    description : VARCHAR
);

CREATE TABLE AVIS (
    id_avis UUID PRIMARY KEY,
    id_utilisateur UUID REFERENCES UTILISATEUR(id_utilisateur),
    id_livre UUID REFERENCES LIVRE(id_livre),
    note INT CHECK (note >= 0 AND note <= 5),
    commentaire TEXT,
    date_creation TIMESTAMP,
    date_modification TIMESTAMP
);

CREATE TABLE LIVRE_BIBLIOTHEQUE (
    id UUID PRIMARY KEY,
    id_livre UUID REFERENCES LIVRE(id_livre),
    id_bibliotheque UUID REFERENCES BIBLIOTHEQUE(id_bibliotheque),
    est_favori BOOLEAN,
    est_lu BOOLEAN,
    date_creation TIMESTAMP,
    date_modification TIMESTAMP
);

CREATE TABLE UTILISATEUR_LIVRE (
    id UUID PRIMARY KEY,
    id_utilisateur UUID REFERENCES UTILISATEUR(id_utilisateur),
    id_livre UUID REFERENCES LIVRE(id_livre),
    date_creation TIMESTAMP,
    date_modification TIMESTAMP
);

-------------------------------------------------------------------------------------------------------------------------------------
-- Données pour la table UTILISATEUR
INSERT INTO UTILISATEUR (id_utilisateur, nom, email, mot_de_passe_hache, date_creation, date_modification) VALUES
('1e2d3c4b-5a6f-7e8d-9c0b-1a2f3e4d5c6b', 'Alice Dupont', 'alice.dupont@example.com', 'hashed_password_1', '2025-01-01 10:00:00', '2025-01-01 10:00:00'),
('2e3d4c5b-6a7f-8e9d-0c1b-2a3f4e5d6c7b', 'Bob Martin', 'bob.martin@example.com', 'hashed_password_2', '2025-01-02 11:00:00', '2025-01-02 11:00:00'),
('3f4e5d6c-7b8a-9f0e-1d2c-3b4a5f6e7d8c', 'Charlie Durand', 'charlie.durand@example.com', 'hashed_password_3', '2025-01-03 12:00:00', '2025-01-03 12:00:00'),
('4g5f6e7d-8c9b-0a1f-2e3d-4c5b6a7f8e9d', 'Diane Morel', 'diane.morel@example.com', 'hashed_password_4', '2025-01-04 13:00:00', '2025-01-04 13:00:00'),
('5h6g7f8e-9d0c-1b2a-3f4e-5d6c7b8a9f0e', 'Eve Lambert', 'eve.lambert@example.com', 'hashed_password_5', '2025-01-05 14:00:00', '2025-01-05 14:00:00'),
('6i7h8g9f-0e1d-2c3b-4a5f-6e7d8c9b0a1f', 'Franck Petit', 'franck.petit@example.com', 'hashed_password_6', '2025-01-06 15:00:00', '2025-01-06 15:00:00'),
('7j8i9h0g-1f2e-3d4c-5b6a-7f8e9d0c1b2a', 'Gina Blanc', 'gina.blanc@example.com', 'hashed_password_7', '2025-01-07 16:00:00', '2025-01-07 16:00:00'),
('8k9j0i1h-2g3f-4e5d-6c7b-8a9f0e1d2c3b', 'Hugo Noir', 'hugo.noir@example.com', 'hashed_password_8', '2025-01-08 17:00:00', '2025-01-08 17:00:00'),
('9l0k1j2i-3h4g-5f6e-7d8c-9b0a1f2e3d4c', 'Isabelle Vert', 'isabelle.vert@example.com', 'hashed_password_9', '2025-01-09 18:00:00', '2025-01-09 18:00:00'),
('0m1l2k3j-4i5h-6g7f-8e9d-0c1b2a3f4e5d', 'Julien Bleu', 'julien.bleu@example.com', 'hashed_password_10', '2025-01-10 19:00:00', '2025-01-10 19:00:00'),
('a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p', 'Paul Moreau', 'paul.moreau@example.com', 'hashed_password_11', '2025-01-11 10:00:00', '2025-01-11 10:00:00'),
('b2c3d4e5-f6g7-8h9i-0j1k-2l3m4n5o6p7q', 'Sophie Lefevre', 'sophie.lefevre@example.com', 'hashed_password_12', '2025-01-12 11:00:00', '2025-01-12 11:00:00'),
('c3d4e5f6-g7h8-9i0j-1k2l-3m4n5o6p7q8r', 'Marc Dubois', 'marc.dubois@example.com', 'hashed_password_13', '2025-01-13 12:00:00', '2025-01-13 12:00:00'),
('d4e5f6g7-h8i9-0j1k-2l3m-4n5o6p7q8r9s', 'Emma Fontaine', 'emma.fontaine@example.com', 'hashed_password_14', '2025-01-14 13:00:00', '2025-01-14 13:00:00'),
('e5f6g7h8-i9j0-1k2l-3m4n-5o6p7q8r9s0t', 'Lucas Bernard', 'lucas.bernard@example.com', 'hashed_password_15', '2025-01-15 14:00:00', '2025-01-15 14:00:00'),
('f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0t1u', 'Chloé Martin', 'chloe.martin@example.com', 'hashed_password_16', '2025-01-16 15:00:00', '2025-01-16 15:00:00'),
('g7h8i9j0-k1l2-3m4n-5o6p-7q8r9s0t1u2v', 'Nathan Simon', 'nathan.simon@example.com', 'hashed_password_17', '2025-01-17 16:00:00', '2025-01-17 16:00:00'),
('h8i9j0k1-l2m3-4n5o-6p7q-8r9s0t1u2v3w', 'Camille Girard', 'camille.girard@example.com', 'hashed_password_18', '2025-01-18 17:00:00', '2025-01-18 17:00:00'),
('i9j0k1l2-m3n4-5o6p-7q8r-9s0t1u2v3w4x', 'Léo Dupuis', 'leo.dupuis@example.com', 'hashed_password_19', '2025-01-19 18:00:00', '2025-01-19 18:00:00'),
('j0k1l2m3-n4o5-6p7q-8r9s-0t1u2v3w4x5y', 'Julie Caron', 'julie.caron@example.com', 'hashed_password_20', '2025-01-20 19:00:00', '2025-01-20 19:00:00');

-- Données pour la table BIBLIOTHEQUE
INSERT INTO BIBLIOTHEQUE (id_bibliotheque, id_utilisateur, nom, date_creation, date_modification) VALUES
('1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', '1e2d3c4b-5a6f-7e8d-9c0b-1a2f3e4d5c6b', 'Bibliothèque Alice', '2025-01-03 12:00:00', '2025-01-03 12:00:00'),
('2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q', '2e3d4c5b-6a7f-8e9d-0c1b-2a3f4e5d6c7b', 'Bibliothèque Bob', '2025-01-04 13:00:00', '2025-01-04 13:00:00'),
('3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', '3f4e5d6c-7b8a-9f0e-1d2c-3b4a5f6e7d8c', 'Bibliothèque Charlie', '2025-01-05 14:00:00', '2025-01-05 14:00:00'),
('4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', '4g5f6e7d-8c9b-0a1f-2e3d-4c5b6a7f8e9d', 'Bibliothèque Diane', '2025-01-06 15:00:00', '2025-01-06 15:00:00'),
('5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', '5h6g7f8e-9d0c-1b2a-3f4e-5d6c7b8a9f0e', 'Bibliothèque Eve', '2025-01-07 16:00:00', '2025-01-07 16:00:00'),
('6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', '6i7h8g9f-0e1d-2c3b-4a5f-6e7d8c9b0a1f', 'Bibliothèque Franck', '2025-01-08 17:00:00', '2025-01-08 17:00:00'),
('7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v', '7j8i9h0g-1f2e-3d4c-5b6a-7f8e9d0c1b2a', 'Bibliothèque Gina', '2025-01-09 18:00:00', '2025-01-09 18:00:00'),
('8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w', '8k9j0i1h-2g3f-4e5d-6c7b-8a9f0e1d2c3b', 'Bibliothèque Hugo', '2025-01-10 19:00:00', '2025-01-10 19:00:00'),
('9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x', '9l0k1j2i-3h4g-5f6e-7d8c-9b0a1f2e3d4c', 'Bibliothèque Isabelle', '2025-01-11 20:00:00', '2025-01-11 20:00:00'),
('0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y', '0m1l2k3j-4i5h-6g7f-8e9d-0c1b2a3f4e5d', 'Bibliothèque Julien', '2025-01-12 21:00:00', '2025-01-12 21:00:00'),
('a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p', 'a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p', 'Bibliothèque Paul', '2025-01-11 10:00:00', '2025-01-11 10:00:00'),
('b2c3d4e5-f6g7-8h9i-0j1k-2l3m4n5o6p7q', 'b2c3d4e5-f6g7-8h9i-0j1k-2l3m4n5o6p7q', 'Bibliothèque Sophie', '2025-01-12 11:00:00', '2025-01-12 11:00:00'),
('c3d4e5f6-g7h8-9i0j-1k2l-3m4n5o6p7q8r', 'c3d4e5f6-g7h8-9i0j-1k2l-3m4n5o6p7q8r', 'Bibliothèque Marc', '2025-01-13 12:00:00', '2025-01-13 12:00:00'),
('d4e5f6g7-h8i9-0j1k-2l3m-4n5o6p7q8r9s', 'd4e5f6g7-h8i9-0j1k-2l3m-4n5o6p7q8r9s', 'Bibliothèque Emma', '2025-01-14 13:00:00', '2025-01-14 13:00:00'),
('e5f6g7h8-i9j0-1k2l-3m4n-5o6p7q8r9s0t', 'e5f6g7h8-i9j0-1k2l-3m4n-5o6p7q8r9s0t', 'Bibliothèque Lucas', '2025-01-15 14:00:00', '2025-01-15 14:00:00'),
('f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0t1u', 'f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0t1u', 'Bibliothèque Chloé', '2025-01-16 15:00:00', '2025-01-16 15:00:00'),
('g7h8i9j0-k1l2-3m4n-5o6p-7q8r9s0t1u2v', 'g7h8i9j0-k1l2-3m4n-5o6p-7q8r9s0t1u2v', 'Bibliothèque Nathan', '2025-01-17 16:00:00', '2025-01-17 16:00:00'),
('h8i9j0k1-l2m3-4n5o-6p7q-8r9s0t1u2v3w', 'h8i9j0k1-l2m3-4n5o-6p7q-8r9s0t1u2v3w', 'Bibliothèque Camille', '2025-01-18 17:00:00', '2025-01-18 17:00:00'),
('i9j0k1l2-m3n4-5o6p-7q8r-9s0t1u2v3w4x', 'i9j0k1l2-m3n4-5o6p-7q8r-9s0t1u2v3w4x', 'Bibliothèque Léo', '2025-01-19 18:00:00', '2025-01-19 18:00:00'),
('j0k1l2m3-n4o5-6p7q-8r9s-0t1u2v3w4x5y', 'j0k1l2m3-n4o5-6p7q-8r9s-0t1u2v3w4x5y', 'Bibliothèque Julie', '2025-01-20 19:00:00', '2025-01-20 19:00:00');

-- Données pour la table LIVRE
INSERT INTO LIVRE (id_livre, ISBN, titre, auteur, date_publication, prix, genre, editeur, image, limiteAge, date_creation, date_modification) VALUES
('1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', '978-3-16-148410-0', 'Livre 1', 'Auteur 1', '2020-01-01', 19.99, 'Fiction', 'Editeur 1', 'image1.jpg', 12, '2025-01-05 14:00:00', '2025-01-05 14:00:00'),
('2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q', '978-1-23-456789-7', 'Livre 2', 'Auteur 2', '2021-02-01', 24.99, 'Non-fiction', 'Editeur 2', 'image2.jpg', 16, '2025-01-06 15:00:00', '2025-01-06 15:00:00'),
('3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', '978-0-12-345678-9', 'Livre 3', 'Auteur 3', '2019-03-01', 29.99, 'Science', 'Editeur 3', 'image3.jpg', 18, '2025-01-07 16:00:00', '2025-01-07 16:00:00'),
('4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', '978-4-56-789012-3', 'Livre 4', 'Auteur 4', '2018-04-01', 14.99, 'Histoire', 'Editeur 4', 'image4.jpg', 10, '2025-01-08 17:00:00', '2025-01-08 17:00:00'),
('5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', '978-5-67-890123-4', 'Livre 5', 'Auteur 5', '2022-05-01', 9.99, 'Fantasy', 'Editeur 5', 'image5.jpg', 8, '2025-01-09 18:00:00', '2025-01-09 18:00:00'),
('6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', '978-6-78-901234-5', 'Livre 6', 'Auteur 6', '2023-06-01', 19.99, 'Romance', 'Editeur 6', 'image6.jpg', 15, '2025-01-10 19:00:00', '2025-01-10 19:00:00'),
('7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v', '978-7-89-012345-6', 'Livre 7', 'Auteur 7', '2024-07-01', 12.99, 'Thriller', 'Editeur 7', 'image7.jpg', 13, '2025-01-11 20:00:00', '2025-01-11 20:00:00'),
('8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w', '978-8-90-123456-7', 'Livre 8', 'Auteur 8', '2025-08-01', 22.99, 'Mystère', 'Editeur 8', 'image8.jpg', 18, '2025-01-12 21:00:00', '2025-01-12 21:00:00'),
('9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x', '978-9-01-234567-8', 'Livre 9', 'Auteur 9', '2026-09-01', 17.99, 'Biographie', 'Editeur 9', 'image9.jpg', 16, '2025-01-13 22:00:00', '2025-01-13 22:00:00'),
('0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y', '978-0-12-345678-9', 'Livre 10', 'Auteur 10', '2027-10-01', 25.99, 'Science-fiction', 'Editeur 10', 'image10.jpg', 14, '2025-01-14 23:00:00', '2025-01-14 23:00:00'),
('a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p', '978-0-11-111111-1', 'Livre 11', 'Auteur 11', '2021-01-01', 15.99, 'Aventure', 'Editeur 11', 'image11.jpg', 10, '2025-01-11 10:00:00', '2025-01-11 10:00:00'),
('b2c3d4e5-f6g7-8h9i-0j1k-2l3m4n5o6p7q', '978-0-22-222222-2', 'Livre 12', 'Auteur 12', '2022-02-02', 20.99, 'Fantastique', 'Editeur 12', 'image12.jpg', 12, '2025-01-12 11:00:00', '2025-01-12 11:00:00'),
('c3d4e5f6-g7h8-9i0j-1k2l-3m4n5o6p7q8r', '978-0-33-333333-3', 'Livre 13', 'Auteur 13', '2023-03-03', 25.99, 'Science', 'Editeur 13', 'image13.jpg', 14, '2025-01-13 12:00:00', '2025-01-13 12:00:00'),
('d4e5f6g7-h8i9-0j1k-2l3m-4n5o6p7q8r9s', '978-0-44-444444-4', 'Livre 14', 'Auteur 14', '2024-04-04', 30.99, 'Histoire', 'Editeur 14', 'image14.jpg', 16, '2025-01-14 13:00:00', '2025-01-14 13:00:00'),
('e5f6g7h8-i9j0-1k2l-3m4n-5o6p7q8r9s0t', '978-0-55-555555-5', 'Livre 15', 'Auteur 15', '2025-05-05', 35.99, 'Biographie', 'Editeur 15', 'image15.jpg', 18, '2025-01-15 14:00:00', '2025-01-15 14:00:00'),
('f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0t1u', '978-0-66-666666-6', 'Livre 16', 'Auteur 16', '2026-06-06', 40.99, 'Romance', 'Editeur 16', 'image16.jpg', 15, '2025-01-16 15:00:00', '2025-01-16 15:00:00'),
('g7h8i9j0-k1l2-3m4n-5o6p-7q8r9s0t1u2v', '978-0-77-777777-7', 'Livre 17', 'Auteur 17', '2027-07-07', 45.99, 'Thriller', 'Editeur 17', 'image17.jpg', 13, '2025-01-17 16:00:00', '2025-01-17 16:00:00'),
('h8i9j0k1-l2m3-4n5o-6p7q-8r9s0t1u2v3w', '978-0-88-888888-8', 'Livre 18', 'Auteur 18', '2028-08-08', 50.99, 'Mystère', 'Editeur 18', 'image18.jpg', 12, '2025-01-18 17:00:00', '2025-01-18 17:00:00'),
('i9j0k1l2-m3n4-5o6p-7q8r-9s0t1u2v3w4x', '978-0-99-999999-9', 'Livre 19', 'Auteur 19', '2029-09-09', 55.99, 'Science-fiction', 'Editeur 19', 'image19.jpg', 16, '2025-01-19 18:00:00', '2025-01-19 18:00:00'),
('j0k1l2m3-n4o5-6p7q-8r9s-0t1u2v3w4x5y', '978-1-00-000000-0', 'Livre 20', 'Auteur 20', '2030-10-10', 60.99, 'Fantasy', 'Editeur 20', 'image20.jpg', 14, '2025-01-20 19:00:00', '2025-01-20 19:00:00');

INSERT INTO AVIS (id_avis, id_utilisateur, id_livre, note, commentaire, date_creation, date_modification) VALUES
('1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', '1e2d3c4b-5a6f-7e8d-9c0b-1a2f3e4d5c6b', '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', 5, 'Excellent livre!', '2025-01-01 10:00:00', '2025-01-01 10:00:00'),
('2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q', '2e3d4c5b-6a7f-8e9d-0c1b-2a3f4e5d6c7b', '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q', 4, 'Très bon livre.', '2025-01-02 11:00:00', '2025-01-02 11:00:00'),
('3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', '3f4e5d6c-7b8a-9f0e-1d2c-3b4a5f6e7d8c', '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 3, 'Bon livre.', '2025-01-03 12:00:00', '2025-01-03 12:00:00'),
('4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', '4g5f6e7d-8c9b-0a1f-2e3d-4c5b6a7f8e9d', '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 2, 'Moyen.', '2025-01-04 13:00:00', '2025-01-04 13:00:00'),
('5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', '5h6g7f8e-9d0c-1b2a-3f4e-5d6c7b8a9f0e', '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 1, 'Décevant.', '2025-01-05 14:00:00', '2025-01-05 14:00:00'),
('6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', '6i7h8g9f-0e1d-2c3b-4a5f-6e7d8c9b0a1f', '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', 5, 'Un chef-d\'œuvre!', '2025-01-06 15:00:00', '2025-01-06 15:00:00'),
('7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v', '7j8i9h0g-1f2e-3d4c-5b6a-7f8e9d0c1b2a', '7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v', 4, 'Très intéressant.', '2025-01-07 16:00:00', '2025-01-07 16:00:00'),
('8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w', '8k9j0i1h-2g3f-4e5d-6c7b-8a9f0e1d2c3b', '8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w', 3, 'Pas mal.', '2025-01-08 17:00:00', '2025-01-08 17:00:00'),
('9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x', '9l0k1j2i-3h4g-5f6e-7d8c-9b0a1f2e3d4c', '9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x', 2, 'Peut mieux faire.', '2025-01-09 18:00:00', '2025-01-09 18:00:00'),
('0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y', '0m1l2k3j-4i5h-6g7f-8e9d-0c1b2a3f4e5d', '0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y', 5, 'Incroyable!', '2025-01-10 19:00:00', '2025-01-10 19:00:00'),
('a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p', '1e2d3c4b-5a6f-7e8d-9c0b-1a2f3e4d5c6b', '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', 5, 'Excellent livre!', '2025-01-01 10:00:00', '2025-01-01 10:00:00'),
('b2c3d4e5-f6g7-8h9i-0j1k-2l3m4n5o6p7q', '2e3d4c5b-6a7f-8e9d-0c1b-2a3f4e5d6c7b', '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q', 4, 'Très bon livre.', '2025-01-02 11:00:00', '2025-01-02 11:00:00'),
('c3d4e5f6-g7h8-9i0j-1k2l-3m4n5o6p7q8r', '3f4e5d6c-7b8a-9f0e-1d2c-3b4a5f6e7d8c', '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 3, 'Bon livre.', '2025-01-03 12:00:00', '2025-01-03 12:00:00'),
('d4e5f6g7-h8i9-0j1k-2l3m-4n5o6p7q8r9s', '4g5f6e7d-8c9b-0a1f-2e3d-4c5b6a7f8e9d', '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 2, 'Moyen.', '2025-01-04 13:00:00', '2025-01-04 13:00:00'),
('e5f6g7h8-i9j0-1k2l-3m4n-5o6p7q8r9s0t', '5h6g7f8e-9d0c-1b2a-3f4e-5d6c7b8a9f0e', '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 1, 'Décevant.', '2025-01-05 14:00:00', '2025-01-05 14:00:00'),
('f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0t1u', '6i7h8g9f-0e1d-2c3b-4a5f-6e7d8c9b0a1f', '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', 5, 'Un chef-d\'œuvre!', '2025-01-06 15:00:00', '2025-01-06 15:00:00'),
('g7h8i9j0-k1l2-3m4n-5o6p-7q8r9s0t1u2v', '7j8i9h0g-1f2e-3d4c-5b6a-7f8e9d0c1b2a', '7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v', 4, 'Très intéressant.', '2025-01-07 16:00:00', '2025-01-07 16:00:00'),
('h8i9j0k1-l2m3-4n5o-6p7q-8r9s0t1u2v3w', '8k9j0i1h-2g3f-4e5d-6c7b-8a9f0e1d2c3b', '8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w', 3, 'Pas mal.', '2025-01-08 17:00:00', '2025-01-08 17:00:00'),
('i9j0k1l2-m3n4-5o6p-7q8r-9s0t1u2v3w4x', '9l0k1j2i-3h4g-5f6e-7d8c-9b0a1f2e3d4c', '9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x', 2, 'Peut mieux faire.', '2025-01-09 18:00:00', '2025-01-09 18:00:00'),
('j0k1l2m3-n4o5-6p7q-8r9s-0t1u2v3w4x5y', '0m1l2k3j-4i5h-6g7f-8e9d-0c1b2a3f4e5d', '0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y', 5, 'Incroyable!', '2025-01-10 19:00:00', '2025-01-10 19:00:00');

-- Données pour la table LIVRE_BIBLIOTHEQUE
INSERT INTO LIVRE_BIBLIOTHEQUE (id, id_livre, id_bibliotheque, est_favori, est_lu, date_creation, date_modification) VALUES
('1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', TRUE, FALSE, '2025-01-01 10:00:00', '2025-01-01 10:00:00'),
('2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q', '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q', '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q', FALSE, TRUE, '2025-01-02 11:00:00', '2025-01-02 11:00:00'),
('3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', TRUE, TRUE, '2025-01-03 12:00:00', '2025-01-03 12:00:00'),
('4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', FALSE, FALSE, '2025-01-04 13:00:00', '2025-01-04 13:00:00'),
('5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', TRUE, FALSE, '2025-01-05 14:00:00', '2025-01-05 14:00:00'),
('6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', FALSE, TRUE, '2025-01-06 15:00:00', '2025-01-06 15:00:00'),
('7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v', '7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v', '7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v', TRUE, TRUE, '2025-01-07 16:00:00', '2025-01-07 16:00:00'),
('8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w', '8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w', '8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w', FALSE, FALSE, '2025-01-08 17:00:00', '2025-01-08 17:00:00'),
('9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x', '9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x', '9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x', TRUE, FALSE, '2025-01-09 18:00:00', '2025-01-09 18:00:00'),
('0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y', '0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y', '0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y', FALSE, TRUE, '2025-01-10 19:00:00', '2025-01-10 19:00:00'),
('a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p', '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', TRUE, FALSE, '2025-01-01 10:00:00', '2025-01-01 10:00:00'),
('b2c3d4e5-f6g7-8h9i-0j1k-2l3m4n5o6p7q', '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q', '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q', FALSE, TRUE, '2025-01-02 11:00:00', '2025-01-02 11:00:00'),
('c3d4e5f6-g7h8-9i0j-1k2l-3m4n5o6p7q8r', '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', TRUE, TRUE, '2025-01-03 12:00:00', '2025-01-03 12:00:00'),
('d4e5f6g7-h8i9-0j1k-2l3m-4n5o6p7q8r9s', '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', FALSE, FALSE, '2025-01-04 13:00:00', '2025-01-04 13:00:00'),
('e5f6g7h8-i9j0-1k2l-3m4n-5o6p7q8r9s0t', '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', TRUE, FALSE, '2025-01-05 14:00:00', '2025-01-05 14:00:00'),
('f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0t1u', '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', FALSE, TRUE, '2025-01-06 15:00:00', '2025-01-06 15:00:00'),
('g7h8i9j0-k1l2-3m4n-5o6p-7q8r9s0t1u2v', '7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v', '7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v', TRUE, TRUE, '2025-01-07 16:00:00', '2025-01-07 16:00:00'),
('h8i9j0k1-l2m3-4n5o-6p7q-8r9s0t1u2v3w', '8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w', '8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w', FALSE, FALSE, '2025-01-08 17:00:00', '2025-01-08 17:00:00'),
('i9j0k1l2-m3n4-5o6p-7q8r-9s0t1u2v3w4x', '9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x', '9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x', TRUE, FALSE, '2025-01-09 18:00:00', '2025-01-09 18:00:00'),
('j0k1l2m3-n4o5-6p7q-8r9s-0t1u2v3w4x5y', '0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y', '0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y', FALSE, TRUE, '2025-01-10 19:00:00', '2025-01-10 19:00:00');

-- Données pour la table UTILISATEUR_LIVRE
INSERT INTO UTILISATEUR_LIVRE (id, id_utilisateur, id_livre, date_creation, date_modification) VALUES
('1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', '1e2d3c4b-5a6f-7e8d-9c0b-1a2f3e4d5c6b', '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', '2025-01-01 10:00:00', '2025-01-01 10:00:00'),
('2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q', '2e3d4c5b-6a7f-8e9d-0c1b-2a3f4e5d6c7b', '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q', '2025-01-02 11:00:00', '2025-01-02 11:00:00'),
('3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', '3f4e5d6c-7b8a-9f0e-1d2c-3b4a5f6e7d8c', '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', '2025-01-03 12:00:00', '2025-01-03 12:00:00'),
('4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', '4g5f6e7d-8c9b-0a1f-2e3d-4c5b6a7f8e9d', '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', '2025-01-04 13:00:00', '2025-01-04 13:00:00'),
('5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', '5h6g7f8e-9d0c-1b2a-3f4e-5d6c7b8a9f0e', '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', '2025-01-05 14:00:00', '2025-01-05 14:00:00'),
('6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', '6i7h8g9f-0e1d-2c3b-4a5f-6e7d8c9b0a1f', '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', '2025-01-06 15:00:00', '2025-01-06 15:00:00'),
('a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p', '1e2d3c4b-5a6f-7e8d-9c0b-1a2f3e4d5c6b', '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', '2025-01-01 10:00:00', '2025-01-01 10:00:00'),
('b2c3d4e5-f6g7-8h9i-0j1k-2l3m4n5o6p7q', '2e3d4c5b-6a7f-8e9d-0c1b-2a3f4e5d6c7b', '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q', '2025-01-02 11:00:00', '2025-01-02 11:00:00'),
('c3d4e5f6-g7h8-9i0j-1k2l-3m4n5o6p7q8r', '3f4e5d6c-7b8a-9f0e-1d2c-3b4a5f6e7d8c', '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', '2025-01-03 12:00:00', '2025-01-03 12:00:00'),
('d4e5f6g7-h8i9-0j1k-2l3m-4n5o6p7q8r9s', '4g5f6e7d-8c9b-0a1f-2e3d-4c5b6a7f8e9d', '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', '2025-01-04 13:00:00', '2025-01-04 13:00:00'),
('e5f6g7h8-i9j0-1k2l-3m4n-5o6p7q8r9s0t', '5h6g7f8e-9d0c-1b2a-3f4e-5d6c7b8a9f0e', '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', '2025-01-05 14:00:00', '2025-01-05 14:00:00'),
('f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0t1u', '6i7h8g9f-0e1d-2c3b-4a5f-6e7d8c9b0a1f', '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', '2025-01-06 15:00:00', '2025-01-06 15:00:00');