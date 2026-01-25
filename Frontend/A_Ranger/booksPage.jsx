import { useState } from 'react';
import { useBooks } from './useBooks';
import BookCard from '../BookCard';
import BookForm from './BookForm';
import LoadingSpinner from '../LoadingSpinner';

const BooksPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  
  const {
    books,
    totalCount,
    hasNextPage,
    loading,
    error,
    createBook,
    updateBook,
    deleteBook,
    loadMore,
  } = useBooks();

  const handleCreate = async (bookData) => {
    await createBook({ variables: { input: bookData } });
    setShowForm(false);
  };

  const handleEdit = (book) => {
    setEditingBook(book);
    setShowForm(true);
  };

  const handleUpdate = async (bookData) => {
    await updateBook({
      variables: {
        input: { id_book: editingBook.id_book, ...bookData }
      }
    });
    setEditingBook(null);
    setShowForm(false);
  };

  const handleDelete = async (bookId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce livre ?')) {
      await deleteBook({ variables: { input: { id_book: bookId } } });
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingBook(null);
  };

  if (loading && books.length === 0) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Erreur: {error.message}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Livres</h1>
          <p className="text-gray-600 mt-1">{totalCount} livre(s) au total</p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          + Ajouter un livre
        </button>
      </div>

      {/* Formulaire de création/édition */}
      {showForm && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            {editingBook ? 'Modifier le livre' : 'Nouveau livre'}
          </h2>
          <BookForm
            book={editingBook}
            onSubmit={editingBook ? handleUpdate : handleCreate}
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* Liste des livres */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {books.map((book) => (
          <BookCard
            key={book.id_book}
            book={book}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Bouton "Charger plus" */}
      {hasNextPage && (
        <div className="text-center mt-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition disabled:bg-gray-100"
          >
            {loading ? 'Chargement...' : 'Charger plus'}
          </button>
        </div>
      )}
    </div>
  );
};

export default BooksPage;