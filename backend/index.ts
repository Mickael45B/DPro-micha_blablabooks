import debug from "debug";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { InMemoryLRUCache } from "@apollo/utils.keyvaluecache";

// Initialisation du logger
const logger = debug("app:main");

// Port par défaut ou celui défini dans les variables d'environnement
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

// Exemple de schéma GraphQL (à personnaliser plus tard)
const typeDefs = `
  type Query {
    hello: String
  }
`;

// Exemple de résolveurs (à personnaliser plus tard)
const resolvers = {
  Query: {
    hello: () => "Bonjour, monde !",
  },
};

// Création du serveur Apollo
const server = new ApolloServer({
  typeDefs,
  resolvers,
  cache: new InMemoryLRUCache(), // Cache en mémoire pour de meilleures performances
});

// Démarrage du serveur
startStandaloneServer(server, {
  listen: { port: PORT },
}).then(({ url }) => {
  logger(`🚀 Server ready at ${url}`);
}).catch((error) => {
  logger(`❌ Failed to start server: ${error.message}`);
});