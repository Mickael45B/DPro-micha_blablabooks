import pkg from "pg"; // Importer le module CommonJS
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg; // Extraire `Pool` depuis le module `pg`

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'blablabook',
  user: process.env.DB_USER || 'blablabook',
  password: process.env.DB_PASSWORD || 'blablabook',
  max: 20, // Nombre max de connexions dans le pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Tester la connexion au démarrage
pool.on("connect", () => {
  //console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle client", err);
  process.exit(-1);
});

// Exporter l'objet `db` en tant que module ES
const db = {
  query: (text, params) => pool.query(text, params),
  pool,
};

export default db;