import React from "react";
import "../css/NavBar.css";
import "../css/MediaQueries.css";
import { Link } from "react-router-dom";
import "../css/LoginPage.css";
import axios from "axios";
import { useState } from "react";

const LoginPage = () => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [message, setMessage] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();

		try {
			const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/connexion`, {
				email,
				password,
			});

			if (response.data.data[0]) {
				localStorage.setItem("token", response.data.data[0]); // Stocker le token dans le localStorage (s'effacera à la déconnexion ou à la connexion d'un autre utilisateur)
				setMessage("Connexion réussie !");
				// rediriger l'utilisateur sur la page d'accueil
				window.location.href = "/";
			}
		} catch (error) {
			console.error("Erreur lors de la connexion :", error);
			if (error.response) {
				setMessage(
					error.response.data.message || "Erreur lors de la connexion.",
				);
			} else {
				setMessage("Erreur serveur.");
			}
		}
	};

	return (
		<div className="auth-page">
			<div className="auth-card">
				<h1 className="auth-title">Connexion</h1>
				<form className="auth-form" onSubmit={handleSubmit}>
					<input
						type="email"
						placeholder="Email"
						className="auth-input"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						required
					/>
					<input
						type="password"
						placeholder="Mot de passe"
						className="auth-input"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
					/>
					<button type="submit" className="auth-button">
						Se connecter
					</button>
				</form>
				{message && <p className="auth-message">{message}</p>}
				<p className="auth-switch">
					Pas encore de compte ? <Link to="/inscription">S'inscrire</Link>
				</p>
			</div>
		</div>
	);
};

export default LoginPage;
