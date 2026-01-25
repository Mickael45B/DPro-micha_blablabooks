import { ApolloClient, InMemoryCache, HttpLink, ApolloLink, Observable } from '@apollo/client';

// ========================================
// CONFIGURATION DES LIENS
// ========================================

// Lien HTTP vers le backend GraphQL
const httpLink = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql',
  credentials: 'include',
});

// Middleware pour ajouter le token JWT
const authLink = new ApolloLink((operation, forward) => {
  // lire plusieurs clés possibles (consistance frontend/backend)
  const token = localStorage.getItem('authToken') || localStorage.getItem('token') || localStorage.getItem('accessToken') || null;
  
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  }));
  
  return forward(operation);
});

// Gestion des erreurs GraphQL et réseau
const errorLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    const subscription = forward(operation).subscribe({
      next: (result) => {
        // Gérer les erreurs GraphQL dans la réponse
        if (result.errors) {
          result.errors.forEach((error) => {
            console.error(`[GraphQL Error]: ${error.message}`, {
              location: error.locations,
              path: error.path,
              extensions: error.extensions,
            });
            
            const code = error.extensions?.code;
            const status = error.extensions?.httpStatus;
            
            // Gérer les erreurs d'authentification
            if (code === 'UNAUTHENTICATED' || status === 401) {
              console.warn('⚠️ Session expirée - redirection vers login');
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
              
              // Éviter les boucles de redirection
              if (!window.location.pathname.includes('/connexion')) {
                window.location.href = '/connexion';
              }
            }
            
            // Gérer les erreurs de permissions
            if (code === 'FORBIDDEN' || status === 403) {
              console.error('🚫 Accès refusé:', error.message);
              // Rediriger vers une page d'accès refusé
              // window.location.href = '/forbidden';
            }
          });
        }
        
        observer.next(result);
      },
      error: (networkError) => {
        // Gérer les erreurs réseau (robuste aux TypeError)
        console.error('[Network Error] raw:', networkError);
        console.error('[Network Error] operation:', operation.operationName, operation.getContext());

       // extraire un status quand disponible
        const statusCode = networkError?.statusCode ?? networkError?.status ?? networkError?.response?.status ?? null;

        // Cas fréquent : TypeError (ex: "NetworkError when attempting to fetch resource.")
        if (!statusCode && networkError && networkError.name === 'TypeError') {
          console.error('⚠️ Erreur réseau sans code HTTP — vérifier que le backend est démarré et que CORS autorise http://localhost:5174');
          // hint utile pour dev
          console.info('Vérifier :', 
            '1) backend sur', import.meta.env.VITE_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql',
            '2) CORS autorise cette origine'
          );
          observer.error(networkError);
          return;
        }

        // Gérer les erreurs réseau spécifiques quand on a un status
        if (statusCode === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          if (!window.location.pathname.includes('/')) window.location.href = '/';
        } else if (statusCode === 403) {
          console.error('🚫 Accès refusé - erreur réseau');
        } else if (statusCode >= 500) {
          console.error('💥 Erreur serveur - veuillez réessayer plus tard.');
        } else if (statusCode === 404) {
          console.error('🚫 Page non trouvée - erreur réseau');
        } else if (statusCode === 409) {
          console.error('🚫 Conflit - erreur réseau');
        }

        observer.error(networkError);      },
    });

    // Cleanup function
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  });
});

// Combiner les links
const link = ApolloLink.from([errorLink, authLink, httpLink]);

// ========================================
// CLIENT APOLLO
// ========================================

const apolloClient = new ApolloClient({
  link,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Configuration du cache pour la pagination des livres
          getBooks: {
            keyArgs: ['order', 'direction'],
            merge(existing, incoming, { args }) {
              if (!args?.offset || args.offset === 0) {
                // Première page ou reset
                return incoming;
              }
              
              // Fusion pour la pagination
              return {
                ...incoming,
                books: [...(existing?.books || []), ...(incoming?.books || [])],
              };
            },
          },
          
          // Configuration pour d'autres queries avec pagination
          getUsers: {
            keyArgs: ['order', 'direction'],
            merge(existing, incoming, { args }) {
              if (!args?.offset || args.offset === 0) return incoming;
              return {
                ...incoming,
                users: [...(existing?.users || []), ...(incoming?.users || [])],
              };
            },
          },
          
          getPermissionsRoles: {
            keyArgs: ['order', 'direction'],
            merge(existing, incoming, { args }) {
              if (!args?.offset || args.offset === 0) return incoming;
              return {
                ...incoming,
                roleHasPermissions: [
                  ...(existing?.roleHasPermissions || []),
                  ...(incoming?.roleHasPermissions || [])
                ],
              };
            },
          },

          Role: {
            keyFields: ['role_name'], // utiliser role_name comme identifiant si id_role absent
          },          
        },
      },
      
      // Politique de cache pour les types individuels
      Book: {
        keyFields: ['id_book'],
      },
      User: {
        keyFields: ['id_user'],
      },
      Role: {
        keyFields: ['role_name'],
      },
      Permission: {
        keyFields: ['id_permission'],
      },
    },
  }),
  
  // Options par défaut
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
  
  // Activer les devtools en développement
  connectToDevTools: import.meta.env.DEV,
});

export default apolloClient;