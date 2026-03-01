/**
 * Gestion des livres - Section Admin
 */
import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_BOOKS, GET_BOOK_BY_ID, GET_BOOK_REVIEWS, SEARCH_BOOKS, CREATE_BOOK, UPDATE_BOOK, DELETE_BOOK } from './adminQueries.jsx';
import ImageUpload from './ImageUpload.jsx';

const BooksManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    publication_date: '',
    genre: '',
    editor: '',
    bookimage: '',
    vignetteimage: '',
    age_limit: '',
    description: '',
    series: ''
  });

  const { data, loading, error, refetch } = useQuery(GET_BOOKS, {
    variables: { limit: 50, offset: 0 },
       fetchPolicy: 'network-only',
   notifyOnNetworkStatusChange: true
  });

  const [createBook] = useMutation(CREATE_BOOK, {
    onCompleted: () => {
      refetch();
      setShowAddModal(false);
      resetForm();
      alert('✅ Livre ajouté avec succès !');
    },
    onError: (error) => {
      console.error('❌ Erreur CREATE_BOOK:', error);
      alert('❌ Erreur lors de l\'ajout : ' + error.message);
    }
  });

  const [updateBook] = useMutation(UPDATE_BOOK, {
    refetchQueries: [{ query: GET_BOOKS, variables: { limit: 50, offset: 0 } }],
    awaitRefetchQueries: true,
    onCompleted: () => {
      setShowEditModal(false);
      resetForm();
      refetch();
      alert('✅ Livre modifié avec succès !');
    },
    onError: (error) => {
      console.error('❌ Erreur UPDATE_BOOK:', error);
      alert('❌ Erreur lors de la modification : ' + error.message);
    }
  });

  const [deleteBook] = useMutation(DELETE_BOOK, {
    onCompleted: () => {
      refetch();
      alert('✅ Livre supprimé avec succès !');
    },
    onError: (error) => {
      console.error('❌ Erreur DELETE_BOOK:', error);
      alert('❌ Erreur lors de la suppression : ' + error.message);
    }
  });

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      isbn: '',
      publication_date: '',
      genre: '',
      editor: '',
      bookimage: '',
      vignetteimage: '',
      age_limit: '',
      description: '',
      series: ''
    });
    setSelectedBook(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Gestion des images
  const handleImageChange = (fieldName, imageData) => {
    setFormData(prev => ({ ...prev, [fieldName]: imageData || '' }));
  };
  
const handleAdd = async (e) => {
  e.preventDefault();
  try {
    const input = {};
    
    Object.keys(formData).forEach(key => {
      const value = formData[key];
      if (value !== '' && value !== null && value !== undefined) {
        if (key === 'age_limit') {
          input[key] = parseInt(value);
        } else {
          input[key] = value;
        }
      }
    });
    
    if (!input.title) {
      alert('❌ Le titre est obligatoire');
      return;
    }
    
    //console.log('🟢 Ajout livre:', input);
    // ✅ Pas d'alert ici - le onCompleted s'en charge
    await createBook({ variables: { input } });
  } catch (error) {
    // ✅ L'erreur est déjà gérée par onError
    console.error('Erreur dans handleAdd:', error);
  }
};

const handleEdit = async (e) => {
  e.preventDefault();
  try {
    if (!selectedBook?.id_book) {
      alert('❌ ID du livre manquant');
      return;
    }
    
    const input = { id_book: selectedBook.id_book };
    
    Object.keys(formData).forEach(key => {
      const value = formData[key];
      if (value !== '' && value !== null && value !== undefined) {
        if (key === 'age_limit') {
          input[key] = parseInt(value);
        } else {
          input[key] = value;
        }
      }
    });
    
      //console.log('🔵 Modification livre:', input);
      await updateBook({ variables: { input } });
    } catch (error) {
      console.error('Erreur handleEdit:', error);
    }
};

const handleDelete = async (id_book) => {
  if (!id_book) {
    alert('❌ ID du livre manquant');
    return;
  }
  
  if (window.confirm('⚠️ Êtes-vous sûr de vouloir supprimer ce livre ?')) {
    try {
      //console.log('🔴 Suppression livre:', id_book);
      await deleteBook({ variables: { input: { id_book } } });
    } catch (error) {
      console.error('Erreur dans handleDelete:', error);
    }
  }
};

  const openEditModal = (book) => {
    if (!book?.id_book) {
      console.error('❌ Erreur: book =', book);
      alert('Données invalides');
      return;
    }
    
    //console.log('✏️ Ouverture modal édition');
    //console.log('✏️ Livre sélectionné:', book);
    //console.log('✏️ ID du livre:', book.id_book);
    
    setSelectedBook(book);
    
    setFormData({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      publication_date: book.publication_date || '',
      genre: book.genre || '',
      editor: book.editor || '',
      bookimage: book.bookimage || '',
      vignetteimage: book.vignetteimage || '',
      age_limit: book.age_limit || '',
      description: book.description || '',
      series: book.series || ''
    });

    setShowEditModal(true);
  };

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur : {error.message}</div>;

  const books = data?.getBooks?.books || [];
  
  // Debug: vérifier la structure des données
  //console.log('Données des livres:', books);
  if (books.length > 0) {
    //console.log('Premier livre:', books[0]);
    //console.log('ID du premier livre:', books[0].id_book);
  }

    // Fonction pour décoder les entités HTML
    const decodeHtml = (html) => {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    };


  return (
    <div className="books-management">
      <div className="section-header">
        <h2 className="section-title">
          <i className="fas fa-book"></i> Gestion des livres
        </h2>
        <button 
          className="btn btn--primary"
          onClick={() => setShowAddModal(true)}
        >
          <i className="fas fa-plus"></i> Ajouter un livre
        </button>
      </div>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Rechercher par titre ou auteur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <i className="fas fa-search search-icon"></i>
      </div>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th className="petitTaille">Titre</th>
              <th className="petitTaille">Auteur</th>
              <th className="petitTaille">Genre</th>
              <th className="petitTaille">ISBN</th>
              <th className="petitTaille">Note moyenne</th>
              <th className="petitTaille">Actions</th>
            </tr>
          </thead>
          <tbody>
            {books
              .filter(book => 
                !searchTerm || 
                book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.author?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map(book => book.id_book ? (
                <tr key={book.id_book}>
                  <td  >
                    {book.vignetteimage ? (
                      <img src={`/images/vignettesImages/${book.vignetteimage}`} alt={decodeHtml(book.title)} className="book-thumbnail" />
                    ) : (
                      <div className="book-placeholder">
                        <i className="fas fa-book"></i>
                      </div>
                    )}
                  </td>
                  <td><strong >{decodeHtml(book.title)}</strong></td>
                  <td >{book.author}</td>
                  <td ><span className="badge">{book.genre}</span></td>
                  <td >{book.isbn}</td>
                  <td >
                    {book.avg_rating && (
                      <span className="rating">
                        <i className="fas fa-star"></i> {book.avg_rating}
                      </span>
                    )}
                  </td>
                  <td  className=" actions-cell">
                    <button
                      className="btn-icon btn-icon--edit"
                      id={`${book.id_book}`}
                      onClick={() => openEditModal(book)}
                      title="Modifier"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className="btn-icon btn-icon--delete"
                      id={`${book.id_book}`}
                      onClick={() => handleDelete(book.id_book)}
                      title="Supprimer"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ) : null)}
          </tbody>
        </table>
      </div>

      {/* Modal Ajout */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Ajouter un livre</h2>
              <button className="modal__close" onClick={() => setShowAddModal(false)} aria-label="Close Add Modal">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleAdd} className="modal__body">
              {/* SECTION IMAGES */}
              <div className="form-section">
                <h3 className="form-section__title">
                  <i className="fas fa-images"></i> Images du livre
                </h3>
                
                <div className="form-grid form-grid--2cols">
                  <ImageUpload
                    name="vignetteimage"
                    label="Image vignette (liste)"
                    currentImage={formData.vignetteimage}
                    onImageChange={handleImageChange}
                    maxSize={2}
                    aspectRatio={2/3}
                    required={false}
                  />
                  
                  <ImageUpload
                    name="bookimage"
                    label="Image détail (page livre)"
                    currentImage={formData.bookimage}
                    onImageChange={handleImageChange}
                    maxSize={5}
                    aspectRatio={null}
                    required={false}
                  />
                </div>
              </div>

              {/* SECTION INFORMATIONS */}
              <div className="form-section">
                <h3 className="form-section__title">
                  <i className="fas fa-info-circle"></i> Informations du livre
                </h3>

                <div className="form-grid">
                <div className="form-group">
                  <label>Titre *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Auteur</label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label>ISBN</label>
                  <input
                    type="text"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label>Genre</label>
                  <input
                    type="text"
                    name="genre"
                    value={formData.genre}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label>Éditeur</label>
                  <input
                    type="text"
                    name="editor"
                    value={formData.editor}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label>Date de publication</label>
                  <input
                    type="date"
                    name="publication_date"
                    value={formData.publication_date}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label>Âge minimum</label>
                  <input
                    type="number"
                    name="age_limit"
                    value={formData.age_limit}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label>Série</label>
                  <input
                    type="text"
                    name="series"
                    value={formData.series}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group form-group--full">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                  />
                </div>
              </div>
              </div>
              
              <div className="modal__actions">
                <button type="submit" className="btn btn--primary">
                  <i className="fas fa-save"></i> Ajouter
                </button>
                <button 
                  type="button" 
                  className="btn btn--secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Édition */}
      {showEditModal && selectedBook && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Modifier : {selectedBook.title}</h2>
              <button className="modal__close" onClick={() => setShowEditModal(false)} aria-label="Close Edit Modal">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleEdit} className="modal__body">
              {/* SECTION IMAGES */}
              <div className="form-section">
                <h3 className="form-section__title">
                  <i className="fas fa-images"></i> Images du livre
                </h3>

                <div className="form-grid form-grid--2cols">
                  <ImageUpload
                    name="vignetteimage"
                    label="Image vignette (liste)"
                    currentImage={formData.vignetteimage}
                    onImageChange={handleImageChange}
                    maxSize={2}
                    aspectRatio={2/3}
                  />
                  
                  <ImageUpload
                    name="bookimage"
                    label="Image détail (page livre)"
                    currentImage={formData.bookimage}
                    onImageChange={handleImageChange}
                    maxSize={5}
                    aspectRatio={null}
                  />
                </div>
              </div>

              {/* SECTION INFORMATIONS */}
              <div className="form-section">
                <h3 className="form-section__title">
                  <i className="fas fa-info-circle"></i> Informations du livre
                </h3>

                <div className="form-grid">
                <div className="form-group">
                  <label>Titre *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Auteur</label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label>ISBN</label>
                  <input
                    type="text"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label>Genre</label>
                  <input
                    type="text"
                    name="genre"
                    value={formData.genre}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label>Éditeur</label>
                  <input
                    type="text"
                    name="editor"
                    value={formData.editor}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label>Date de publication</label>
                  <input
                    type="date"
                    name="publication_date"
                    value={formData.publication_date}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label>Âge minimum</label>
                  <input
                    type="number"
                    name="age_limit"
                    value={formData.age_limit}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group">
                  <label>Série</label>
                  <input
                    type="text"
                    name="series"
                    value={formData.series}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="form-group form-group--full">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                  />
                </div>
              </div>
              </div>
              
              <div className="modal__actions">
                <button type="submit" className="btn btn--primary">
                  <i className="fas fa-save"></i> Enregistrer
                </button>
                <button 
                  type="button" 
                  className="btn btn--secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default () => (
    <BooksManagement />);