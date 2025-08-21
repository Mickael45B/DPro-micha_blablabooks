-- Données pour la table UTILISATEUR INSERT INTO UTILISATEUR (id_utilisateur, nom, email, mot_de_passe_hache, date_creation, date_modification) 
VALUES ('1e2d3c4b-5a6f-7e8d-9c0b-1a2f3e4d5c6b', 'Alice Dupont', 'alice.dupont@example.com', 'hashed_password_1', '2025-01-01 10:00:00', '2025-01-01 10:00:00'),
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

-- Données pour la table BIBLIOTHEQUE INSERT INTO BIBLIOTHEQUE (id_bibliotheque, id_utilisateur, nom, date_creation, date_modification) 
VALUES ('1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', '1e2d3c4b-5a6f-7e8d-9c0b-1a2f3e4d5c6b', 'Bibliothèque Alice', '2025-01-03 12:00:00', '2025-01-03 12:00:00'),
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

-- Données pour la table LIVRE INSERT INTO LIVRE (id_livre, ISBN, titre, auteur, date_publication, prix, genre, editeur, image, limiteAge, date_creation, date_modification) 
VALUES ('1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', '978-3-16-148410-0', 'Livre 1', 'Auteur 1', '2020-01-01', 19.99, 'Fiction', 'Editeur 1', 'image1.jpg', 12, '2025-01-05 14:00:00', '2025-01-05 14:00:00'),
 ('2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q', '978-1-23-456789-7', 'Livre 2', 'Auteur 2', '2021-02-01', 24.99, 'Non-fiction', 'Editeur 2', 'image2.jpg', 16, '2025-01-06 15:00:00', '2025-01-06 15:00:00'), 
 ('3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', '978-0-12-345678-9', 'Livre 3', 'Auteur 3', '2019-03-01', 29.99, 'Science', 'Editeur 3', 'image3.jpg', 18, '2025-01-07 16:00:00', '2025-01-07 16:00:00'),
 ('4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', '978-4-56-789012-3', 'Livre 4', 'Auteur 4', '2018-04-01', 14.99, 'Histoire', 'Editeur 4', 'image4.jpg', 10, '2025-01-08 17:00:00', '2025-01-08 17:00:00'), ('5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', '978-5-67-890123-4', 'Livre 5', 'Auteur 5', '2022-05-01', 9.99, 'Fantasy', 'Editeur 5', 'image5.jpg', 8, '2025-01-09 18:00:00', '2025-01-09 18:00:00'),
  ('6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', '978-6-78-901234-5', 'Livre 6', 'Auteur 6', '2023-06-01', 19.99, 'Romance', 'Editeur 6', 'image6.jpg', 15, '2025-01-10 19:00:00', '2025-01-10 19:00:00'), ('7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v', '978-7-89-012345-6', 'Livre 7', 'Auteur 7', '2024-07-01', 12.99, 'Thriller', 'Editeur 7', 'image7.jpg', 13, '2025-01-11 20:00:00', '2025-01-11 20:00:00'), ('8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w', '978-8-90-123456-7', 'Livre 8', 'Auteur 8', '2025-08-01', 22.99, 'Mystère', 'Editeur 8', 'image8.jpg', 18, '2025-01-12 21:00:00', '2025-01-12 21:00:00'), ('9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x', '978-9-01-234567-8', 'Livre 9', 'Auteur 9', '2026-09-01', 17.99, 'Biographie', 'Editeur 9', 'image9.jpg', 16, '2025-01-13 22:00:00', '2025-01-13 22:00:00'), ('0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y', '978-0-12-345678-9', 'Livre 10', 'Auteur 10', '2027-10-01', 25.99, 'Science-fiction', 'Editeur 10', 'image10.jpg', 14, '2025-01-14 23:00:00', '2025-01-14 23:00:00'), ('a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p', '978-0-11-111111-1', 'Livre 11', 'Auteur 11', '2021-01-01', 15.99, 'Aventure', 'Editeur 11', 'image11.jpg', 10, '2025-01-11 10:00:00', '2025-01-11 10:00:00'), ('b2c3d4e5-f6g7-8h9i-0j1k-2l3m4n5o6p7q', '978-0-22-222222-2', 'Livre 12', 'Auteur 12', '2022-02-02', 20.99, 'Fantastique', 'Editeur 12', 'image12.jpg', 12, '2025-01-12 11:00:00', '2025-01-12 11:00:00'), ('c3d4e5f6-g7h8-9i0j-1k2l-3m4n5o6p7q8r', '978-0-33-333333-3', 'Livre 13', 'Auteur 13', '2023-03-03', 25.99, 'Science', 'Editeur 13', 'image13.jpg', 14, '2025-01-13 12:00:00', '2025-01-13 12:00:00'), ('d4e5f6g7-h8i9-0j1k-2l3m-4n5o6p7q8r9s', '978-0-44-444444-4', 'Livre 14', 'Auteur 14', '2024-04-04', 30.99, 'Histoire', 'Editeur 14', 'image14.jpg', 16, '2025-01-14 13:00:00', '2025-01-14 13:00:00'), ('e5f6g7h8-i9j0-1k2l-3m4n-5o6p7q8r9s0t', '978-0-55-555555-5', 'Livre 15', 'Auteur 15', '2025-05-05', 35.99, 'Biographie', 'Editeur 15', 'image15.jpg', 18, '2025-01-15 14:00:00', '2025-01-15 14:00:00'), ('f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0t1u', '978-0-66-666666-6', 'Livre 16', 'Auteur 16', '2026-06-06', 40.99, 'Romance', 'Editeur 16', 'image16.jpg', 15, '2025-01-16 15:00:00', '2025-01-16 15:00:00'), ('g7h8i9j0-k1l2-3m4n-5o6p-7q8r9s0t1u2v', '978-0-77-777777-7', 'Livre 17', 'Auteur 17', '2027-07-07', 45.99, 'Thriller', 'Editeur 17', 'image17.jpg', 13, '2025-01-17 16:00:00', '2025-01-17 16:00:00'), ('h8i9j0k1-l2m3-4n5o-6p7q-8r9s0t1u2v3w', '978-0-88-888888-8', 'Livre 18', 'Auteur 18', '2028-08-08', 50.99, 'Mystère', 'Editeur 18', 'image18.jpg', 12, '2025-01-18 17:00:00', '2025-01-18 17:00:00'), ('i9j0k1l2-m3n4-5o6p-7q8r-9s0t1u2v3w4x', '978-0-99-999999-9', 'Livre 19', 'Auteur 19', '2029-09-09', 55.99, 'Science-fiction', 'Editeur 19', 'image19.jpg', 16, '2025-01-19 18:00:00', '2025-01-19 18:00:00'), ('j0k1l2m3-n4o5-6p7q-8r9s-0t1u2v3w4x5y', '978-1-00-000000-0', 'Livre 20', 'Auteur 20', '2030-10-10', 60.99, 'Fantasy', 'Editeur 20', 'image20.jpg', 14, '2025-01-20 19:00:00', '2025-01-20 19:00:00');

