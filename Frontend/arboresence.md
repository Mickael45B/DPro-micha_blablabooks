# 🏗️ Architecture Frontend React + Apollo Client (MVC + Clean Code)

## 📁 Arborescence complète

```
blablabooks-frontend/
├── index.js                        # Point d'entrée
├── App.jsx                         # Composant racine
├── index.css                       # Reset & variables CSS
├── app.css            
├── dockerfile
│
├── node_modules/
│
├── A_Ranger/
│   ├── booksPage.jsx
│   ├── burgerMenu.js
│   ├── script.js
│
├── public/                          # Fichiers statiques
│   ├── index.html
│   ├── favicon.ico
│   └── images/                      # Images publiques
│       ├── vignettesImages/
│       ├── booksImages/
│       └── placeholders/
│
├── src/
│   ├── config/                      # 🔧 Configuration
│   │   ├── apolloClient.js         # Config Apollo Client
│   │   ├── constants.js             # Constantes globales
│   │   └── routes.config.js         # Configuration des routes
│   │
│   ├── core/                        # 🎯 Logique métier (Business Logic)
│   │   ├── models/                  # Modèles de données
│   │   │   ├── Book.model.js
│   │   │   ├── User.model.js
│   │   │   └── Review.model.js
│   │   │
│   │   ├── services/                # Services métier (MVC - Model/Service)
│   │   │   ├── authService.js       # Logique d'authentification
│   │   │   ├── bookService.js       # Logique des livres
│   │   │   ├── userService.js       # Logique utilisateurs
│   │   │   └── storageService.js    # Gestion du stockage local
│   │   │
│   │   ├── validators/              # Validation des données
│   │   │   ├── bookValidator.js
│   │   │   └── userValidator.js
│   │   │
│   │   └── helpers/                 # Fonctions utilitaires métier
│   │       ├── dateFormatter.js
│   │       ├── textProcessor.js
│   │       └── imageHelper.js
│   │       └── AdminRoute.jsx
│   │
│   ├── data/                        # 📡 Couche d'accès aux données (Data Layer)
│   │   ├── apollo/                  # Configuration Apollo
│   │   │   ├── apolloClient.js      # Instance Apollo
│   │   │   ├── cache.config.js      # Configuration du cache
│   │   │   └── links/               # Apollo Links
│   │   │       ├── authLink.js
│   │   │       ├── errorLink.js
│   │   │       └── httpLink.js
│   │   │
│   │   ├── graphql/                 # Requêtes et mutations GraphQL
│   │   │   ├── queries/
│   │   │   │   ├── books.queries.js
│   │   │   │   ├── users.queries.js
│   │   │   │   └── reviews.queries.js
│   │   │   │   └── auth.jsx
│   │   │   │   └── queriesBooks.jsx
│   │   │   │
│   │   │   ├── mutations/
│   │   │   │   ├── books.mutations.js
│   │   │   │   ├── auth.mutations.js
│   │   │   │   └── reviews.mutations.js
│   │   │   │   └── mutationsBooks.jsx
│   │   │   │
│   │   │   ├── fragments/           # Fragments GraphQL réutilisables
│   │   │   │   ├── book.fragments.js
│   │   │   │   └── user.fragments.js
│   │   │   │
│   │   │   └── subscriptions/       # Abonnements (si utilisés)
│   │   │       └── book.subscriptions.js
│   │   │
│   │   └── hooks/                   # Custom Hooks pour les données
│   │       ├── useBooks.js          # Hook pour gérer les livres
│   │       ├── useBooks.jsx          # Hook pour gérer les livres
│   │       ├── useAuth.js           # Hook pour l'authentification
│   │       ├── useReviews.js
│   │       └── usePagination.js
│   │
│   ├── presentation/                # 🎨 Couche présentation (MVC - View)
│   │   ├── pages/                   # Pages complètes
│   │   │   ├── Home/
│   │   │   │   ├── HomePage.jsx
│   │   │   │   ├── HomePage.css
│   │   │   │   └── HomePage.test.js
│   │   │   │   └── MainContent.jsx
│   │   │   │   └── MainContent.css
│   │   │   │
│   │   │   ├── Catalog/
│   │   │   │   ├── LibraryPage.jsx
│   │   │   │   └── LibraryPage.css
│   │   │   │
│   │   │   ├── BookDetail/
│   │   │   │   ├── BookPage.jsx
│   │   │   │   ├── BookPage.css
│   │   │   │   └── components/      # Composants spécifiques à cette page
│   │   │   │       ├── BookInfo.jsx
│   │   │   │       ├── ReviewsList.jsx
│   │   │   │       └── RelatedBooks.jsx
│   │   │   │
│   │   │   ├── Auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── LoginPage.css
│   │   │   │   ├── AuthDebug.jsx
│   │   │   │   ├── RegisterPage.jsx
│   │   │   │   ├── RegisterPage.css
│   │   │   │   └── Auth.css
│   │   │   │
│   │   │   ├── Profile/
│   │   │   │   ├── DashboardPage.jsx
│   │   │   │   ├── DashboardPage.css
│   │   │   │   ├── libraries/
│   │   │   │       ├── UserLibraryPage.css
│   │   │   │       └── UserLibraryPage.jsx
│   │   │   │
│   │   │   └── Admin/
│   │   │       ├── AdminDashboard.jsx
│   │   │       └── AdminDashboard.css
│   │   │
│   │   ├── components/              # Composants réutilisables
│   │   │   ├── layout/              # Composants de structure
│   │   │   │   ├── MainLayout/
│   │   │   │   │   ├── MainLayout.jsx
│   │   │   │   │   └── MainLayout.css
│   │   │   │   ├── Header/
│   │   │   │   │   ├── Header.jsx
│   │   │   │   │   └── Header.css
│   │   │   │   ├── Footer/
│   │   │   │   │   ├── Footer.jsx
│   │   │   │   │   └── Footer.css
│   │   │   │   └── Navigation/
│   │   │   │       ├── Navigation.jsx
│   │   │   │       └── Navigation.css
│   │   │   │
│   │   │   ├── common/              # Composants génériques
│   │   │   │   ├── Button/
│   │   │   │   │   ├── Button.jsx
│   │   │   │   │   ├── Button.css
│   │   │   │   │   └── Button.test.js
│   │   │   │   ├── Input/
│   │   │   │   ├── Modal/
│   │   │   │   ├── Loader/
│   │   │   │   └── ErrorBoundary/
│   │   │   │       ├── forbiden.jsx
│   │   │   │       └── NotFoundPage.jsx
│   │   │   │
│   │   │   ├── features/            # Composants métier
│   │   │   │   ├── BookCard/
│   │   │   │   │   ├── BookCard.jsx
│   │   │   │   │   ├── BookCard.css
│   │   │   │   │   └── variants/    # Variantes du composant
│   │   │   │   │       ├── SmallCard/
│   │   │   │   │           ├── SmallCard.jsx
│   │   │   │   │           ├── SmallCard.css
│   │   │   │   │       └── Thumbnail/
│   │   │   │   │           ├── Thumbnail.jsx
│   │   │   │   │           └── Thumbnail.css
│   │   │   │   │
│   │   │   │   ├── BookSummary/
│   │   │   │   │   ├── BookSummary.jsx
│   │   │   │   │   └── BookSummary.css
│   │   │   │   │
│   │   │   │   ├── Carousel/
│   │   │   │   │   ├── Carousel.jsx
│   │   │   │   │   └── Carousel.css
│   │   │   │   │
│   │   │   │   ├── SearchBar/
│   │   │   │   ├── FilterPanel/
│   │   │   │   └── Pagination/
│   │   │   │
│   │   │   └── forms/               # Formulaires
│   │   │       ├── BookForm/
│   │   │       |   ├── BookForm.jsx
│   │   │       ├── ReviewForm/
│   │   │       └── LoginForm/
│   │   │
│   │   └── styles/                  # Styles globaux
│   │       ├── variables.css        # Variables CSS
│   │       ├── index.css        # Variables CSS
│   │       ├── NavBar.css        # Variables CSS
│   │       ├── typography.css
│   │       ├── utilities.css
│   │       └── mediaQueries.css
│   │
│   ├── infrastructure/              # 🛠️ Infrastructure (utilitaires transversaux)
│   │   ├── router/                  # Configuration du routage
│   │   │   ├── AppRouter.jsx
│   │   │   ├── routes.js
│   │   │   ├── PrivateRoute.jsx
│   │   │   ├── errorsRouter.jsx
│   │   │   └── AdminRoute.jsx
│   │   │
│   │   ├── context/                 # Contextes React
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ThemeContext.jsx
│   │   │   └── NotificationContext.jsx
│   │   │
│   │   ├── store/                   # État global (si Redux/Zustand)
│   │   │   ├── index.js
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.js
│   │   │   │   └── uiSlice.js
│   │   │   └── middleware/
│   │   │
│   │   └── utils/                   # Utilitaires génériques
│   │       ├── formatters/
│   │       │   ├── dateFormatter.js
│   │       │   ├── priceFormatter.js
│   │       │   └── textFormatter.js
│   │       │
│   │       ├── validators/
│   │       │   ├── emailValidator.js
│   │       │   └── formValidator.js
│   │       │
│   │       └── helpers/
│   │           ├── dynamicSizingText.js
│   │           ├── debounce.js
│   │           ├── multilignes.js
│   │           └── localStorage.js
│   │
│   ├── assets/                      # 🎨 Ressources statiques
│   │   ├── images/
│   │   │   ├── logo.png
│   │   │   └── icons/
│   │   ├── fonts/
│   │   └── videos/
│   │
│   └── tests/                       # 🧪 Tests
│       ├── unit/                    # Tests unitaires
│       ├── integration/             # Tests d'intégration
│       └── e2e/                     # Tests end-to-end
├── node_modules/
├── .env                             # Variables d'environnement
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
├── jsconfig.json                    # Configuration des imports absolus
├── nginx.conf
└──  vite.config.js
```

