import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { useAuth } from "../../../infrastructure/context/AuthContext.jsx";
import { REGISTER_MUTATION, saveAuthPayload } from "../../../data/graphql/queries/auth.jsx";
import CGUModal from '../../../presentation/components/layout/Footer/CGUModal.jsx';
import "./LoginPage.css";



import "../../../presentation/styles/NavBar.css";
// import "../../../index.css";


const RegisterPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [pseudo, setPseudo] = useState("");
    const [acceptCGU, setAcceptCGU] = useState(false);
    const [hasReadCGU, setHasReadCGU] = useState(false);
    const [showCGU, setShowCGU] = useState(false);
    const [message, setMessage] = useState("");
    const [passwordStrength, setPasswordStrength] = useState(0);
    const navigate = useNavigate();

    const [registerMutation, { loading }] = useMutation(REGISTER_MUTATION);
    const { login: authLogin } = useAuth();

    // Vérifier la force du mot de passe
    const checkPasswordStrength = (pwd) => {
        let strength = 0;
        if (pwd.length >= 8) strength++;
        if (pwd.length >= 12) strength++;
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
        if (/\d/.test(pwd)) strength++;
        if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
        return strength;
    };

    const handlePasswordChange = (e) => {
        const pwd = e.target.value;
        setPassword(pwd);
        setPasswordStrength(checkPasswordStrength(pwd));
    };

    const getPasswordStrengthLabel = () => {
        if (passwordStrength === 0) return { label: '', class: '' };
        if (passwordStrength <= 2) return { label: 'Faible', class: 'weak' };
        if (passwordStrength <= 3) return { label: 'Moyen', class: 'medium' };
        return { label: 'Fort', class: 'strong' };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        // Vérifier que les CGU ont été lues et acceptées
        if (!hasReadCGU) {
            setMessage("Veuillez lire les Conditions Générales d'Utilisation");
            return;
        }

        if (!acceptCGU) {
            setMessage("Vous devez accepter les CGU pour créer un compte");
            return;
        }

        // Vérifier la correspondance des mots de passe
        if (password !== confirmPassword) {
            setMessage("Les mots de passe ne correspondent pas");
            return;
        }

        // Vérifier la force du mot de passe
        if (passwordStrength < 3) {
            setMessage("Votre mot de passe doit être plus fort. Utilisez au moins 8 caractères, des majuscules, des minuscules et des chiffres.");
            return;
        }

        try {
            //console.log("Tentative d'inscription avec:", email, pseudo);
            
            const { data } = await registerMutation({
                variables: {
                    input: { 
                        email, 
                        password, 
                        pseudo,
                        name: name || null
                    }
                }
            });

            //console.log("Réponse du serveur:", data);

            if (!data?.register) {
                setMessage("Erreur: pas de réponse du serveur");
                return;
            }

            // Sauvegarder les données d'authentification
            const saved = saveAuthPayload(data.register);
            
            if (!saved) {
                console.error("Échec de la sauvegarde des données d'authentification");
                setMessage("Erreur lors de la sauvegarde de la session");
                return;
            }

            //console.log("Inscription réussie, données sauvegardées");

            if (data.register.accessToken && authLogin) {
                try {
                    authLogin(data.register.accessToken);
                } catch (e) {
                    console.warn("Erreur lors de la mise à jour du contexte:", e);
                }
            }

            setMessage("Compte créé avec succès ! Redirection...");

            setTimeout(() => {
                navigate('/');
            }, 1000);

        } catch (error) {
            console.error("Erreur lors de l'inscription:", error);
            
            const errorMessage =
                error?.graphQLErrors?.[0]?.message ||
                error?.message ||
                "Erreur lors de la création du compte. Veuillez réessayer.";
            
            setMessage(errorMessage);
        }
    };

    const handleOpenCGU = () => {
        setShowCGU(true);
        setHasReadCGU(true);
    };

    const strengthInfo = getPasswordStrengthLabel();

    return (
        <>
            <div className="auth-page">
                <div className="auth-card">
                    <h1 className="auth-title">
                        <i className="fas fa-user-plus"></i>
                        Créer un compte
                    </h1>
                    
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <i className="fas fa-envelope input-icon"></i>
                            <input
                                type="email"
                                placeholder="Email *"
                                className="auth-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>
                        
                        <div className="input-group">
                            <i className="fas fa-user input-icon"></i>
                            <input
                                type="text"
                                placeholder="Pseudo *"
                                className="auth-input"
                                value={pseudo}
                                onChange={(e) => setPseudo(e.target.value)}
                                required
                                autoComplete="username"
                            />
                        </div>
                
                        <div className="input-group">
                            <i className="fas fa-id-card input-icon"></i>
                            <input
                                type="text"
                                placeholder="Nom (optionnel)"
                                className="auth-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoComplete="name"
                            />
                        </div>

                        <div className="input-group">
                            <i className="fas fa-lock input-icon"></i>
                            <input
                                type="password"
                                placeholder="Mot de passe *"
                                className="auth-input"
                                value={password}
                                onChange={handlePasswordChange}
                                required
                                autoComplete="new-password"
                            />
                        </div>

                        {password && (
                            <div className="password-strength">
                                <div className="password-strength-bar">
                                    <div 
                                        className={`password-strength-fill password-strength-fill--${strengthInfo.class}`}
                                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                                    ></div>
                                </div>
                                {strengthInfo.label && (
                                    <span className={`password-strength-label password-strength-label--${strengthInfo.class}`}>
                                        {strengthInfo.label}
                                    </span>
                                )}
                            </div>
                        )}

                        <div className="password-requirements">
                            <p className="requirements-title">
                                <i className="fas fa-shield-alt"></i>
                                Votre mot de passe doit contenir :
                            </p>
                            <ul>
                                <li className={password.length >= 8 ? 'valid' : ''}>
                                    <i className={`fas fa-${password.length >= 8 ? 'check-circle' : 'circle'}`}></i>
                                    Au moins 8 caractères
                                </li>
                                <li className={/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'valid' : ''}>
                                    <i className={`fas fa-${/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'check-circle' : 'circle'}`}></i>
                                    Majuscules et minuscules
                                </li>
                                <li className={/\d/.test(password) ? 'valid' : ''}>
                                    <i className={`fas fa-${/\d/.test(password) ? 'check-circle' : 'circle'}`}></i>
                                    Au moins un chiffre
                                </li>
                                <li className={/[^a-zA-Z0-9]/.test(password) ? 'valid' : ''}>
                                    <i className={`fas fa-${/[^a-zA-Z0-9]/.test(password) ? 'check-circle' : 'circle'}`}></i>
                                    Un caractère spécial (recommandé)
                                </li>
                            </ul>
                        </div>
                        
                        <div className="input-group">
                            <i className="fas fa-lock input-icon"></i>
                            <input
                                type="password"
                                placeholder="Confirmer le mot de passe *"
                                className="auth-input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                            />
                        </div>

                        {password && confirmPassword && (
                            <div className="password-match">
                                {password === confirmPassword ? (
                                    <p className="match-success">
                                        <i className="fas fa-check-circle"></i>
                                        Les mots de passe correspondent
                                    </p>
                                ) : (
                                    <p className="match-error">
                                        <i className="fas fa-times-circle"></i>
                                        Les mots de passe ne correspondent pas
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="cgu-acceptance">
                            <label className="checkbox-label checkbox-label--cgu">
                                <input
                                    type="checkbox"
                                    checked={acceptCGU}
                                    onChange={(e) => setAcceptCGU(e.target.checked)}
                                    disabled={!hasReadCGU}
                                />
                                <span className="checkbox-custom"></span>
                                <span>
                                    J'ai lu et j'accepte les{' '}
                                    <button 
                                        type="button"
                                        className="cgu-link"
                                        onClick={handleOpenCGU}
                                    >
                                        Conditions Générales d'Utilisation
                                    </button>
                                </span>
                            </label>
                            {!hasReadCGU && (
                                <p className="cgu-warning">
                                    <i className="fas fa-info-circle"></i>
                                    Veuillez lire les CGU avant d'accepter
                                </p>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            className="auth-button" 
                            disabled={loading || !acceptCGU || !hasReadCGU || password !== confirmPassword}
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Création en cours...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-user-plus"></i>
                                    Créer mon compte
                                </>
                            )}
                        </button>
                    </form>
                    
                    {message && (
                        <p className={`auth-message ${message.includes('succès') ? 'success' : 'error'}`}>
                            {message}
                        </p>
                    )}
                    
                    <p className="auth-switch">
                        Déjà un compte ?{' '}
                        <Link to="/connexion">
                            <i className="fas fa-sign-in-alt"></i>
                            Se connecter
                        </Link>
                    </p>
                </div>
            </div>

            {showCGU && <CGUModal onClose={() => setShowCGU(false)} />}
        </>
    );
};

export default RegisterPage;
