import React from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../css/NavBar.css";
import "../css/MediaQueries.css";
import "../css/RegisterPage.css";
import { useState } from "react";

const RegisterPage = () => {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
	});

	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");

		try {
			const response = await axios.post(
				`${import.meta.env.VITE_BACKEND_URL}/inscription`,
				formData,
			);
			setSuccess("Compte créé avec succès !");
			console.log(response);
			// si l'inscription est réussie, connecter l'utilisateur automatiquement
			if (response.status === 201) {
				const loginResponse = await axios.post(
					`${import.meta.env.VITE_BACKEND_URL}/connexion`,
					{
						email: formData.email,
						password: formData.password,
					},
				);
				if (loginResponse.data.data[0]) {
					localStorage.setItem("token", loginResponse.data.data[0]); // Stocker le token dans le localStorage
					window.location.href = "/"; // Rediriger vers la page d'accueil
				}
			}
		} catch (err) {
			if (err.response?.data?.message) {
				setError(err.response.data.message);
			} else {
				setError("Erreur lors de l'inscription.");
			}
		}
	};

	return (
		<div className="auth-page">
			<div className="auth-card">
				<h1 className="auth-title">Inscription</h1>
				<form className="auth-form" onSubmit={handleSubmit}>
					<input
						type="text"
						name="name"
						placeholder="Nom"
						className="auth-input"
						value={formData.name}
						onChange={handleChange}
						required
					/>
					<input
						type="email"
						name="email"
						placeholder="Email"
						className="auth-input"
						value={formData.email}
						onChange={handleChange}
						required
					/>
					<input
						type="password"
						name="password"
						placeholder="Mot de passe"
						className="auth-input"
						value={formData.password}
						onChange={handleChange}
						required
					/>
					<button type="submit" className="auth-button">
						Créer un compte
					</button>
				</form>
				{error && <p className="auth-error">{error}</p>}
				{success && <p className="auth-success">{success}</p>}
				<p className="auth-switch">
					Déjà un compte ? <Link to="/connexion">Se connecter</Link>
				</p>
			</div>
		</div>
	);
};

export default RegisterPage;