---

## 🎯 Principes MVC appliqués

### **Model (Modèle)** 
```
core/models/          → Définition des structures de données
core/services/        → Logique métier
data/graphql/         → Accès aux données (API)
```

### **View (Vue)**
```
presentation/pages/      → Pages complètes
presentation/components/ → Composants UI réutilisables
```

### **Controller (Contrôleur)**
```
data/hooks/              → Custom hooks (logique de présentation)
infrastructure/context/  → Gestion d'état global
```

---

## 📋 Exemples de fichiers

### 1️⃣ **Model** : `core/models/Book.model.js`
```javascript
export class BookModel {
  constructor(data) {
    this.id = data.id_book;
    this.title = this.decodeHtml(data.title);
    this.author = this.decodeHtml(data.author);
    this.isbn = data.isbn;
    this.genre = data.genre;
    this.avgRating = data.avg_rating || 0;
    this.nbReviews = data.nb_reviews || 0;
    // ... autres propriétés
  }

  decodeHtml(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  get displayRating() {
    return this.avgRating.toFixed(1);
  }
}
```

### 2️⃣ **Service** : `core/services/bookService.js`
```javascript
import { BookModel } from '../models/Book.model';

export const bookService = {
  transformBooks(rawBooks) {
    return rawBooks.map(book => new BookModel(book));
  },

  filterByGenre(books, genre) {
    if (!genre) return books;
    return books.filter(book => book.genre === genre);
  },

  sortByRating(books, order = 'desc') {
    return [...books].sort((a, b) => 
      order === 'desc' 
        ? b.avgRating - a.avgRating 
        : a.avgRating - b.avgRating
    );
  }
};
```

