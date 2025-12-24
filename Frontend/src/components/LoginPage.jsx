import React from "react";
import "../css/NavBar.css";
import "../css/MediaQueries.css";
import { Link, useNavigate } from "react-router-dom";
import "../css/LoginPage.css";
import { useState } from "react";
import { useAuth } from "../AuthContext";


import { useMutation } from "@apollo/client";
import { LOGIN_MUTATION, saveAuthPayload } from "./auth.jsx";






const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const [loginMutation, { loading }] = useMutation(LOGIN_MUTATION);
    const { login: authLogin } = useAuth();


    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        try {
            const { data } = await loginMutation({
                variables: {
                    input: { emailOrPseudo: email, password }
                }
            });

            // sauvegarder l'AuthPayload complet si présent (contient user + tokens)
            if (data?.login) {
            try { 
                saveAuthPayload(data.login);
                const token = data.login.accessToken || data.login.token || null;
                if (token) {
                    authLogin(token); // met à jour le contexte / localStorage immédiatement
                }

            } catch (e) { /* silent */ }
            }			
            navigate('/');
            // gérer plusieurs noms possibles pour le token
            const token =
                data?.login?.token ||
                data?.login?.accessToken ||
                data?.login?.jwt ||
                data?.login?.refreshToken ||
                null;

            if (token) {
                // utilise le contexte d'auth pour propager l'utilisateur
                try { authLogin(token); } catch (e) { localStorage.setItem("token", token); }
                setMessage("Connexion réussie !");
                navigate("/");
                return;
            }

            // si le serveur ne renvoie pas de token mais renvoie user (ex: auth via cookie)
            if (data?.login?.user) {
                setMessage("Connexion réussie !");
                navigate("/");
                return;
            }

            // fallback : pas de token ni d'user -> message générique
            setMessage("Connexion échouée : token manquant.");
        } catch (error) {
            // extraire le message d'erreur GraphQL si présent
            const gqlMessage =
                error?.graphQLErrors?.[0]?.message ||
                error?.message ||
                "Erreur lors de la connexion.";
            console.error("Erreur lors de la connexion :", error);
            setMessage(gqlMessage);
        }
    };	return (
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
                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? "Connexion..." : "Se connecter"}
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
