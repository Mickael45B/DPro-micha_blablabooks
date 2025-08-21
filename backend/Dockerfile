# Utiliser une image Node.js
FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app-backend

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier tout le code source
COPY . .

# Exposer le port 3000
EXPOSE 3000

# Commande pour démarrer le backend
CMD ["npm", "run", "start"]