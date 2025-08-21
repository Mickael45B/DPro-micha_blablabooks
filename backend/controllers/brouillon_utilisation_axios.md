## Créez un fichier authMiddleware.js 

``` 

import jwt from "jsonwebtoken";

const verifyJWT = (req, res, next) => {
    try {
        // Récupérer le token JWT depuis les en-têtes
        const token = req.headers["authorization"];
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        // Décoder le token pour obtenir les informations utilisateur
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Assurez-vous que JWT_SECRET est défini dans votre fichier .env
        req.user = decoded; // Ajouter les informations utilisateur à l'objet `req` pour les utiliser dans les contrôleurs
        next(); // Passer au middleware ou contrôleur suivant
    } catch (error) {
        console.error("JWT verification error:", error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

export default verifyJWT;

```

## Exemple de routeur reviewRoutes.js :

``` 

import express from "express";
import reviewController from "../controllers/reviewController.js";
import verifyJWT from "../middlewares/authMiddleware.js";

const router = express.Router();

// Routes protégées par le middleware JWT
router.post("/reviews/:id", verifyJWT, reviewController.createReview);
router.get("/reviews/:id", verifyJWT, reviewController.getReviewById);
router.patch("/reviews/:id", verifyJWT, reviewController.updateReview);
router.delete("/reviews/:id", verifyJWT, reviewController.deleteReview);

export default router;

```

## Exemple de méthode createReview mise à jour :

```

async createReview(req, res) {
    try {
        // Récupérer l'utilisateur depuis le middleware
        const id_user = req.user.id_user;

        // Récupérer le id_book depuis l'URL
        const id_book = req.params.id;

        // Récupérer le rating et le comment depuis le body
        const schema = Joi.object({
            rating: Joi.number().integer().min(1).max(5).required(),
            comment: Joi.string().min(10).max(1000).required(),
        });

        const { error, value } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                message: "Invalid data",
                details: error.details,
            });
        }

        // Nettoyer les données pour éviter les attaques XSS
        const cleanComment = sanitizeHtml(value.comment);
        const cleanRating = value.rating;

        // Créer un nouvel avis dans la base de données
        const newReview = await Review.create({
            id_review: generateUUID(),
            id_user: id_user,
            id_book: id_book,
            rating: cleanRating,
            comment: cleanComment,
        });

        // Retourner l'avis créé
        return res.status(201).json(newReview);
    } catch (error) {
        console.error("Error creating review:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

 ```

## Créez un fichier validationMiddleware.js :

```

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            message: "Invalid data",
            details: error.details,
        });
    }
    next();
};

export default validate;


 ```
## Exemple de schéma Joi pour createReview :

```

import Joi from "joi";

export const createReviewSchema = Joi.object({
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().min(10).max(1000).required(),
});

```
## Exemple de routeur reviewRoutes.js mis à jour :

```

import express from "express";
import reviewController from "../controllers/reviewController.js";
import verifyJWT from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validationMiddleware.js";
import { createReviewSchema } from "../schemas/reviewSchemas.js";

const router = express.Router();

// Routes protégées par le middleware JWT et validation des données
router.post("/reviews/:id", verifyJWT, validate(createReviewSchema), reviewController.createReview);
router.get("/reviews/:id", verifyJWT, reviewController.getReviewById);
router.patch("/reviews/:id", verifyJWT, reviewController.updateReview);
router.delete("/reviews/:id", verifyJWT, reviewController.deleteReview);

export default router;


```

## Exemple de middleware errorHandler.js :

``` 

const errorHandler = (err, req, res, next) => {
    console.error("Error:", err);
    res.status(err.status || 500).json({
        message: err.message || "Internal server error",
    });
};

export default errorHandler;

```

## Utilisation dans app.js :

```

import express from "express";
import reviewRoutes from "./routes/reviewRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

app.use(express.json());
app.use("/api", reviewRoutes);

// Middleware global pour gérer les erreurs
app.use(errorHandler);

export default app;

```