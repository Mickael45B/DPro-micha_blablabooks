import { ApolloServer } from "@apollo/server";
import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeTypeDefs } from "@graphql-tools/merge";
import path from "path";
// import { Pool } from "pg";
import dotenv from "dotenv";
import cors from "cors";
import express from "express"; // Ajout d'Express pour gérer `app`
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { expressMiddleware } from '@apollo/server/express4';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);



const app = express(); // Initialisation de l'application Express
// Body parsers - register before Apollo middleware so req.body is available
app.use(express.json()); // Pour parser le JSON dans les requêtes
app.use(express.urlencoded({ extended: true })); // Pour parser les données URL-encoded


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

// démarre Apollo (obligatoire avant d'utiliser expressMiddleware)
await server.start();

// configure express to use Apollo server on /graphql
app.use(
  '/graphql',
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
  expressMiddleware(server, {
    context: async ({ req }) => ({ req }),
  })
);

// servir la doc statique (générée par ton script) sous /docs
app.use('/docs', express.static(path.join(__dirname, 'docs')));

// démarrer le serveur Express
const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
  console.log(`📚 Docs available at http://localhost:${port}/docs`);
});