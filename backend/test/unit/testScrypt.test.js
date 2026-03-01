// scrypt.test.js
// Suite de tests pour le module scrypt (hash et verify)

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { hash, verify } from '../../utils/scrypt.js';

// ========================================
// TESTS UNITAIRES - Fonction hash()
// ========================================

describe('hash() - Tests unitaires', () => {
  it('devrait générer un hash valide pour un mot de passe simple', async () => {
    const password = 'Pa$$w0rd!';
    const hashed = await hash(password);
    
    // Vérifier le format du hash (salt:key)
    assert.ok(hashed.includes(':'), 'Le hash devrait contenir un séparateur :');
    
    const [salt, key] = hashed.split(':');
    assert.equal(salt.length, 32, 'Le salt devrait faire 32 caractères hex (16 bytes)');
    assert.equal(key.length, 128, 'La clé devrait faire 128 caractères hex (64 bytes)');
    //console.log('Generated hash:', hashed);
  });

  it('devrait générer des hashs différents pour le même mot de passe', async () => {
    const password = 'Pa$$w0rd!';
    const hash1 = await hash(password);
    const hash2 = await hash(password);
    
    assert.notEqual(hash1, hash2, 'Deux hashs du même mot de passe doivent être différents (sel aléatoire)');
  });

  it('devrait rejeter un mot de passe vide', async () => {
    await assert.rejects(
      async () => await hash(''),
      { message: 'Password cannot be empty' },
      'Devrait rejeter un mot de passe vide'
    );
  });

  it('devrait rejeter un mot de passe null', async () => {
    await assert.rejects(
      async () => await hash(null),
      { message: 'Password cannot be empty' },
      'Devrait rejeter un mot de passe null'
    );
  });

  it('devrait rejeter un mot de passe undefined', async () => {
    await assert.rejects(
      async () => await hash(undefined),
      { message: 'Password cannot be empty' },
      'Devrait rejeter un mot de passe undefined'
    );
  });

  it('devrait gérer des mots de passe très longs', async () => {
    const longPassword = 'a'.repeat(10000);
    const hashed = await hash(longPassword);
    
    assert.ok(hashed.includes(':'), 'Devrait générer un hash valide pour un mot de passe très long');
  });

  it('devrait gérer des mots de passe avec caractères spéciaux', async () => {
    const specialPassword = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~';
    const hashed = await hash(specialPassword);
    
    assert.ok(hashed.includes(':'), 'Devrait gérer les caractères spéciaux');
  });

  it('devrait gérer des mots de passe avec emojis', async () => {
    const emojiPassword = '🔒🔑💻🚀';
    const hashed = await hash(emojiPassword);
    
    assert.ok(hashed.includes(':'), 'Devrait gérer les emojis');
  });

  it('devrait gérer des mots de passe avec caractères unicode', async () => {
    const unicodePassword = '你好世界مرحبا';
    const hashed = await hash(unicodePassword);
    
    assert.ok(hashed.includes(':'), 'Devrait gérer les caractères unicode');
  });
});

// ========================================
// TESTS UNITAIRES - Fonction verify()
// ========================================