INSERT INTO AVIS (id_avis, id_utilisateur, id_livre, note, commentaire, date_creation, date_modification) 
VALUES ('1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', '1e2d3c4b-5a6f-7e8d-9c0b-1a2f3e4d5c6b', '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', 5, 'Excellent livre!', '2025-01-01 10:00:00', '2025-01-01 10:00:00'), ('2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q', '2e3d4c5b-6a7f-8e9d-0c1b-2a3f4e5d6c7b', '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q', 4, 'Très bon livre.', '2025-01-02 11:00:00', '2025-01-02 11:00:00'),
('3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', '3f4e5d6c-7b8a-9f0e-1d2c-3b4a5f6e7d8c', '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 3, 'Bon livre.', '2025-01-03 12:00:00', '2025-01-03 12:00:00'),
('4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', '4g5f6e7d-8c9b-0a1f-2e3d-4c5b6a7f8e9d', '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 2, 'Moyen.', '2025-01-04 13:00:00', '2025-01-04 13:00:00'),
('5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', '5h6g7f8e-9d0c-1b2a-3f4e-5d6c7b8a9f0e', '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 1, 'Décevant.', '2025-01-05 14:00:00', '2025-01-05 14:00:00'),
('6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', '6i7h8g9f-0e1d-2c3b-4a5f-6e7d8c9b0a1f', '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', 5, 'Un chef-d'œuvre!', '2025-01-06 15:00:00', '2025-01-06 15:00:00'),
('7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v', '7j8i9h0g-1f2e-3d4c-5b6a-7f8e9d0c1b2a', '7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v', 4, 'Très intéressant.', '2025-01-07 16:00:00', '2025-01-07 16:00:00'),
('8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w', '8k9j0i1h-2g3f-4e5d-6c7b-8a9f0e1d2c3b', '8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w', 3, 'Pas mal.', '2025-01-08 17:00:00', '2025-01-08 17:00:00'),
('9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x', '9l0k1j2i-3h4g-5f6e-7d8c-9b0a1f2e3d4c', '9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x', 2, 'Peut mieux faire.', '2025-01-09 18:00:00', '2025-01-09 18:00:00'),
('0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y', '0m1l2k3j-4i5h-6g7f-8e9d-0c1b2a3f4e5d', '0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y', 5, 'Incroyable!', '2025-01-10 19:00:00', '2025-01-10 19:00:00'),
('a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p', '1e2d3c4b-5a6f-7e8d-9c0b-1a2f3e4d5c6b', '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', 5, 'Excellent livre!', '2025-01-01 10:00:00', '2025-01-01 10:00:00'),
('b2c3d4e5-f6g7-8h9i-0j1k-2l3m4n5o6p7q', '2e3d4c5b-6a7f-8e9d-0c1b-2a3f4e5d6c7b', '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q', 4, 'Très bon livre.', '2025-01-02 11:00:00', '2025-01-02 11:00:00'),
('c3d4e5f6-g7h8-9i0j-1k2l-3m4n5o6p7q8r', '3f4e5d6c-7b8a-9f0e-1d2c-3b4a5f6e7d8c', '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', 3, 'Bon livre.', '2025-01-03 12:00:00', '2025-01-03 12:00:00'),
('d4e5f6g7-h8i9-0j1k-2l3m-4n5o6p7q8r9s', '4g5f6e7d-8c9b-0a1f-2e3d-4c5b6a7f8e9d', '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', 2, 'Moyen.', '2025-01-04 13:00:00', '2025-01-04 13:00:00'),
('e5f6g7h8-i9j0-1k2l-3m4n-5o6p7q8r9s0t', '5h6g7f8e-9d0c-1b2a-3f4e-5d6c7b8a9f0e', '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', 1, 'Décevant.', '2025-01-05 14:00:00', '2025-01-05 14:00:00'),
('f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0t1u', '6i7h8g9f-0e1d-2c3b-4a5f-6e7d8c9b0a1f', '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', 5, 'Un chef-d'œuvre!', '2025-01-06 15:00:00', '2025-01-06 15:00:00'),
('g7h8i9j0-k1l2-3m4n-5o6p-7q8r9s0t1u2v', '7j8i9h0g-1f2e-3d4c-5b6a-7f8e9d0c1b2a', '7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v', 4, 'Très intéressant.', '2025-01-07 16:00:00', '2025-01-07 16:00:00'),
('h8i9j0k1-l2m3-4n5o-6p7q-8r9s0t1u2v3w', '8k9j0i1h-2g3f-4e5d-6c7b-8a9f0e1d2c3b', '8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w', 3, 'Pas mal.', '2025-01-08 17:00:00', '2025-01-08 17:00:00'),
('i9j0k1l2-m3n4-5o6p-7q8r-9s0t1u2v3w4x', '9l0k1j2i-3h4g-5f6e-7d8c-9b0a1f2e3d4c', '9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x', 2, 'Peut mieux faire.', '2025-01-09 18:00:00', '2025-01-09 18:00:00'),
('j0k1l2m3-n4o5-6p7q-8r9s-0t1u2v3w4x5y', '0m1l2k3j-4i5h-6g7f-8e9d-0c1b2a3f4e5d', '0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y', 5, 'Incroyable!', '2025-01-10 19:00:00', '2025-01-10 19:00:00');

INSERT INTO book (id_book, ISBN, title, author, publication_date, price, gender, editor, image, ageLimit, description)
VALUES ('1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', '978-4687734008', '1984', 'George Orwell', '2001-01-01', 13.93, 'Dystopie', 'Folio', 'https://example.com/covers/29c45eb5-d779-44aa-bd5a-8ca6830bf869.jpg', 12, 'Livre intitulé ''1984'' par George Orwell, une œuvre dystopie.'),
('2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q', '978-7742533766', 'Le Petit Prince', 'Antoine de Saint-Exupéry', '2020-01-01', 18.08, 'Conte', 'Plon', 'https://example.com/covers/a48b742c-f272-48fb-bf42-f7a0dfaf2adb.jpg', 18, 'Livre intitulé ''Le Petit Prince'' par Antoine de Saint-Exupéry, une œuvre conte.'),
('3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', '978-7982777014', 'L''Étranger', 'Albert Camus', '1995-01-01', 10.66, 'Philosophie', 'Plon', 'https://example.com/covers/2d3b295b-2671-41be-8c12-d0d5aa6509bf.jpg', 10, 'Livre intitulé ''L''Étranger'' par Albert Camus, une œuvre philosophie.');
('4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', '978-7431260372', 'Harry Potter à l''école des sorciers', 'J.K. Rowling', '1978-01-01', 11.91, 'Fantasy', 'Le Livre de Poche', 'https://example.com/covers/c21c1c38-6c59-4d06-bb8d-2a612289e4df.jpg', 10, 'Livre intitulé ''Harry Potter à l''école des sorciers'' par J.K. Rowling, une œuvre fantasy.'),
('5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', '978-3737932923', 'Les Misérables', 'Victor Hugo', '2013-01-01', 12.08, 'Historique', 'Actes Sud', 'https://example.com/covers/af611ed1-00e4-4967-b4cd-5f1b7edadd5d.jpg', 18, 'Livre intitulé ''Les Misérables'' par Victor Hugo, une œuvre historique.'),
('6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', '978-7087234725', 'Da Vinci Code', 'Dan Brown', '1992-01-01', 22.69, 'Thriller', 'Folio', 'https://example.com/covers/9ad1b4b6-9309-430a-89e7-3ce1634db1de.jpg', 18, 'Livre intitulé ''Da Vinci Code'' par Dan Brown, une œuvre thriller.'),
('7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v', '978-1035162785', 'Le Seigneur des Anneaux', 'J.R.R. Tolkien', '1971-01-01', 24.58, 'Fantasy', 'Le Livre de Poche', 'https://example.com/covers/cf2600e5-efba-4c5a-b14b-336e8041cfb5.jpg', 18, 'Livre intitulé ''Le Seigneur des Anneaux'' par J.R.R. Tolkien, une œuvre fantasy.'),
('8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w', '978-4574576779', 'Orgueil et Préjugés', 'Jane Austen', '2017-01-01', 24.67, 'Romance', 'Plon', 'https://example.com/covers/259d367c-fc2b-407c-9f8e-594f2ec01c0a.jpg', 14, 'Livre intitulé ''Orgueil et Préjugés'' par Jane Austen, une œuvre romance.'),
('9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x', '978-7922079631', 'Le Hobbit', 'J.R.R. Tolkien', '1966-01-01', 20.34, 'Fantasy', 'Gallimard', 'https://example.com/covers/b8fd73b4-2cf1-4ed4-832c-835a74abf5d2.jpg', 16, 'Livre intitulé ''Le Hobbit'' par J.R.R. Tolkien, une œuvre fantasy.'),
('0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y', '978-7759329924', 'Fahrenheit 451', 'Ray Bradbury', '1997-01-01', 10.87, 'Science-fiction', 'Le Livre de Poche', 'https://example.com/covers/3956d117-0b16-4558-802b-c43c503f6c3e.jpg', 12, 'Livre intitulé ''Fahrenheit 451'' par Ray Bradbury, une œuvre science-fiction.'),
('a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p', '978-6410541260', 'To Kill a Mockingbird', 'Harper Lee', '1978-01-01', 5.8, 'Historique', 'Actes Sud', 'https://example.com/covers/2d25be65-2b2f-4a29-b4ee-63cfbf9ab3ce.jpg', 16, 'Livre intitulé ''To Kill a Mockingbird'' par Harper Lee, une œuvre historique.'),
('b2c3d4e5-f6g7-8h9i-0j1k-2l3m4n5o6p7q', '978-8595577540', 'Les Fleurs du mal', 'Charles Baudelaire', '2015-01-01', 13.08, 'Poésie', 'Actes Sud', 'https://example.com/covers/a0ebd891-8ff0-4297-8f12-c229d2d14e8e.jpg', 10, 'Livre intitulé ''Les Fleurs du mal'' par Charles Baudelaire, une œuvre poésie.'),
('c3d4e5f6-g7h8-9i0j-1k2l-3m4n5o6p7q8r', '978-7931528762', 'Le Comte de Monte-Cristo', 'Alexandre Dumas', '1967-01-01', 6.56, 'Aventure', 'Folio', 'https://example.com/covers/7fe03268-b37c-4c3f-8ae4-bfa8d934eb26.jpg', 16, 'Livre intitulé ''Le Comte de Monte-Cristo'' par Alexandre Dumas, une œuvre aventure.'),
('d4e5f6g7-h8i9-0j1k-2l3m-4n5o6p7q8r9s', '978-6336788896', 'Bel-Ami', 'Guy de Maupassant', '2005-01-01', 17.61, 'Classique', 'Plon', 'https://example.com/covers/d4324084-0d50-465b-982e-43f457e224d4.jpg', 18, 'Livre intitulé ''Bel-Ami'' par Guy de Maupassant, une œuvre classique.'),
('e5f6g7h8-i9j0-1k2l-3m4n-5o6p7q8r9s0t', '978-5083631802', 'L’Alchimiste', 'Paulo Coelho', '1970-01-01', 9.96, 'Spiritualité', 'Gallimard', 'https://example.com/covers/631b0f9c-bd17-49b5-a257-f276348ccf33.jpg', 16, 'Livre intitulé ''L’Alchimiste'' par Paulo Coelho, une œuvre spiritualité.'),
('f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0t1u', '978-6336245740', 'La Peste', 'Albert Camus', '1992-01-01', 5.01, 'Philosophie', 'Folio', 'https://example.com/covers/c7fe7ab5-857f-4ef1-a69b-e7fda688775b.jpg', 10, 'Livre intitulé ''La Peste'' par Albert Camus, une œuvre philosophie.'),
('g7h8i9j0-k1l2-3m4n-5o6p-7q8r9s0t1u2v', '978-6340967780', 'Le Nom de la Rose', 'Umberto Eco', '1965-01-01', 13.9, 'Policier', 'Plon', 'https://example.com/covers/1e5ed83e-2e13-4cd6-8dbf-79f0e61b86b2.jpg', 14, 'Livre intitulé ''Le Nom de la Rose'' par Umberto Eco, une œuvre policier.'),
('h8i9j0k1-l2m3-4n5o-6p7q-8r9s0t1u2v3w', '978-5393251169', 'Germinal', 'Émile Zola', '2016-01-01', 16.27, 'Historique', 'Gallimard', 'https://example.com/covers/e45733cd-6c4f-4a7c-9a40-5978f9c75c1e.jpg', 12, 'Livre intitulé ''Germinal'' par Émile Zola, une œuvre historique.'),
('i9j0k1l2-m3n4-5o6p-7q8r-9s0t1u2v3w4x', '978-9424064505', 'L’Attrape-cœurs', 'J.D. Salinger', '1987-01-01', 12.73, 'Roman initiatique', 'Gallimard', 'https://example.com/covers/1f3bbcf5-92ee-48d3-a3d7-70bc5e34633c.jpg', 18, 'Livre intitulé ''L’Attrape-cœurs'' par J.D. Salinger, une œuvre roman initiatique.'),
('j0k1l2m3-n4o5-6p7q-8r9s-0t1u2v3w4x5y', '978-3681520272', 'Le Parfum', 'Patrick Süskind', '2015-01-01', 18.32, 'Drame', 'Actes Sud', 'https://example.com/covers/93757b49-63c5-4722-a803-d44b31ab7936.jpg', 18, 'Livre intitulé ''Le Parfum'' par Patrick Süskind, une œuvre drame.');

-- Données pour la table UTILISATEUR_LIVRE INSERT INTO UTILISATEUR_LIVRE (id, id_utilisateur, id_livre, date_creation, date_modification) 
VALUES ('1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', '1e2d3c4b-5a6f-7e8d-9c0b-1a2f3e4d5c6b', '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', '2025-01-01 10:00:00', '2025-01-01 10:00:00'),
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
('f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0t1u', '6i7h8g9f-0e1d-2c3b-4a5f-6e7d8c9b0a1f', '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', '2025-01-06 15:00:00', '2025-01-06 15:00:00'),
('7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v', '7j8i9h0g-1f2e-3d4c-5b6a-7f8e9d0c1b2a', '7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2v', '2025-01-07 16:00:00', '2025-01-07 16:00:00'),
('8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w', '8k9j0i1h-2g3f-4e5d-6c7b-8a9f0e1d2c3b', '8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3w', '2025-01-08 17:00:00', '2025-01-08 17:00:00'),
('9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x', '9l0k1j2i-3h4g-5f6e-7d8c-9b0a1f2e3d4c', '9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4x', '2025-01-09 18:00:00', '2025-01-09 18:00:00'),
('0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y', '0m1l2k3j-4i5h-6g7f-8e9d-0c1b2a3f4e5d', '0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5y', '2025-01-10 19:00:00', '2025-01-10 19:00:00'),
('a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p', '1e2d3c4b-5a6f-7e8d-9c0b-1a2f3e4d5c6b', '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p', '2025-01-11 10:00:00', '2025-01-11 10:00:00'),
('b2c3d4e5-f6g7-8h9i-0j1k-2l3m4n5o6p7q', '2e3d4c5b-6a7f-8e9d-0c1b-2a3f4e5d6c7b', '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q', '2025-01-12 11:00:00', '2025-01-12 11:00:00'),
('c3d4e5f6-g7h8-9i0j-1k2l-3m4n5o6p7q8r', '3f4e5d6c-7b8a-9f0e-1d2c-3b4a5f6e7d8c', '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r', '2025-01-13 12:00:00', '2025-01-13 12:00:00'),
('d4e5f6g7-h8i9-0j1k-2l3m-4n5o6p7q8r9s', '4g5f6e7d-8c9b-0a1f-2e3d-4c5b6a7f8e9d', '4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9s', '2025-01-14 13:00:00', '2025-01-14 13:00:00'),
('e5f6g7h8-i9j0-1k2l-3m4n-5o6p7q8r9s0t', '5h6g7f8e-9d0c-1b2a-3f4e-5d6c7b8a9f0e', '5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0t', '2025-01-15 14:00:00', '2025-01-15 14:00:00'),
('f6g7h8i9-j0k1-2l3m-4n5o-6p7q8r9s0t1u', '6i7h8g9f-0e1d-2c3b-4a5f-6e7d8c9b0a1f', '6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1u', '2025-01-16 15:00:00', '2025-01-16 15:00:00');










// Middleware pour vérifier le token JWT    

export function authenticateToken(req, res, next) {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
}