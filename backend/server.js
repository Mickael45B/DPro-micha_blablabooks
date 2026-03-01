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
import { generalLimiter, authLimiter, mutationLimiter, registrationLimiter, initRateLimiters } from './config/rateLimiter.js';

dotenv.config();

await initRateLimiters(); // Initialiser les limiteurs de taux avant de démarrer le serveur





const _appUse = express.application.use;
express.application.use = function (...args) {
  try {
    console.log('[DIAG] app.use args:', args.map(a => {
      if (typeof a === 'string') return `STRING:${a}`;
      if (a && a.constructor && a.constructor.name) return `FN:${a.constructor.name}:${a.name || '<anon>'}`;
      return typeof a;
    }));
  } catch (e) {
    console.error('[DIAG] app.use log failed', e);
  }
  return _appUse.apply(this, args);
};

const _routerUse = express.Router.use;
express.Router.use = function (...args) {
  try {
    console.log('[DIAG] router.use args:', args.map(a => {
      if (typeof a === 'string') return `STRING:${a}`;
      if (a && a.constructor && a.constructor.name) return `FN:${a.constructor.name}:${a.name || '<anon>'}`;
      return typeof a;
    }));
  } catch (e) {
    //console.error('[DIAG] router.use log failed', e);
  }
  return _routerUse.apply(this, args);
};


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

// ✅ CORS OPTIONS - DÉPLACÉ AVANT TOUT
const corsOptions = {
  origin: [
    "http://localhost:5173", 
    "http://localhost:5174", 
    "http://localhost:3000", 
    "http://localhost:4000"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// ✅ Appliquer CORS en PREMIER
app.use(cors(corsOptions));
app.options('/{*any}', cors(corsOptions));  // Preflight requests

// ✅ Middleware Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Rate limiting AVANT les routes GraphQL (mais APRÈS express.json)
app.use((req, res, next) => next()); // placeholder
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
  
  // Rate limiting général
  return generalLimiter(req, res, next);
});

// 🚀 Créer et démarrer Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,
  formatError: (formattedError, error) => {
    // Ajouter des informations de debug en développement
    if (process.env.NODE_ENV === 'development') {
      console.error('GraphQL Error:', formattedError);
    }
    return formattedError;
  },
});

await server.start();

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

// ✅ Middleware GraphQL Apollo
app.use(
  "/graphql",
  expressMiddleware(server, {
    context: async ({ req, res }) => {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7)
        : authHeader;
      
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
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const tokenUserId = decoded.id_user || decoded.id || null;

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
            
            if (userRes.rows && userRes.rows.length > 0) {
              dbUser = userRes.rows[0];
            }
          } catch (dbErr) {
            console.error('❌ DB lookup failed:', dbErr?.message);
          }
        }

        if (!dbUser) {
          console.error('❌ User not found in database');
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

        return {
          req,
          res,
          isAuthenticated: true,
          user: {
            id_user: dbUser.id_user,
            name: dbUser.name,
            pseudo: dbUser.pseudo,
            role: dbUser.role_name,
            isAdmin: false, // 🍯 HONEYPOT
          },
          // isAdmin: dbUser.role_name === 'admin',
          isAdmin: false, // 🍯 HONEYPOT
          token,
        };
      } catch (error) {
        console.error('❌ JWT verification failed:', error.message);
        return {
          req,
          res,
          isAuthenticated: false,
          user: null,
          isAdmin: false,
          token: null,
          error: error.message,
        };
      }
    },
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
  console.log(`🔐 JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing'}`);
  console.log(`🌐 CORS enabled for: ${corsOptions.origin.join(', ')}`);
});