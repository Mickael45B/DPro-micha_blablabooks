import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy,
  arrayMove 
} from '@dnd-kit/sortable';
import MainLayout from '../../../components/layout/MainLayout/mainLayout.jsx';
import LibraryCard from '../../../components/features/Library/LibraryCard.jsx';
import BookCardDraggable from '../../../components/features/Library/BookCardDraggable.jsx';
import LibraryModal from '../../../components/features/Library/LibraryModal.jsx';
import ContextualMenuLibraries from '../../../components/features/Library/ContextualMenuLibraries.jsx';
import {
  GET_MY_LIBRARIES,
  GET_BOOKS_IN_LIBRARY,
  CREATE_LIBRARY,
  UPDATE_LIBRARY,
  DELETE_LIBRARY,
  MOVE_BOOK_TO_LIBRARY,
  REORDER_LIBRARIES,
  REORDER_BOOKS_IN_LIBRARY
} from '../../../../data/graphql/queries/libraryQueries.jsx';
import './UserLibraryPage.css';

const LibrariesPage = () => {
  // ========================================
  // ÉTATS
  // ========================================
  const [selectedLibrary, setSelectedLibrary] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // create | edit
  const [editingLibrary, setEditingLibrary] = useState(null);
  const [activeBookId, setActiveBookId] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    reading_status: null,
    is_favorite: null,
    sort_field: 'position',
    sort_direction: 'ASC'
  });

  // ========================================
  // QUERIES
  // ========================================
  
  const { data: librariesData, loading: librariesLoading, refetch: refetchLibraries } = useQuery(GET_MY_LIBRARIES, {
    variables: {
      filter: {
        sort_field: 'sort_order',
        sort_direction: 'ASC'
      }
    }
  });

  const { 
    data: booksData, 
    loading: booksLoading, 
    refetch: refetchBooks 
  } = useQuery(GET_BOOKS_IN_LIBRARY, {
    variables: {
      id_library: selectedLibrary?.id_library,
      filter: filters
    },
    skip: !selectedLibrary
  });

  // ========================================
  // MUTATIONS
  // ========================================
  
  const [createLibrary] = useMutation(CREATE_LIBRARY, {
    onCompleted: () => {
      refetchLibraries();
      setShowModal(false);
    }
  });

  const [updateLibrary] = useMutation(UPDATE_LIBRARY, {
    onCompleted: () => {
      refetchLibraries();
      setShowModal(false);
    }
  });

  const [deleteLibrary] = useMutation(DELETE_LIBRARY, {
    onCompleted: () => {
      refetchLibraries();
      if (selectedLibrary) {
        setSelectedLibrary(null);
      }
    }
  });

  const [moveBook] = useMutation(MOVE_BOOK_TO_LIBRARY, {
    onCompleted: () => {
      refetchBooks();
      refetchLibraries();
    },
    onError: (error) => {
      alert(error.message);
    }
  });

  const [reorderLibraries] = useMutation(REORDER_LIBRARIES, {
    onCompleted: () => {
      refetchLibraries();
    }
  });

  const [reorderBooksInLibrary] = useMutation(REORDER_BOOKS_IN_LIBRARY, {
    onCompleted: () => {
      refetchBooks();
    },
    onError: (error) => {
      alert(error.message);
    }
  });

  // ========================================
  // DATA MEMOIZED
  // ========================================
  
  const libraries = useMemo(() => {
    return librariesData?.getMyLibraries || [];
  }, [librariesData]);

  const books = useMemo(() => {
    return booksData?.getBooksInLibrary || [];
  }, [booksData]);

  const activeBook = useMemo(() => {
    return books.find(b => b.id_book === activeBookId);
  }, [books, activeBookId]);

  // ========================================
  // HANDLERS
  // ========================================

  const handleCreateLibrary = (data) => {
    createLibrary({
      variables: {
        input: data
      }
    });
  };

  const handleUpdateLibrary = (data) => {
    updateLibrary({
      variables: {
        input: {
          id_library: editingLibrary.id_library,
          ...data
        }
      }
    });
  };

  const handleDeleteLibrary = (id_library) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette bibliothèque ?')) {
      deleteLibrary({
        variables: { id_library }
      });
    }
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingLibrary(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (library) => {
    setModalMode('edit');
    setEditingLibrary(library);
    setShowModal(true);
  };

  const handleSelectLibrary = (library) => {
    setSelectedLibrary(library);
  };

  const handleDragStart = (event) => {
    /*console.log('🟢 handleDragStart called:', {
      activeId: event?.active?.id,
      activeType: event?.active?.data?.current?.type,
      activeData: event?.active?.data?.current
    });*/
    const activeType = event?.active?.data?.current?.type;
    if (activeType === 'book') {
      setActiveBookId(event.active.id);
    } else {
      setActiveBookId(null);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    /*console.log('🟣 handleDragEnd called:', {
      activeId: active?.id,
      activeType: active?.data?.current?.type,
      overId: over?.id,
      overData: over?.data?.current
    });*/
    
    setActiveBookId(null);

    if (!over) return;

    const activeType = active?.data?.current?.type;
    const overType = over?.data?.current?.type;

    // Réorganisation des bibliothèques
    if (activeType === 'library' && over.id.startsWith('library-')) {
      if (active.id === over.id) return;

      const oldIndex = libraries.findIndex(lib => `library-${lib.id_library}` === active.id);
      const newIndex = libraries.findIndex(lib => `library-${lib.id_library}` === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(libraries, oldIndex, newIndex);
      handleLibrariesReorder(newOrder);
      return;
    }

    // Réorganisation des livres dans la même bibliothèque
    if (activeType === 'book' && overType === 'book' && selectedLibrary) {
      if (active.id === over.id) return;

      const oldIndex = books.findIndex(b => b.id_book === active.id);
      const newIndex = books.findIndex(b => b.id_book === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newOrder = arrayMove(books, oldIndex, newIndex);
      handleBooksReorder(newOrder);
      return;
    }

    // Si on drop sur une bibliothèque, déplacer le livre vers cette bibliothèque
    if (over.id.startsWith('library-') && activeType === 'book') {
      const targetLibraryId = over.id.replace('library-', '');
      const bookId = active.id;
      const fromLibraryId = active?.data?.current?.BookHasLibrary?.id_library || selectedLibrary?.id_library;
      
      /*console.log('🎯 Drag & Drop:', {
        bookId,
        from: fromLibraryId,
        to: targetLibraryId,
        isSameLibrary: targetLibraryId === fromLibraryId
      });*/
      
      if (fromLibraryId && targetLibraryId !== fromLibraryId) {
        /*console.log('📤 Calling moveBook mutation with:', {
          id_book: bookId,
          from_library_id: fromLibraryId,
          to_library_id: targetLibraryId
        });*/
        
        moveBook({
          variables: {
            input: {
              id_book: bookId,
              from_library_id: fromLibraryId,
              to_library_id: targetLibraryId
            }
          }
        });
      }
    }
  };

  const handleLibrariesReorder = (newOrder) => {
    const libraryIds = newOrder.map(lib => lib.id_library);
    reorderLibraries({
      variables: { library_ids: libraryIds }
    });
  };

  const handleBooksReorder = (newOrder) => {
    if (!selectedLibrary) return;
    
    const bookIds = newOrder.map(b => b.id_book);
    //console.log('📚 Reordering books:', { libraryId: selectedLibrary.id_library, bookIds });
    
    reorderBooksInLibrary({
      variables: { 
        id_library: selectedLibrary.id_library,
        book_ids: bookIds 
      }
    });
  };

  // ========================================
  // MENU CONTEXTUEL
  // ========================================
  
  const contextualMenu = (
    <ContextualMenuLibraries
      libraries={libraries}
      selectedLibrary={selectedLibrary}
      filters={filters}
      onFilterChange={setFilters}
      onCreateLibrary={handleOpenCreateModal}
    />
  );

  // ========================================
  // RENDER
  // ========================================

  if (librariesLoading) {
    return (
      <MainLayout contextualMenu={contextualMenu}>
        <div className="libraries-page__loading">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Chargement de vos bibliothèques...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <>
    {/* <MainLayout  
      contextualMenu={contextualMenu}
      showSearch={false}
    >*/}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="libraries-page">
          {/* Header avec actions */}
          <div className="libraries-page__header">
            <h1 className="libraries-page__title">
              <i className="fas fa-book-reader"></i>
              Mes Bibliothèques
            </h1>
            
          </div>

          {/* Grille des bibliothèques */}
          <div className="libraries-grid">
            <SortableContext
              items={libraries.map(lib => `library-${lib.id_library}`)}
              strategy={verticalListSortingStrategy}
            >
              {libraries.map((library) => (
                <LibraryCard
                  key={library.id_library}
                  library={library}
                  isSelected={selectedLibrary?.id_library === library.id_library}
                  onSelect={() => handleSelectLibrary(library)}
                  onEdit={() => handleOpenEditModal(library)}
                  onDelete={() => handleDeleteLibrary(library.id_library)}
                />
              ))}
            </SortableContext>
          </div>

          <div className="libraries-page__actions">
            <button 
              className="btn-view-mode"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              title={viewMode === 'grid' ? 'Vue liste' : 'Vue grille'}
            >
              <i className={`fas fa-${viewMode === 'grid' ? 'list' : 'th'}`}></i>
            </button>
            
            <button 
              className="btn-create"
              onClick={handleOpenCreateModal}
            >
              <i className="fas fa-plus"></i>
              Nouvelle bibliothèque
            </button>
          </div>

          {/* Zone de contenu : livres de la bibliothèque sélectionnée */}
          {selectedLibrary && (
            <div className="library-content">
              <div className="library-content__header">
                <h2>
                  <span style={{ color: selectedLibrary.color }}>● </span>
                  {selectedLibrary.name}
                  <span className="book-count">
                    {' '}( {books.length} {books.length > 1 ? ' livres ' : ' livre '} )
                  </span>
                </h2>
                
                {selectedLibrary.description && (
                  <p className="library-description">{selectedLibrary.description}</p>
                )}
              </div>

              {booksLoading ? (
                <div className="library-content__loading">
                  <i className="fas fa-spinner fa-spin"></i>
                </div>
              ) : books.length === 0 ? (
                <div className="library-content__empty">
                  <i className="fas fa-book-open"></i>
                  <p>Cette bibliothèque est vide</p>
                  <p className="hint">Ajoutez des livres depuis le catalogue</p>
                </div>
              ) : (
                <div className={`books-${viewMode}`}>
                  {books.map((BookHasLibrary) => (
                    <BookCardDraggable
                      key={BookHasLibrary.id_bookhaslibrary}
                      BookHasLibrary={BookHasLibrary}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {!selectedLibrary && (
            <div className="no-selection">
              <i className="fas fa-hand-pointer"></i>
              <p>Sélectionnez une bibliothèque pour voir son contenu</p>
            </div>
          )}
          
        </div>

        {/* Overlay pour le drag & drop */}
        <DragOverlay>
          {activeBook ? (
            <div className="book-drag-overlay">
              <img 
                src={`/images/vignettesImages/${activeBook.book.vignetteimage}`}
                alt={activeBook.book.title}
              />
              <span>{activeBook.book.title}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modal création/édition */}
      {showModal && (
        <LibraryModal
          mode={modalMode}
          library={editingLibrary}
          onSubmit={modalMode === 'create' ? handleCreateLibrary : handleUpdateLibrary}
          onClose={() => setShowModal(false)}
        />
      )}
    {/* </MainLayout> */}
    </>
  );
};

export default LibrariesPage;
