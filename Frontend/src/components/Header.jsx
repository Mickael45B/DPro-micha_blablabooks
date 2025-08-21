/**
 * Composant Header qui affiche l'en-tête de l'application.
 *
 * @returns {JSX.Element} Le composant Header rendu.
 */
import React, { useState, useEffect, useRef } from "react";
import {
	toggleNav,
	closeNavOnOutsideClick,
	closeNavOnEscape,
} from "../services/burgerMenu.js";
import "../css/index.css";
import "../css/Header.css";
import "../css/NavBar.css";
import "../css/MediaQueries.css";
import "../css/LoginPage.css";

const Header = () => {
	const [isNavOpen, setIsNavOpen] = useState(false); // État pour gérer l'ouverture de la barre de navigation
	const navRef = useRef(null); // Référence pour la barre de navigation

	useEffect(() => {
		// Ajoute les gestionnaires pour fermer la barre de navigation
		const cleanupOutsideClick = closeNavOnOutsideClick(setIsNavOpen, navRef);
		const cleanupEscape = closeNavOnEscape(setIsNavOpen);

		// Nettoie les gestionnaires lors du démontage
		return () => {
			cleanupOutsideClick();
			cleanupEscape();
		};
	}, []);

	return (
		<div>
			{/* Bandeau supérieur coloré */}
			<div className="header__pinkColor" />
			<header className="header">
				{/* Logo de l'application */}
				<a href="/" className="logo_link">
					<img
						className="logo"
						src="/src/assets/logoTitre.png"
						alt="BlablaBooks Logo"
					/>
				</a>

				{/* Actions dans l'en-tête */}
				<div className="header__actions">
					{/* Bouton de recherche */}
					<button
						className="header__search"
						type="button"
						onClick={() => setIsSearchOpen(true)}
					>
						<input
							className="searchbar"
							type="text"
							placeholder="Rechercher un livre"
						/>
						<i className="fas fa-search" />
					</button>
					<span className="separation">|</span>
					{/* Bouton d'authentification */}
					<button className="header__auth" type="button">
						<span className="connect">Se connecter</span>
						<i className="fas fa-user" />
					</button>
					<span className="separation">|</span>
					{/* Bouton pour ouvrir la barre de navigation */}
					<button
						className="menu-toggle"
						type="button"
						onClick={() => toggleNav(setIsNavOpen)}
					>
						<i className="fas fa-bars" />
					</button>
				</div>

				{/* Barre de navigation */}
				<nav
					ref={navRef}
					className={`header__nav ${isNavOpen ? "header__nav--open" : ""}`}
				>
					{/* Bouton pour fermer la barre de navigation */}
					<button
						className="header__nav-close"
						type="button"
						onClick={() => toggleNav(setIsNavOpen)}
					>
						<i className="fas fa-times" />
					</button>
					{/* Liens de navigation */}
					<ul>
						<li>
							<a href="/">Accueil</a>
						</li>
						<li>
							<a href="/catalogue">Catalogue</a>
						</li>
						<li>
							<a href="/book/1">Livre</a>
						</li>
						<li>
							<a href="/connexion">Connexion</a>
						</li>
						<li>
							<a href="/mybiblilbooks">MyBibliBooks</a>
						</li>
					</ul>
				</nav>
			</header>
		</div>
	);
};

export default Header;
