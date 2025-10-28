
Schéma GraphQL (Apollo)

enum SortOrder {
  ASC
  DESC
}

enum BookSortableField {
  AVG_RATING
  NB_REVIEWS
  IS_IN_FAVORITE
  IS_IN_LIBRARY
}

input BookSort {
  field: BookSortableField!
  order: SortOrder = ASC
}

type Book {
  id: ID!
  isbn: String
  title: String!
  author: String
  genre: String
  description: String
  avg_rating: Float
  nb_reviews: Int
  is_in_favorite: Boolean
  is_in_library: Boolean
}

type Query {
  books(search: String, sort: [BookSort!]): [Book!]!
}













Resolver Apollo (TypeScript + Knex)

import { Knex } from "knex";

const resolvers = {
  Query: {
    books: async (_: any, { search, sort }: any, { db }: { db: Knex }) => {
      let query = db("books");

      // Recherche texte
      if (search) {
        query = query.whereRaw(
          `to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(author,'') || ' ' || coalesce(description,'')) @@ plainto_tsquery(?)`,
          [search]
        );
      }

      // Tri dynamique
      if (sort && sort.length > 0) {
        const columnMap: Record<string, string> = {
          AVG_RATING: "avg_rating",
          NB_REVIEWS: "nb_reviews",
          IS_IN_FAVORITE: "is_in_favorite",
          IS_IN_LIBRARY: "is_in_library"
        };

        sort.forEach(({ field, order }: any) => {
          query = query.orderBy(columnMap[field], order.toLowerCase());
        });
      }

      return query.select("*");
    }
  }
};










Exemple de requête GraphQL (côté client)

query {
  books(
    search: "fantasy"
    sort: [
      { field: AVG_RATING, order: DESC }
      { field: NB_REVIEWS, order: DESC }
    ]
  ) {
    id
    title
    avg_rating
    nb_reviews
  }
}

Exemple d’en-têtes GraphiQL / Apollo Studio (Headers):
{
  "authorization": "Bearer <votre_token_jwt>"
}


Si vous voulez juste vérifier que la résolution fonctionne côté DB/schema localement, on peut temporairement forcer un flag admin dans createContext. Exemple (code à coller dans server.ts dans createContext, uniquement pour dev) :
// Après extraction du token
let token = ...;
// Pour debug local uniquement : si token == 'dev-admin' on simule un user admin
let user = null;
if (token === 'dev-admin') {
  user = { id: 'dev', isAdmin: true, role: 'admin' };
}
return { req, res, cache: ..., dataSources: {}, token, user };