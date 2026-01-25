import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const BookCard = ({ book, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
      {/* Image de couverture */}
      <div className="h-48 bg-gray-200 flex items-center justify-center">
        {book.cover_image ? (
          <img
            src={book.cover_image}
            alt={book.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-gray-400 text-4xl">📚</span>
        )}
      </div>

      {/* Informations */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 truncate">
          {book.title}
        </h3>
        <p className="text-sm text-gray-600 mt-1">{book.author}</p>
        
        {book.isbn && (
          <p className="text-xs text-gray-500 mt-2">ISBN: {book.isbn}</p>
        )}

        {book.description && (
          <p className="text-sm text-gray-700 mt-2 line-clamp-3">
            {book.description}
          </p>
        )}

        <div className="text-xs text-gray-500 mt-3">
          Ajouté {formatDistanceToNow(new Date(book.created_at), { 
            addSuffix: true,
            locale: fr 
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onEdit(book)}
            className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition text-sm"
          >
            Modifier
          </button>
          <button
            onClick={() => onDelete(book.id_book)}
            className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 transition text-sm"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookCard;