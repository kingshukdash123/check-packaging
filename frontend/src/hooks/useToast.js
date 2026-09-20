import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom Hook: useToast
 * Manages floating toast alert message, visibility, and auto-dismiss timer.
 */
export function useToast(duration = 3200) {
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((msg) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    setIsToastVisible(true);
    toastTimeoutRef.current = setTimeout(() => {
      setIsToastVisible(false);
    }, duration);
  }, [duration]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  return {
    toastMessage,
    isToastVisible,
    showToast
  };
}

export default useToast;
