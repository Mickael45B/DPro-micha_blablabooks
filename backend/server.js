import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeTypeDefs } from "@graphql-tools/merge";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import jwt from 'jsonwebtoken';
import db from './db/connect_DB.js';
import { generalLimiter, authLimiter, mutationLimiter, registrationLimiter } from './config/rateLimiter.js';

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

// ⚙️ CORS OPTIONS (À RAJOUTER ICI)
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

// Monter le router REST (si besoin)
// import {router} from "./router/router.js";
// app.use("/api", router);

app.use(
  "/graphql",
  expressMiddleware(server, {
    context: async ({ req, res }) => {
      // Extraire le header Authorization
      const authHeader = req.headers.authorization || '';
      
      // Format attendu : "Bearer eyJhbGc..."
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) // Enlever "Bearer "
        : authHeader;
      
      // Si pas de token, retourner un context non authentifié
      if (!token) {
        return {
          req,
          res,
          isAuthenticated: false,
          user: null,
          isAdmin: false,
          token: null,
        };
      }
      
      try {
        // Vérifier et décoder le JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Debug (à retirer en production)
        //console.log('✅ JWT valide pour:', decoded.email || decoded.pseudo || decoded.id_user || decoded.id);

        // Récupérer l'id_user présent dans le token (si disponible)
        const tokenUserId = decoded.id_user || decoded.id || null;

        // Enrichir le contexte avec les informations stockées en base
        let dbUser = null;
        if (tokenUserId) {
          try {
             
const userRes = await db.query(
  `SELECT u.id_user, u.email, u.pseudo, u.name, u.id_status, u.id_role,
          r.role_name AS role_name, s.status_name AS status_name
   FROM users u
   LEFT JOIN roles r ON u.id_role = r.id_role
   LEFT JOIN status s ON u.id_status = s.id_status
   WHERE u.id_user = $1`,
  [tokenUserId]
);
             
            if (userRes.rows && userRes.rows.length > 0) dbUser = userRes.rows[0];
            } catch (dbErr) {
            console.error('❌ DB lookup failed for user metadata:', dbErr?.message || dbErr);
          }
        }

        // Retourner le context avec les infos utilisateur enrichies
if (!dbUser) {
  console.error('❌ User not found in database, rejecting token');
  return {
    req,
    res,
    isAuthenticated: false,
    user: null,
    isAdmin: false,
    token: null,
    error: 'User not found in database'
  };
}

        const resolvedRole = dbUser?.role_name || decoded.role || null;
        const resolvedStatus = dbUser?.status_name || null;






return {
  req,
  res,
  isAuthenticated: true,
  user: {
    id_user: dbUser.id_user,
    name: dbUser.name,        // ✅ DEPUIS BDD
    pseudo: dbUser.pseudo,    // ✅ DEPUIS BDD
    isAdmin: false, // 🍯 HONEYPOT
  },
  isAdmin: false,
  token,
  
};
      } catch (error) {
        // JWT invalide ou expiré
        //A FAIRE: LOGGING SI "invalid token"
        console.error('❌ JWT verification failed:', error.message);

        return {
          req,
          res,
          isAuthenticated: false,
          user: null,
          isAdmin: false,
          token: null,
          error: error.message, // Pour debug
        };
      }
    },
  })
);

// Appliquer le rate limiting général
app.use('/graphql', generalLimiter);

// Rate limiting spécifique pour l'authentification
// Vous pouvez créer un middleware pour détecter les opérations d'auth
app.use('/graphql', (req, res, next) => {
  const operationName = req.body?.operationName || '';
  const query = req.body?.query || '';
  
  // Détecter les opérations d'authentification
  if (operationName === 'Login' || query.includes('mutation login')) {
    return authLimiter(req, res, next);
  }
  
  // Détecter les créations de compte
  if (operationName === 'CreateUser' || query.includes('mutation createUser')) {
    return registrationLimiter(req, res, next);
  }
  
  // Détecter les mutations sensibles
  if (query.includes('mutation')) {
    return mutationLimiter(req, res, next);
  }
  
  next();
});








// Route de santé
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`API Server run at http://localhost:${port}/api`);
  console.log(`🚀 Server ready at http://localhost:${port}/graphql`);
  console.log(`📊 Health check at http://localhost:${port}/health`);
  console.log(`🔐 JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing'}`);
});