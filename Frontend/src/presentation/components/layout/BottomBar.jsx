/**
 * Composant BottomBar qui affiche le pied de page de l'application en version mobile.
 *
 * @returns {JSX.Element} Le composant BottomBar rendu.
 */
import * as React from 'react';
import './BottomBar.css'; // Importation des styles CSS
import '../../styles/MediaQueries.css'; // Importation des media queries
// Importation des composants Material-UI
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import RestoreIcon from '@mui/icons-material/Restore';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ArchiveIcon from '@mui/icons-material/Archive';

export default function BottomBar() {
  const [value, setValue] = React.useState(0); // État pour gérer la navigation

  return (
    <Box className="box" sx={{ pb: 7 }}>
      {/* Conteneur pour la barre de navigation inférieure */}
      <Paper className="paper" sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
        <BottomNavigation className="bottomNavigation"
          showLabels
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue); // Met à jour l'état lors de la sélection
          }}
        >
          {/* Actions de navigation */}
          <BottomNavigationAction className="bottomNavigationAction" label="Recents" icon={<RestoreIcon className="RestoreIcon"/>} />
          <BottomNavigationAction className="bottomNavigationAction" label="Favorites" icon={<FavoriteIcon className="FavoriteIcon" />} />
          <BottomNavigationAction className="bottomNavigationAction" label="Ajouter" icon={<ArchiveIcon className="ArchiveIcon"/>} />
        </BottomNavigation>
      </Paper>
    </Box>
  );
}

