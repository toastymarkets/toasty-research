/**
 * Custom hook for text selection popup functionality
 * Used by both DiscussionModal and ExpandedDiscussionInline
 */

import { useState, useCallback, useEffect } from 'react';

/**
 * Hook to manage text selection popup state and behavior
 * @param {React.RefObject} containerRef - Reference to the container element
 * @param {number} minY - Minimum Y position to avoid header overlap (default: 80)
 * @returns {Object} Selection popup state and handlers
 */
export function useTextSelection(containerRef, minY = 80) {
  const [selectionPopup, setSelectionPopup] = useState(null);

  // Handle text selection
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) {
      setSelectionPopup(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (!containerRect) return;

    // Calculate Y position with minimum offset to avoid header overlap
    const rawY = rect.top - containerRect.top - 10;
    const finalY = Math.max(rawY, minY);

    setSelectionPopup({
      text: selection.toString().trim(),
      x: rect.left + rect.width / 2 - containerRect.left,
      y: finalY,
    });
  }, [containerRef, minY]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectionPopup(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  // Hide popup when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.toString().trim().length === 0) {
          setSelectionPopup(null);
        }
      }, 100);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return {
    selectionPopup,
    handleMouseUp,
    clearSelection,
  };
}
