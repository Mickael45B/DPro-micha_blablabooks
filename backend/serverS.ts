import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeTypeDefs } from "@graphql-tools/merge";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Try to load schema files from dist/schema; if empty (when compiled), fallback to project's schema folder
let schemaPath = path.join(__dirname, "schema");
let typesArray = loadFilesSync(schemaPath, {
  extensions: ["gql", "graphql"],
  recursive: true,
});
if (!typesArray || typesArray.length === 0) {
  // fallback to parent folder (source schema)
  schemaPath = path.join(__dirname, "..", "schema");
  typesArray = loadFilesSync(schemaPath, {
    extensions: ["gql", "graphql"],
    recursive: true,
  });
}

const typeDefs = mergeTypeDefs(typesArray);

import resolvers from "./resolvers/index.js";

const server = new ApolloServer({
  typeDefs,
  resolvers: resolvers as any,
});

const port = Number(process.env.PORT ?? 4000);
startStandaloneServer(server, {
  listen: { port },
}).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
