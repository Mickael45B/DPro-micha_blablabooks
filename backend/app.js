import express from "express";
import cors from "cors";
import helmet from "helmet";
import { router } from "./router/router.js";
import errorHandler from "./middlewares/errorHandler.js";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const app = express();

//app.disable("x-powered-by");

// JSON Parser Middleware
app.use(
	cors({
	  origin: ["http://localhost:5173"], // Autorisez l'origine du frontend
	  methods: ["GET", "POST", "PATCH", "DELETE"], // Méthodes HTTP autorisées
	  allowedHeaders: ["Content-Type", "Authorization"], // En-têtes autorisés
	  credentials: true, // Autorisez les cookies ou les sessions
	})
  );
  const __dirname = path.dirname(new URL(import.meta.url).pathname);// Pour obtenir le répertoire courant

  // Servir les images statiques depuis le dossier "images"
app.use("/public/images", express.static(path.join(__dirname, "images")));
app.use(express.json());

// app.use(helmet());
app.use(express.json());
app.use(express.static("public"));
app.use(router);
app.use(errorHandler);

export default app;
