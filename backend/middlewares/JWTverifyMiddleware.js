import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const verifyJWT = (req, res, next) => {
	try {
		// Récupérer le token JWT depuis les en-têtes
		const authHeader = req.headers.authorization; // Utilisez "authorization" en minuscules
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({ message: "No token provided" });
		}

		// Extraire le token après "Bearer "
		const token = authHeader.split(" ")[1];

		// Vérifier et décoder le token
		const decoded = jwt.verify(token, process.env.JWT_SECRET); // Assurez-vous que JWT_SECRET est défini dans votre fichier .env
		req.user = decoded; // Ajouter les informations utilisateur à l'objet `req` pour les utiliser dans les contrôleurs
		next(); // Passer au middleware ou contrôleur suivant
	} catch (error) {
		console.error("JWT verification error:", error);
		return res.status(401).json({ message: "Invalid or expired token" });
	}
};

export default verifyJWT;
