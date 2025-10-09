import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import debug from "debug";
import { InMemoryLRUCache } from "@apollo/utils.keyvaluecache";

import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeTypeDefs } from "@graphql-tools/merge";
import path from "path";
// import { Pool } from "pg";
import dotenv from "dotenv";
import cors from "cors";
import express from "express"; // Ajout d'Express pour gérer `app`
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// Importer les resolvers
import resolvers from "./resolvers/index.js"; // Assurez-vous que `index.js` existe dans le dossier `resolvers`

const logger = debug("app:main");
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;


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


// Créer le serveur Apollo
const server = new ApolloServer({
  typeDefs,
  resolvers,
    status400ForVariableCoercionErrors: true,
  cache: new InMemoryLRUCache({
    maxSize: 2 ** 20 + 100,

}),
});

// TypeScript-friendly context for resolvers
interface ContextValue {
  // use `any` here because Apollo's standalone server provides Node incoming messages
  // while other parts of the app may pass Express Request/Response. Relaxing to `any`
  // keeps the context compatible in both environments.
  req?: any;
  res?: any;
  cache: InMemoryLRUCache;
  dataSources: Record<string, unknown>;
  token?: string | null;
  user?: any; // replace `any` with a proper User type when available
}

async function createContext({ req, res }: { req?: any; res?: any; }): Promise<ContextValue> {
  // Reuse the server cache if available
  const cache = (server as any).cache as InMemoryLRUCache | undefined;

  // Extract Authorization Bearer token if present
  const authHeader = req?.headers?.authorization || req?.get?.("authorization") || null;
  let token: string | null = null;
  if (typeof authHeader === "string") {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
      token = parts[1];
    }
  }

  // TODO: optionally resolve user from token here (e.g., verify JWT)

  return {
    req,
    res,
    cache: cache ?? new InMemoryLRUCache(),
    dataSources: {},
    token,
    user: null,
  };
}


// Démarrer le serveur Apollo
const port = process.env.PORT || 4000;
startStandaloneServer(server, {
  listen: { port: PORT },
  // provide a context function so resolvers receive the typed ContextValue
  context: async ({ req, res }) => createContext({ req, res }),
}).then(({ url }) => {
  logger(`🚀 Server ready at ${url}`);
});




