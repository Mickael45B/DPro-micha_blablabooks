import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { useAuth } from "../../../infrastructure/context/AuthContext.jsx";
import { LOGIN_MUTATION, saveAuthPayload } from "../../../data/graphql/queries/auth.jsx";
import "../../../presentation/styles/NavBar.css";
import "../../../index.css";

import "./LoginPage.css";

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
            console.log("Tentative de connexion avec:", email);
            
            // Appel à la mutation de login
            const { data } = await loginMutation({
                variables: {
                    input: { emailOrPseudo: email, password }
                }
            });

            console.log("Réponse du serveur:", data);

            // Vérifier que nous avons reçu des données
            if (!data?.login) {
                setMessage("Erreur: pas de réponse du serveur");
                return;
            }

            // Sauvegarder TOUTES les données d'authentification
            const saved = saveAuthPayload(data.login);
            
            if (!saved) {
                console.error("Échec de la sauvegarde des données d'authentification");
                setMessage("Erreur lors de la sauvegarde de la session");
                return;
            }

            console.log("Données d'authentification sauvegardées avec succès");

            // Mettre à jour le contexte d'authentification si disponible
            if (data.login.accessToken && authLogin) {
                try {
                    authLogin(data.login.accessToken);
                } catch (e) {
                    console.warn("Erreur lors de la mise à jour du contexte:", e);
                }
            }

            // Vérifier le rôle et rediriger
            const userRole = data.login.user?.role?.role_name;
            console.log("Rôle de l'utilisateur:", userRole);
            
            // Message de succès
            setMessage("Connexion réussie ! Redirection...");

            // Redirection selon le rôle
            setTimeout(() => {
                if (userRole === 'glossaire') {
                    console.log("Redirection vers le dashboard admin");
                    navigate('/adminDashboard');
                } else {
                    console.log("Redirection vers l'accueil");
                    navigate('/');
                }
            }, 500);

        } catch (error) {
            // Gestion des erreurs
            console.error("Erreur lors de la connexion:", error);
            
            const errorMessage =
                error?.graphQLErrors?.[0]?.message ||
                error?.message ||
                "Erreur lors de la connexion. Veuillez réessayer.";
            
            setMessage(errorMessage);
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
                        autoComplete="email"
                    />
                    
                    <input
                        type="password"
                        placeholder="Mot de passe"
                        className="auth-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                    />
                    
                    <button 
                        type="submit" 
                        className="auth-button" 
                        disabled={loading}
                    >
                        {loading ? "Connexion en cours..." : "Se connecter"}
                    </button>
                </form>
                
                {message && (
                    <p className={`auth-message ${message.includes('succès') ? 'success' : 'error'}`}>
                        {message}
                    </p>
                )}
                
                <p className="auth-switch">
                    Pas encore de compte ? <Link to="/inscription">S'inscrire</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;