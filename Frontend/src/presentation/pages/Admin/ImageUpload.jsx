/**
 * Composant ImageUpload - Upload d'images sécurisé avec validation
 * Gère : vignettes et images de détail de livres
 */
import React, { useState, useRef } from 'react';
import './ImageUpload.css';

const ImageUpload = ({ 
  name, 
  label, 
  currentImage, 
  onImageChange, 
  maxSize = 5, // Mo
  aspectRatio = null, // Ex: 2/3 pour vignette
  required = false 
}) => {
  const [preview, setPreview] = useState(currentImage || null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // ========================================
  // VALIDATION DE SÉCURITÉ
  // ========================================
  
  /**
   * Valide le type MIME de l'image
   */
  const validateMimeType = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return allowedTypes.includes(file.type);
  };

  /**
   * Valide l'extension du fichier
   */
  const validateExtension = (filename) => {
    const allowedExtensions = /\.(jpg|jpeg|png|webp)$/i;
    return allowedExtensions.test(filename);
  };

  /**
   * Valide la taille du fichier
   */
  const validateFileSize = (file) => {
    const maxSizeBytes = maxSize * 1024 * 1024; // Convertir Mo en bytes
    return file.size <= maxSizeBytes;
  };

  /**
   * Vérifie que c'est réellement une image (lecture des premiers bytes)
   */
  const validateImageHeader = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arr = new Uint8Array(e.target.result).subarray(0, 4);
        let header = '';
        for (let i = 0; i < arr.length; i++) {
          header += arr[i].toString(16);
        }
        
        // Signatures des formats d'image
        const signatures = {
          '89504e47': 'png',
          'ffd8ffe0': 'jpeg',
          'ffd8ffe1': 'jpeg',
          'ffd8ffe2': 'jpeg',
          '52494646': 'webp', // RIFF (WebP commence par RIFF)
        };
        
        const isValid = Object.keys(signatures).some(sig => header.startsWith(sig));
        resolve(isValid);
      };
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file.slice(0, 4));
    });
  };

  /**
   * Vérifie les dimensions de l'image
   */
  const validateDimensions = (img) => {
    return new Promise((resolve) => {
      // Dimensions minimales
      const MIN_WIDTH = 100;
      const MIN_HEIGHT = 100;
      
      // Dimensions maximales
      const MAX_WIDTH = 4000;
      const MAX_HEIGHT = 4000;
      
      if (img.width < MIN_WIDTH || img.height < MIN_HEIGHT) {
        resolve({ valid: false, error: `Image trop petite (min ${MIN_WIDTH}x${MIN_HEIGHT}px)` });
        return;
      }
      
      if (img.width > MAX_WIDTH || img.height > MAX_HEIGHT) {
        resolve({ valid: false, error: `Image trop grande (max ${MAX_WIDTH}x${MAX_HEIGHT}px)` });
        return;
      }
      
      // Vérifier le ratio si spécifié
      if (aspectRatio) {
        const imageRatio = img.width / img.height;
        const expectedRatio = aspectRatio;
        const tolerance = 0.1; // 10% de tolérance
        
        if (Math.abs(imageRatio - expectedRatio) > tolerance) {
          resolve({ 
            valid: false, 
            error: `Ratio incorrect (attendu ${expectedRatio.toFixed(2)}, reçu ${imageRatio.toFixed(2)})` 
          });
          return;
        }
      }
      
      resolve({ valid: true });
    });
  };

  // ========================================
  // GESTION DE L'UPLOAD
  // ========================================
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    
    if (!file) return;
    
    setError('');
    setIsUploading(true);
    
    try {
      // 1. Valider le type MIME
      if (!validateMimeType(file)) {
        throw new Error('Format non supporté. Utilisez JPG, PNG ou WebP.');
      }
      
      // 2. Valider l'extension
      if (!validateExtension(file.name)) {
        throw new Error('Extension de fichier non autorisée.');
      }
      
      // 3. Valider la taille
      if (!validateFileSize(file)) {
        throw new Error(`Fichier trop volumineux (max ${maxSize}Mo).`);
      }
      
      // 4. Vérifier la signature du fichier
      const isValidImage = await validateImageHeader(file);
      if (!isValidImage) {
        throw new Error('Le fichier n\'est pas une image valide.');
      }
      
      // 5. Créer un aperçu et valider les dimensions
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
          // Valider les dimensions
          const dimensionCheck = await validateDimensions(img);
          if (!dimensionCheck.valid) {
            setError(dimensionCheck.error);
            setIsUploading(false);
            return;
          }
          
          // Tout est OK - Afficher l'aperçu
          setPreview(e.target.result);
          
          // Convertir en base64 pour l'envoi
          onImageChange(name, e.target.result);
          setIsUploading(false);
        };
        img.onerror = () => {
          setError('Erreur lors du chargement de l\'image.');
          setIsUploading(false);
        };
        img.src = e.target.result;
      };
      reader.onerror = () => {
        setError('Erreur lors de la lecture du fichier.');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
      
    } catch (err) {
      setError(err.message);
      setPreview(null);
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError('');
    onImageChange(name, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="image-upload">
      <label className="image-upload__label">
        {label} {required && <span className="required">*</span>}
      </label>
      
      <div className="image-upload__container">
        {/* Zone de preview */}
        {preview ? (
          <div className="image-upload__preview">
            <img src={preview} alt="Preview" />
            <div className="image-upload__overlay">
              <button 
                type="button" 
                className="image-upload__btn image-upload__btn--change"
                onClick={handleClick}
              >
                <i className="fas fa-edit"></i> Changer
              </button>
              <button 
                type="button" 
                className="image-upload__btn image-upload__btn--remove"
                onClick={handleRemove}
              >
                <i className="fas fa-trash"></i> Supprimer
              </button>
            </div>
          </div>
        ) : (
          <div className="image-upload__dropzone" onClick={handleClick}>
            <i className="fas fa-cloud-upload-alt"></i>
            <p>Cliquez pour uploader une image</p>
            <small>JPG, PNG ou WebP - Max {maxSize}Mo</small>
            {aspectRatio && (
              <small>Ratio recommandé : {aspectRatio.toFixed(2)}</small>
            )}
          </div>
        )}
        
        {/* Input file caché */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
      
      {/* Indicateur de chargement */}
      {isUploading && (
        <div className="image-upload__loading">
          <i className="fas fa-spinner fa-spin"></i> Validation en cours...
        </div>
      )}
      
      {/* Message d'erreur */}
      {error && (
        <div className="image-upload__error">
          <i className="fas fa-exclamation-triangle"></i> {error}
        </div>
      )}
      
      {/* Aide */}
      <div className="image-upload__help">
        <small>
          <i className="fas fa-info-circle"></i> Formats acceptés : JPEG, PNG, WebP | 
          Taille max : {maxSize}Mo
        </small>
      </div>
    </div>
  );
};

export default ImageUpload;
