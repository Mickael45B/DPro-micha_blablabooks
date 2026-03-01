import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { useAuth } from "../../../infrastructure/context/AuthContext.jsx";
import { LOGIN_MUTATION, saveAuthPayload, UNBLOCK_ACCOUNT_MUTATION, REQUEST_ADMIN_UNBLOCK_MUTATION } from "../../../data/graphql/queries/auth.jsx";
import emailjs from '@emailjs/browser';
import CGUModal from '../../../presentation/components/layout/Footer/CGUModal.jsx';
import "./LoginPage.css";



import "../../../presentation/styles/NavBar.css";
// import "../../../index.css";



const LoginPage = () => {

    // États locaux
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [acceptCGU, setAcceptCGU] = useState(false);
    const [hasReadCGU, setHasReadCGU] = useState(false);
    const [message, setMessage] = useState("");
    const [accountStatus, setAccountStatus] = useState(null);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [showCGU, setShowCGU] = useState(false);
    const [resetEmail, setResetEmail] = useState("");

    // Navigation
    const navigate = useNavigate();

    // Mutations GraphQL
    const [loginMutation, { loading }] = useMutation(LOGIN_MUTATION);
    const [unblockAccount] = useMutation(UNBLOCK_ACCOUNT_MUTATION);
    const [requestAdminUnblock] = useMutation(REQUEST_ADMIN_UNBLOCK_MUTATION);
    const { login: authLogin } = useAuth();

    // Initialiser EmailJS
    useEffect(() => {
        emailjs.init(import.meta.env.VITE_KEY_EMAILJS || "YOUR_PUBLIC_KEY");
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setAccountStatus(null);

        // Vérifier que les CGU ont été lues et acceptées
        if (!hasReadCGU) {
            setMessage("Veuillez lire les Conditions Générales d'Utilisation");
            return;
        }

        if (!acceptCGU) {
            setMessage("Vous devez accepter les CGU pour vous connecter");
            return;
        }

        try {
            //console.log("Tentative de connexion avec:", email, "Remember me:", rememberMe);
            
            const { data } = await loginMutation({
                variables: {
                    input: { 
                        emailOrPseudo: email, 
                        password,
                        rememberMe 
                    }
                }
            });

            //console.log("Réponse du serveur:", data);

            if (!data?.login) {
                setMessage("Erreur: pas de réponse du serveur");
                return;
            }

            // Vérifier le statut du compte
            const userStatus = data.login.user?.status;
            //console.log("Statut du compte:", userStatus);

            // Gérer les comptes bloqués
            if (userStatus?.id_status === 2) {
                // Bloqué par admin
                setAccountStatus({
                    type: 'admin_blocked',
                    message: 'Votre compte a été bloqué par un administrateur.',
                    user: data.login.user
                });
                return;
            }

            if (userStatus?.id_status === 3) {
                // Auto-bloqué
                setAccountStatus({
                    type: 'self_blocked',
                    message: 'Vous avez bloqué votre compte.',
                    user: data.login.user
                });
                return;
            }

            if (userStatus?.id_status === 4) {
                // Bloqué admin + user
                setAccountStatus({
                    type: 'both_blocked',
                    message: 'Votre compte est bloqué par vous-même et par un administrateur.',
                    user: data.login.user
                });
                return;
            }

            if (userStatus?.id_status === 5) {
                // Compte supprimé
                setMessage("Ce compte a été supprimé.");
                return;
            }

            // Compte actif - sauvegarder et continuer
            const saved = saveAuthPayload({
                ...data.login,
                refresh_token: data.login.refresh_token,
                accessToken: data.login.accessToken
            });
            
            if (!saved) {
                console.error("Échec de la sauvegarde des données d'authentification");
                setMessage("Erreur lors de la sauvegarde de la session");
                return;
            }

            //console.log("Données d'authentification sauvegardées avec succès");

            if (data.login.accessToken && authLogin) {
                try {
                    authLogin(data.login.accessToken);
                } catch (e) {
                    console.warn("Erreur lors de la mise à jour:", e);
                }
            }

            const userRole = data.login.user?.role?.role_name;
            //console.log("Rôle de l'utilisateur:", userRole);
            
            setMessage("Connexion réussie ! Redirection...");

            setTimeout(() => {
                if (userRole === 'glossaire') {
                    //console.log("Redirection vers le dashboard admin");
                    navigate('/adminDashboard');
                } else {
                    //console.log("Redirection vers l'accueil");
                    navigate('/');
                }
            }, 500);

        } catch (error) {
            console.error("Erreur lors de la connexion:", error);
            
            const errorMessage =
                error?.graphQLErrors?.[0]?.message ||
                error?.message ||
                "Erreur lors de la connexion. Veuillez réessayer.";
            
            setMessage(errorMessage);
        }
    };

    // Débloquer son propre compte
    const handleUnblockAccount = async () => {
        if (!accountStatus?.user?.id_user) return;

        try {
            await unblockAccount({
                variables: {
                    id_user: accountStatus.user.id_user
                }
            });

            setMessage("Compte débloqué avec succès ! Vous pouvez maintenant vous connecter.");
            setAccountStatus(null);
        } catch (error) {
            console.error("Erreur lors du déblocage:", error);
            setMessage("Erreur lors du déblocage du compte");
        }
    };

    // Demander le déblocage à un admin
    const handleRequestAdminUnblock = async () => {
        if (!accountStatus?.user?.id_user) return;

        try {
            await requestAdminUnblock({
                variables: {
                    id_user: accountStatus.user.id_user
                }
            });

            setMessage("Votre demande de déblocage a été envoyée aux administrateurs. Vous recevrez une réponse par email.");
        } catch (error) {
            console.error("Erreur lors de la demande:", error);
            setMessage("Erreur lors de l'envoi de la demande");
        }
    };

    // Mot de passe oublié avec EmailJS
    const handleForgotPassword = async (e) => {
        e.preventDefault();

        if (!resetEmail) {
            setMessage("Veuillez entrer votre adresse email");
            return;
        }

        try {
            // Générer un code de réinitialisation (à stocker en base via une mutation)
            const resetCode = Math.random().toString(36).substring(2, 15);

            // Envoyer l'email via EmailJS
            const templateParams = {
                to_email: resetEmail,
                reset_link: `${window.location.origin}/reset-password?code=${resetCode}`,
                user_email: resetEmail
            };

            await emailjs.send(
                import.meta.env.REACT_APP_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID',
                import.meta.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID',
                templateParams
            );

            setMessage("Un email de réinitialisation a été envoyé à votre adresse.");
            setShowForgotPassword(false);
            setResetEmail("");
        } catch (error) {
            console.error("Erreur EmailJS:", error);
            setMessage("Erreur lors de l'envoi de l'email. Veuillez réessayer.");
        }
    };

    const handleOpenCGU = () => {
        setShowCGU(true);
        setHasReadCGU(true); // Marquer comme lu quand l'utilisateur ouvre le modal
    };

    // Affichage du formulaire de déblocage
    if (accountStatus) {
        return (
            <div className="auth-page">
                <div className="auth-card auth-card--blocked">
                    <div className="blocked-icon">
                        <i className="fas fa-lock"></i>
                    </div>
                    <h1 className="auth-title">Compte bloqué</h1>
                    
                    <div className="blocked-message">
                        <p>{accountStatus.message}</p>
                    </div>

                    {accountStatus.type === 'self_blocked' && (
                        <button 
                            className="auth-button auth-button--unblock"
                            onClick={handleUnblockAccount}
                        >
                            <i className="fas fa-unlock"></i>
                            Débloquer mon compte
                        </button>
                    )}

                    {(accountStatus.type === 'admin_blocked' || accountStatus.type === 'both_blocked') && (
                        <>
                            <div className="admin-blocked-info">
                                <i className="fas fa-info-circle"></i>
                                <p>
                                    Votre compte a été bloqué par un administrateur. 
                                    Vous pouvez contacter l'équipe pour demander le déblocage.
                                </p>
                            </div>
                            <button 
                                className="auth-button auth-button--request"
                                onClick={handleRequestAdminUnblock}
                            >
                                <i className="fas fa-envelope"></i>
                                Demander le déblocage
                            </button>
                        </>
                    )}

                    <button 
                        className="auth-button auth-button--secondary"
                        onClick={() => {
                            setAccountStatus(null);
                            setPassword("");
                        }}
                    >
                        Retour
                    </button>

                    {message && (
                        <p className={`auth-message ${message.includes('succès') ? 'success' : 'error'}`}>
                            {message}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // Formulaire mot de passe oublié
    if (showForgotPassword) {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <h1 className="auth-title">Mot de passe oublié</h1>
                    
                    <p className="forgot-password-info">
                        Entrez votre adresse email et nous vous enverrons un lien 
                        pour réinitialiser votre mot de passe.
                    </p>

                    <form className="auth-form" onSubmit={handleForgotPassword}>
                        <input
                            type="email"
                            placeholder="Votre email"
                            className="auth-input"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                        
                        <button type="submit" className="auth-button">
                            <i className="fas fa-paper-plane"></i>
                            Envoyer le lien
                        </button>
                        
                        <button 
                            type="button" 
                            className="auth-button auth-button--secondary"
                            onClick={() => {
                                setShowForgotPassword(false);
                                setResetEmail("");
                            }}
                        >
                            Retour
                        </button>
                    </form>

                    {message && (
                        <p className={`auth-message ${message.includes('envoyé') ? 'success' : 'error'}`}>
                            {message}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    // Formulaire de connexion principal
    return (
        <>
            <div className="auth-page">
                <div className="auth-card">
                    <h1 className="auth-title">
                        <i className="fas fa-sign-in-alt"></i>
                        Connexion
                    </h1>
                    
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <i className="fas fa-envelope input-icon"></i>
                            <input
                                type="email"
                                placeholder="Email ou Pseudo"
                                className="auth-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>
                        
                        <div className="input-group">
                            <i className="fas fa-lock input-icon"></i>
                            <input
                                type="password"
                                placeholder="Mot de passe"
                                className="auth-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <div className="auth-options">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <span className="checkbox-custom"></span>
                                Se souvenir de moi
                            </label>

                            <button 
                                type="button" 
                                className="forgot-password-link"
                                onClick={() => setShowForgotPassword(true)}
                            >
                                Mot de passe oublié ?
                            </button>
                        </div>

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
                            disabled={loading || !acceptCGU || !hasReadCGU}
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>
                                    Connexion en cours...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-sign-in-alt"></i>
                                    Se connecter
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
                        Pas encore de compte ?{' '}
                        <Link to="/inscription">
                            <i className="fas fa-user-plus"></i>
                            S'inscrire
                        </Link>
                    </p>
                </div>
            </div>

            {showCGU && <CGUModal onClose={() => setShowCGU(false)} />}
        </>
    );
};

export default LoginPage;