describe('verify() - Tests unitaires', () => {
  it('devrait retourner true pour un mot de passe correct', async () => {
    const password = 'Pa$$w0rd!';
    // const hashed = await hash(password);
    const hashed = "0f36723c4f972347d97547309a2700b6:77bf148c68190b991da1fa21602a1d202a9734436faf68574806755b1c9ec19809d9503c1256a8820020ee7467d0384c3793df0940d7b791b9f3ee1265d94411";
    const isValid = await verify(password, hashed);
    
    assert.equal(isValid, true, 'Le mot de passe correct devrait être validé');
  });

  it('devrait retourner false pour un mot de passe incorrect', async () => {
    const password = 'correctPassword';
    const wrongPassword = 'wrongPassword';
    const hashed = await hash(password);
    const isValid = await verify(wrongPassword, hashed);
    
    assert.equal(isValid, false, 'Un mot de passe incorrect devrait être rejeté');
  });

  it('devrait retourner false pour un hash modifié', async () => {
    const password = 'testPassword';
    const hashed = await hash(password);
    const tamperedHash = hashed.slice(0, -1) + 'x'; // Modifier le dernier caractère
    const isValid = await verify(password, tamperedHash);
    
    assert.equal(isValid, false, 'Un hash modifié devrait être rejeté');
  });

  it('devrait rejeter un mot de passe vide', async () => {
    const hashed = await hash('validPassword');
    
    await assert.rejects(
      async () => await verify('', hashed),
      { message: 'Password and hash cannot be empty' },
      'Devrait rejeter un mot de passe vide'
    );
  });

  it('devrait rejeter un hash vide', async () => {
    await assert.rejects(
      async () => await verify('password', ''),
      { message: 'Password and hash cannot be empty' },
      'Devrait rejeter un hash vide'
    );
  });

  it('devrait rejeter un hash au format invalide (sans séparateur)', async () => {
    await assert.rejects(
      async () => await verify('password', 'invalidhashwithoutcolon'),
      { message: /Invalid hash format|Error while verifying password/ },
      'Devrait rejeter un hash sans séparateur :'
    );
  });

  it('devrait rejeter un hash avec seulement un salt', async () => {
    await assert.rejects(
      async () => await verify('password', 'onlysalt:'),
      { message: /Invalid hash format|Error while verifying password/ },
      'Devrait rejeter un hash incomplet'
    );
  });

  it('devrait rejeter un hash avec seulement une clé', async () => {
    await assert.rejects(
      async () => await verify('password', ':onlykey'),
      { message: /Invalid hash format|Error while verifying password/ },
      'Devrait rejeter un hash incomplet'
    );
  });

  it('devrait être sensible à la casse', async () => {
    const password = 'Password123';
    const hashed = await hash(password);
    const isValid = await verify('password123', hashed);
    
    assert.equal(isValid, false, 'Devrait être sensible à la casse');
  });

  it('devrait distinguer des mots de passe similaires', async () => {
    const password1 = 'password '; // Avec espace
    const password2 = 'password';  // Sans espace
    const hashed1 = await hash(password1);
    const isValid = await verify(password2, hashed1);
    
    assert.equal(isValid, false, 'Devrait distinguer des mots de passe très similaires');
  });
});

// ========================================
// TESTS D'INTÉGRATION
// ========================================

describe('hash() et verify() - Tests d\'intégration', () => {
  it('devrait fonctionner ensemble pour un workflow complet', async () => {
    // Simuler l'inscription d'un utilisateur
    const userPassword = 'UserPassword123!';
    const hashedPassword = await hash(userPassword);
    
    // Stocker hashedPassword en base de données...
    
    // Simuler la connexion de l'utilisateur
    const loginPassword = 'UserPassword123!';
    const isAuthenticated = await verify(loginPassword, hashedPassword);
    
    assert.equal(isAuthenticated, true, 'Le workflow complet devrait fonctionner');
  });

  it('devrait rejeter une tentative de connexion avec mauvais mot de passe', async () => {
    // Inscription
    const userPassword = 'CorrectPassword123!';
    const hashedPassword = await hash(userPassword);
    
    // Tentative de connexion avec mauvais mot de passe
    const wrongPassword = 'WrongPassword123!';
    const isAuthenticated = await verify(wrongPassword, hashedPassword);
    
    assert.equal(isAuthenticated, false, 'Devrait rejeter un mauvais mot de passe');
  });

  it('devrait gérer plusieurs utilisateurs avec le même mot de passe', async () => {
    const commonPassword = 'CommonPassword123';
    
    const hash1 = await hash(commonPassword);
    const hash2 = await hash(commonPassword);
    const hash3 = await hash(commonPassword);
    
    // Les hashs doivent être différents
    assert.notEqual(hash1, hash2);
    assert.notEqual(hash2, hash3);
    assert.notEqual(hash1, hash3);
    
    // Mais tous doivent valider le même mot de passe
    assert.equal(await verify(commonPassword, hash1), true);
    assert.equal(await verify(commonPassword, hash2), true);
    assert.equal(await verify(commonPassword, hash3), true);
  });

  it('devrait maintenir la sécurité même avec des hashs similaires', async () => {
    const password1 = 'password';
    const password2 = 'password1';
    
    const hash1 = await hash(password1);
    const hash2 = await hash(password2);
    
    // Vérification croisée (ne devrait pas valider)
    assert.equal(await verify(password1, hash2), false);
    assert.equal(await verify(password2, hash1), false);
    
    // Vérification correcte
    assert.equal(await verify(password1, hash1), true);
    assert.equal(await verify(password2, hash2), true);
  });
});

