import jwt from "jsonwebtoken";

const verifyAdmin = (req, res, next) => {
	try {
		// Récupérer le token JWT depuis les en-têtes
		const token = req.headers.authorization?.split(" ")[1]; // Format attendu : "Bearer <token>"
		if (!token) {
			return res.status(401).json({ message: "No token provided" });
		}

		// Vérifier et décoder le token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		// Vérifier si l'utilisateur est un administrateur
		if (!decoded.user || !decoded.user.name.is_admin) {
			return res.status(403).json({
				message: "Access denied: Admins only",
			});
		}

		// Ajouter les informations utilisateur au `req` pour les utiliser dans les routes
		req.user = decoded.user;

		// Passer au middleware ou contrôleur suivant
		next();
	} catch (error) {
		console.error("Error verifying admin:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

export default verifyAdmin;
