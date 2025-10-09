import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeTypeDefs } from "@graphql-tools/merge";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
// Note: older/newer versions of @apollo/server don't always export a renderLandingPage helper.
// Instead serve a small GraphiQL HTML page directly for browser GET requests.

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les fichiers GraphQL
const typesArray = loadFilesSync(path.join(__dirname, "schema"), {
  extensions: ["gql", "graphql"],
  recursive: true,
});

const typeDefs = mergeTypeDefs(typesArray);

import resolvers from "./resolvers/index.js";

const app = express();

// 🚀 Créer et démarrer Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true, // Permet Apollo Studio
});

await server.start();

// ⚙️ Middlewares globaux
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:4000"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Apollo Landing Page for browser GET requests to /graphql
app.get("/graphql", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>GraphiQL</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://cdn.jsdelivr.net/npm/graphiql@2.0.1/graphiql.min.css" rel="stylesheet" />
    </head>
    <body style="height:100vh;margin:0;">
      <div id="graphiql" style="height:100vh;"></div>
  <script crossorigin src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
  <script crossorigin src="https://cdn.jsdelivr.net/npm/graphiql@2.0.1/graphiql.min.js"></script>
      <script>
        const fetcher = GraphiQL.createFetcher({ url: '/graphql' });
  const defaultQuery = '# Test query\\nquery { __typename }';
        ReactDOM.render(
          React.createElement(GraphiQL, { fetcher, defaultQuery }),
          document.getElementById('graphiql'),
        );
      </script>
    </body>
  </html>`);
});

// 🔗 Route GraphQL (API - use POST with application/json)
app.use(
  "/graphql",
  expressMiddleware(server, {
    context: async ({ req }) => ({
      token: req.headers.authorization || null,
    }),
  })
);

// Route de santé
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
  console.log(`📊 Health check at http://localhost:${port}/health`);
});