// ========================================
// TESTS FONCTIONNELS - Scénarios réels
// ========================================

describe('Scénarios fonctionnels réels', () => {
  let userDatabase;

  beforeEach(() => {
    // Simuler une base de données d'utilisateurs
    userDatabase = new Map();
  });

  afterEach(() => {
    userDatabase.clear();
  });

  it('Scénario: Inscription et connexion d\'un utilisateur', async () => {
    // ÉTAPE 1: L'utilisateur s'inscrit
    const email = 'user@example.com';
    const password = 'SecurePassword123!';
    
    const hashedPassword = await hash(password);
    userDatabase.set(email, { email, password: hashedPassword });
    
    assert.ok(userDatabase.has(email), 'L\'utilisateur devrait être enregistré');
    
    // ÉTAPE 2: L'utilisateur se connecte avec le bon mot de passe
    const loginAttempt = await verify(password, userDatabase.get(email).password);
    assert.equal(loginAttempt, true, 'La connexion devrait réussir');
    
    // ÉTAPE 3: Tentative avec mauvais mot de passe
    const failedLoginAttempt = await verify('WrongPassword', userDatabase.get(email).password);
    assert.equal(failedLoginAttempt, false, 'La connexion devrait échouer');
  });

  it('Scénario: Changement de mot de passe', async () => {
    const email = 'user@example.com';
    const oldPassword = 'OldPassword123';
    const newPassword = 'NewSecurePassword456!';
    
    // Inscription avec ancien mot de passe
    const hashedOldPassword = await hash(oldPassword);
    userDatabase.set(email, { email, password: hashedOldPassword });
    
    // Changement de mot de passe
    const isOldPasswordCorrect = await verify(oldPassword, userDatabase.get(email).password);
    assert.equal(isOldPasswordCorrect, true, 'L\'ancien mot de passe devrait être valide');
    
    // Mise à jour avec nouveau mot de passe
    const hashedNewPassword = await hash(newPassword);
    userDatabase.set(email, { email, password: hashedNewPassword });
    
    // Vérification: ancien mot de passe ne fonctionne plus
    const oldPasswordStillWorks = await verify(oldPassword, userDatabase.get(email).password);
    assert.equal(oldPasswordStillWorks, false, 'L\'ancien mot de passe ne devrait plus fonctionner');
    
    // Vérification: nouveau mot de passe fonctionne
    const newPasswordWorks = await verify(newPassword, userDatabase.get(email).password);
    assert.equal(newPasswordWorks, true, 'Le nouveau mot de passe devrait fonctionner');
  });

  it('Scénario: Multiples tentatives de connexion échouées', async () => {
    const email = 'user@example.com';
    const correctPassword = 'CorrectPassword123';
    
    const hashedPassword = await hash(correctPassword);
    userDatabase.set(email, { email, password: hashedPassword, loginAttempts: 0 });
    
    // Simuler 3 tentatives échouées
    const attempts = ['wrong1', 'wrong2', 'wrong3'];
    
    for (const wrongPassword of attempts) {
      const isValid = await verify(wrongPassword, userDatabase.get(email).password);
      assert.equal(isValid, false, `Tentative avec "${wrongPassword}" devrait échouer`);
      
      const user = userDatabase.get(email);
      user.loginAttempts++;
      userDatabase.set(email, user);
    }
    
    assert.equal(userDatabase.get(email).loginAttempts, 3, 'Devrait compter 3 tentatives échouées');
    
    // Tentative réussie
    const isValid = await verify(correctPassword, userDatabase.get(email).password);
    assert.equal(isValid, true, 'Le bon mot de passe devrait toujours fonctionner');
  });

  it('Scénario: Inscription de plusieurs utilisateurs', async () => {
    const users = [
      { email: 'user1@example.com', password: 'Password1!' },
      { email: 'user2@example.com', password: 'Password2!' },
      { email: 'user3@example.com', password: 'Password3!' },
    ];
    
    // Inscription de tous les utilisateurs
    for (const user of users) {
      const hashedPassword = await hash(user.password);
      userDatabase.set(user.email, { 
        email: user.email, 
        password: hashedPassword 
      });
    }
    
    assert.equal(userDatabase.size, 3, 'Devrait avoir 3 utilisateurs enregistrés');
    
    // Vérifier que chaque utilisateur peut se connecter
    for (const user of users) {
      const isValid = await verify(
        user.password, 
        userDatabase.get(user.email).password
      );
      assert.equal(isValid, true, `${user.email} devrait pouvoir se connecter`);
    }
    
    // Vérifier qu'un utilisateur ne peut pas utiliser le mot de passe d'un autre
    const crossLoginAttempt = await verify(
      users[0].password,
      userDatabase.get(users[1].email).password
    );
    assert.equal(crossLoginAttempt, false, 'Ne devrait pas pouvoir utiliser le mot de passe d\'un autre');
  });
});