### 3️⃣ **Data Layer** : `data/graphql/queries/books.queries.js`
```javascript
import { gql } from '@apollo/client';

export const GET_BOOKS = gql`
  query GetBooks($limit: Int, $offset: Int) {
    getBooks(pagination: { limit: $limit, offset: $offset }) {
      books {
        id_book
        title
        author
        # ...
      }
      totalCount
      hasNextPage
    }
  }
`;
```

### 4️⃣ **Custom Hook** : `data/hooks/useBooks.js`
```javascript
import { useQuery } from '@apollo/client';
import { GET_BOOKS } from '../graphql/queries/books.queries';
import { bookService } from '../../core/services/bookService';

export const useBooks = (options = {}) => {
  const { data, loading, error } = useQuery(GET_BOOKS, {
    variables: {
      limit: options.limit || 50,
      offset: options.offset || 0
    }
  });

  const books = data?.getBooks?.books 
    ? bookService.transformBooks(data.getBooks.books)
    : [];

  return { books, loading, error };
};
```

### 5️⃣ **View Component** : `presentation/components/features/BookCard/BookCard.jsx`
```javascript
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './BookCard.css';

export const BookCard = ({ book, onShowSummary }) => {
  const navigate = useNavigate();

  return (
    <div className="book-card" onClick={() => onShowSummary(book)}>
      <img src={book.imageUrl} alt={book.title} />
      <h3>{book.title}</h3>
      <p>{book.author}</p>
      <button onClick={() => navigate(`/books/${book.id}`)}>
        Voir détails
      </button>
    </div>
  );
};
```

---

## 🌟 Avantages de cette architecture

### ✅ **Séparation des responsabilités**
- La logique métier est isolée dans `core/`
- Les données sont gérées dans `data/`
- L'UI est séparée dans `presentation/`

### ✅ **Testabilité**
- Chaque couche peut être testée indépendamment
- Les services sont purs et faciles à tester

### ✅ **Maintenabilité**
- Structure claire et prévisible
- Facile d'ajouter de nouvelles fonctionnalités

### ✅ **Scalabilité**
- Peut grandir sans devenir chaotique
- Facile d'onboarder de nouveaux développeurs

### ✅ **Réutilisabilité**
- Composants, hooks et services réutilisables
- Moins de duplication de code

---

## 🚀 Import avec chemins absolus

### Configuration : `jsconfig.json`
```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@core/*": ["core/*"],
      "@data/*": ["data/*"],
      "@presentation/*": ["presentation/*"],
      "@infrastructure/*": ["infrastructure/*"],
      "@assets/*": ["assets/*"],
      "@utils/*": ["infrastructure/utils/*"]
    }
  }
}
```

### Exemple d'import
```javascript
// Au lieu de :
import { bookService } from '../../../core/services/bookService';

// On fait :
import { bookService } from '@core/services/bookService';
import { useBooks } from '@data/hooks/useBooks';
import { BookCard } from '@presentation/components/features/BookCard';
```

---

## 📚 Documentation recommandée

- **MVC Pattern** : https://en.wikipedia.org/wiki/Model–view–controller
- **Clean Architecture** : https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- **Apollo Client Best Practices** : https://www.apollographql.com/docs/react/

Cette architecture suit les principes SOLID et garantit un code maintenable et évolutif ! 🎉