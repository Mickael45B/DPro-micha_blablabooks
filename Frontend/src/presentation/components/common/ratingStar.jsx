import * as React from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Rating from "@mui/material/Rating";
import StarIcon from "@mui/icons-material/Star";
import "../../pages/BookDetail/BookPage.css";

// Définir la style à l'aide de la fonction stylée de Material-UI
const StyledRating = styled(Rating)(({ theme }) => ({
	"& .MuiRating-iconFilled": {
		color: "#ffd700",
	},
	"& .MuiRating-iconHover": {
		color: "#ffb400",
	},
}));

// Composant fonctionnel pour afficher le StyledRating
const RatingStar = ({ name, value, defaultValue, size, readOnly }) => {
	const ratingValue = value ?? defaultValue ?? 0; // Priorité: value > defaultValue > 0

	return (
		<Box sx={{ display: "flex", alignItems: "center" }}>
			<Rating
				className="custom-rating"
				name={name || "text-feedback"}
				value={ratingValue}
				readOnly={readOnly !== false} // true par défaut
				precision={0.5}
				size={size || "medium"}
				emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
			/>
			<Box sx={{ ml: 2 }}>{ratingValue}</Box>
		</Box>
	);
};

export default RatingStar;

/*
    PRECEDANT CODE
    
    return (
		<Box>
			<StyledRating
				className="custom-rating"
				name="user-rating"
				defaultValue={3.5} // Valeur par défaut : 3.5 étoiles
				precision={0.1} // Précision : 1 dizième
				getLabelText={(value) => `${value} Star${value !== 1 ? "s" : ""}`} // Texte associé à chaque valeur
				onChange={(event, newValue) => {
					console.log(`Nouvelle valeur de notation : ${newValue}`); // Gestion de l'événement de changement
				}}
				readOnly={false} // Composant interactif
				icon={<span style={{ fontSize: "2rem", color: "#ffd700" }}>★</span>} // Icône personnalisée pour les étoiles remplies
				emptyIcon={
					<span style={{ fontSize: "2rem", color: "#ffffff" }}>★</span>
				} // Icône personnalisée pour les étoiles vides
			/>
		</Box>
	);*/