// ========================================
// TESTS DE PERFORMANCE (optionnels)
// ========================================

describe('Tests de performance', () => {
  it('devrait hasher 100 mots de passe en moins de 10 secondes', async () => {
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < 100; i++) {
      promises.push(hash(`password${i}`));
    }
    
    await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    assert.ok(duration < 10000, `Devrait prendre moins de 10s (pris ${duration}ms)`);
  });

  it('devrait vérifier 100 mots de passe en moins de 10 secondes', async () => {
    // Préparer les hashs
    const hashes = await Promise.all(
      Array.from({ length: 100 }, (_, i) => hash(`password${i}`))
    );
    
    const startTime = Date.now();
    const promises = hashes.map((h, i) => verify(`password${i}`, h));
    await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    assert.ok(duration < 10000, `Devrait prendre moins de 10s (pris ${duration}ms)`);
  });
});

// ========================================
// TESTS DE SÉCURITÉ
// ========================================

describe('Tests de sécurité', () => {
  it('devrait résister aux attaques timing', async () => {
    const password = 'securePassword123';
    const hashed = await hash(password);
    
    // Mesurer le temps pour un mot de passe correct
    const start1 = process.hrtime.bigint();
    await verify(password, hashed);
    const end1 = process.hrtime.bigint();
    const time1 = Number(end1 - start1);
    
    // Mesurer le temps pour un mot de passe incorrect
    const start2 = process.hrtime.bigint();
    await verify('wrongPassword', hashed);
    const end2 = process.hrtime.bigint();
    const time2 = Number(end2 - start2);
    
    // La différence devrait être minime (moins de 50% de différence)
    const diff = Math.abs(time1 - time2);
    const maxTime = Math.max(time1, time2);
    const percentDiff = (diff / maxTime) * 100;
    
    assert.ok(percentDiff < 50, 'Le temps devrait être similaire pour éviter les attaques timing');
  });

  it('ne devrait jamais retourner le sel en clair', async () => {
    const password = 'testPassword';
    const hashed = await hash(password);
    
    // Le hash devrait être une chaîne, pas un objet exposant le sel
    assert.equal(typeof hashed, 'string', 'Le hash devrait être une chaîne');
    
    // On ne devrait pas pouvoir extraire le sel facilement sans le connaître
    const [salt, key] = hashed.split(':');
    assert.notEqual(salt, password, 'Le sel ne devrait pas être le mot de passe');
    assert.notEqual(key, password, 'La clé ne devrait pas être le mot de passe');
  });
});