import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeTypeDefs } from "@graphql-tools/merge";
import path from "path";
// import { Pool } from "pg";
import dotenv from "dotenv";
import cors from "cors";
import express from "express"; // Ajout d'Express pour gérer `app`
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express(); // Initialisation de l'application Express

// Configuration de CORS
app.use(
  cors({
    origin: ["http://localhost:5173"], // Autorisez l'origine du frontend
    methods: ["GET", "POST", "PATCH", "DELETE"], // Méthodes HTTP autorisées
    allowedHeaders: ["Content-Type", "Authorization"], // En-têtes autorisés
    credentials: true, // Autorisez les cookies ou les sessions
  })
);


// Charger tous les fichiers .gql récursivement
// const __dirname = path.dirname(new URL(import.meta.url).pathname); // Pour obtenir le répertoire courant
const typesArray = loadFilesSync(path.join(__dirname, "schema"), {
  extensions: ["gql", "graphql"],
  recursive: true,
});

// Fusionner tous les types
const typeDefs = mergeTypeDefs(typesArray);

// Importer les resolvers
import resolvers from "./resolvers/index.js"; // Assurez-vous que `index.js` existe dans le dossier `resolvers`

// Créer le serveur Apollo
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Démarrer le serveur Apollo
const port = process.env.PORT || 4000;
startStandaloneServer(server, {
  listen: { port },
}).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});