import { useState, useRef, useCallback } from 'react';

/**
 * Custom Hook: useMediaUpload
 * Manages surface image selection (Front PDP & Back Declarations),
 * drag-and-drop interactions, and file input management.
 */
export function useMediaUpload({ onMediaChanged, onMediaCleared, showToast } = {}) {
  const [frontImage, setFrontImage] = useState({
    name: '',
    url: null,
    loaded: false,
    file: null
  });

  const [backImage, setBackImage] = useState({
    name: '',
    url: null,
    loaded: false,
    file: null
  });

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const processUploadedFiles = useCallback((files) => {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter(f => f.type?.startsWith('image/'));
    if (validFiles.length === 0) {
      if (showToast) showToast('Please select valid image files (JPG, PNG, WEBP).');
      return;
    }

    if (onMediaChanged) onMediaChanged();

    if (validFiles[0]) {
      setFrontImage({
        name: validFiles[0].name,
        url: URL.createObjectURL(validFiles[0]),
        loaded: true,
        file: validFiles[0]
      });
    }

    if (validFiles[1]) {
      setBackImage({
        name: validFiles[1].name,
        url: URL.createObjectURL(validFiles[1]),
        loaded: true,
        file: validFiles[1]
      });
    } else {
      setBackImage({
        name: '',
        url: null,
        loaded: false,
        file: null
      });
    }

    if (showToast) {
      showToast(`${validFiles.length} package image(s) attached. Click 'Analyze Package'.`);
    }
  }, [onMediaChanged, showToast]);

  const handleFilesChosen = useCallback((e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      processUploadedFiles(files);
    }
  }, [processUploadedFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processUploadedFiles(files);
    }
  }, [processUploadedFiles]);

  const handleClearMedia = useCallback(() => {
    setFrontImage({ name: '', url: null, loaded: false, file: null });
    setBackImage({ name: '', url: null, loaded: false, file: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onMediaCleared) onMediaCleared();
  }, [onMediaCleared]);

  const handleRemoveImage = useCallback((panel) => {
    if (panel === 'front') {
      if (backImage.url || backImage.file) {
        // Shift back panel to front position
        setFrontImage(backImage);
        setBackImage({ name: '', url: null, loaded: false, file: null });
        if (onMediaChanged) onMediaChanged();
      } else {
        // No other images remain, return to clean empty state
        setFrontImage({ name: '', url: null, loaded: false, file: null });
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (onMediaCleared) onMediaCleared();
      }
    } else if (panel === 'back') {
      setBackImage({ name: '', url: null, loaded: false, file: null });
      if (!frontImage.url && !frontImage.file) {
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (onMediaCleared) onMediaCleared();
      } else {
        if (onMediaChanged) onMediaChanged();
      }
    }
  }, [backImage, frontImage, onMediaChanged, onMediaCleared]);

  const handleNewScan = useCallback(() => {
    handleClearMedia();
  }, [handleClearMedia]);

  const hasMedia = Boolean(frontImage.url || frontImage.file || backImage.url || backImage.file);

  return {
    frontImage,
    setFrontImage,
    backImage,
    setBackImage,
    isDragging,
    fileInputRef,
    hasMedia,
    processUploadedFiles,
    handleFilesChosen,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleClearMedia,
    handleRemoveImage,
    handleNewScan
  };
}

export default useMediaUpload;
