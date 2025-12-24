import { useQuery } from '@apollo/client';
import apolloClient from '../services/apolloClient';
import { GET_BOOKS } from './queriesBooks';
import { CREATE_BOOK, UPDATE_BOOK, DELETE_BOOK } from './mutationsBooks';
import toast from 'react-hot-toast';

export const useBooks = (options = {}) => {
  const { limit = 20, offset = 0, order = 'created_at', direction = 'DESC' } = options;

  const { data, loading, error, fetchMore, refetch } = useQuery(GET_BOOKS, {
    variables: { limit, offset, order, direction },
    notifyOnNetworkStatusChange: true,
  });

  const createBook = async (variables) => {
    try {
      const result = await apolloClient.mutate({
        mutation: CREATE_BOOK,
        variables
      });
      toast.success('Livre créé avec succès');
      await refetch();
      return result;
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la création');
      throw error;
    }
  };

  const updateBook = async (variables) => {
    try {
      const result = await apolloClient.mutate({
        mutation: UPDATE_BOOK,
        variables
      });
      toast.success('Livre mis à jour');
      await refetch();
      return result;
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
      throw error;
    }
  };

  const deleteBook = async (variables) => {
    try {
      const result = await apolloClient.mutate({
        mutation: DELETE_BOOK,
        variables
      });
      toast.success('Livre supprimé');
      await refetch();
      return result;
    } catch (error) {
      toast.error(error.message || 'Erreur lors de la suppression');
      throw error;
    }
  };

  const loadMore = () => {
    if (data?.getBooks?.hasNextPage) {
      fetchMore({
        variables: {
          offset: data.getBooks.books.length,
        },
      });
    }
  };

  return {
    books: data?.getBooks?.books || [],
    totalCount: data?.getBooks?.totalCount || 0,
    hasNextPage: data?.getBooks?.hasNextPage || false,
    loading,
    error,
    createBook,
    updateBook,
    deleteBook,
    creating: false,
    updating: false,
    deleting: false,
    loadMore,
    refetch,
  };
};