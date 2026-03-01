/**
 * Resolvers pour les nouvelles fonctionnalités d'authentification
 * À ajouter dans votre fichier resolvers backend
 */

import db from "../db/connect_DB.js";
import { GraphQLError } from 'graphql';



import { generateAccessToken, generateRefreshToken } from './utils/utils_authentification.js';
import { hash, verify } from '../utils/scrypt.js';
import crypto from 'crypto';

// Récupérer l'id_user depuis le token d'authentification (middleware)


export default {
  Query : {
  },
  Mutation: {
    /**
     * Débloquer son propre compte (status 3 -> 1)
     */
    unblockAccount: async (_, { id_user }, { pool }) => {
      try {
        // Vérifier le statut actuel
        const userResult = await pool.query(
          'SELECT status FROM users WHERE id_user = $1',
          [id_user]
        );

        if (userResult.rows.length === 0) {
          throw new Error('Utilisateur introuvable');
        }

        const currentStatus = userResult.rows[0].status;

        // Seul le status 3 (auto-bloqué) peut être débloqué par l'utilisateur
        if (currentStatus !== 3) {
          throw new Error('Vous ne pouvez pas débloquer ce compte vous-même');
        }

        // Mettre à jour le status à 1 (actif)
        await pool.query(
          'UPDATE users SET status = 1, updated_at = NOW() WHERE id_user = $1',
          [id_user]
        );

        return true;
      } catch (error) {
        console.error('Erreur unblockAccount:', error);
        throw error;
      }
    },

    /**
     * Demander le déblocage à un admin
     * Crée un message automatique envoyé à tous les admins
     */
    requestAdminUnblock: async (_, { id_user }, { pool }) => {
      try {
        // Récupérer les informations de l'utilisateur
        const userResult = await pool.query(
          `SELECT u.pseudo, u.email, u.status, s.status_name 
           FROM users u 
           LEFT JOIN status s ON u.status = s.id_status 
           WHERE u.id_user = $1`,
          [id_user]
        );

        if (userResult.rows.length === 0) {
          throw new Error('Utilisateur introuvable');
        }

        const user = userResult.rows[0];

        // Vérifier que le compte est bien bloqué par admin (status 2 ou 4)
        if (![2, 4].includes(user.status)) {
          throw new Error('Cette demande n\'est disponible que pour les comptes bloqués par un administrateur');
        }

        // Récupérer tous les admins (role 3)
        const adminsResult = await pool.query(
          'SELECT id_user FROM users WHERE id_role = 3 AND status = 1'
        );

        if (adminsResult.rows.length === 0) {
          throw new Error('Aucun administrateur disponible');
        }

        // Message pré-construit
        const subject = '🔓 Demande de déblocage de compte';
        const content = `Bonjour,

        Je vous contacte car mon compte (${user.pseudo} - ${user.email}) a été bloqué par un administrateur.

        Statut actuel : ${user.status_name}

        Je souhaiterais comprendre la raison de ce blocage et demander le déblocage de mon compte si possible.

        Merci de votre attention.

        Cordialement,
        ${user.pseudo}

        ---
        Ce message a été envoyé automatiquement via le système de déblocage de compte.
        ID utilisateur : ${id_user}`;

        // Envoyer un message à chaque admin
        for (const admin of adminsResult.rows) {
          await pool.query(
            `INSERT INTO messages (id_sender, id_receiver, subject, content, is_read, created_at, updated_at)
             VALUES ($1, $2, $3, $4, false, NOW(), NOW())`,
            [id_user, admin.id_user, subject, content]
          );
        }

        return true;
      } catch (error) {
        console.error('Erreur requestAdminUnblock:', error);
        throw error;
      }
    },

    /**
     * Demander la réinitialisation du mot de passe
     * Génère un code de réinitialisation et le stocke en BDD
     */
  }
  
};