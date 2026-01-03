/**
 * Chart Screenshot Utility
 *
 * Captures chart elements as images and inserts them into the notepad.
 */

import { NOTE_INSERTION_EVENT } from './noteInsertionEvents';

/**
 * Capture a chart element as a screenshot
 * @param {HTMLElement} chartElement - The DOM element to capture
 * @param {Object} options - Configuration options
 * @returns {Promise<string>} Base64 data URL of the image
 */
export async function captureChartScreenshot(chartElement, options = {}) {
  const {
    backgroundColor = '#1a1a2e', // Match dark theme
    scale = 2, // Higher quality
  } = options;

  // Dynamic import to reduce initial bundle size (~50-100 KB savings)
  const html2canvas = (await import('html2canvas')).default;

  const canvas = await html2canvas(chartElement, {
    backgroundColor,
    scale,
    logging: false,
    useCORS: true,
  });

  return canvas.toDataURL('image/png');
}

/**
 * Insert a chart image into the notes sidebar
 * @param {string} dataUrl - Base64 image data URL
 * @param {string} caption - Optional caption for the image
 */
export function insertChartImageToNotes(dataUrl, caption = '') {
  const content = [
    { type: 'paragraph' },
    { type: 'image', attrs: { src: dataUrl, alt: caption || 'Chart screenshot' } },
  ];

  // Add caption if provided
  if (caption) {
    content.push({
      type: 'paragraph',
      content: [
        { type: 'text', marks: [{ type: 'italic' }], text: caption },
      ],
    });
  }

  content.push({ type: 'paragraph' });

  const event = new CustomEvent(NOTE_INSERTION_EVENT, {
    detail: {
      type: 'chartImage',
      content: {
        type: 'doc',
        content,
      },
    },
  });

  window.dispatchEvent(event);
}

/**
 * Capture and insert a chart in one step
 * @param {HTMLElement} chartElement - The DOM element to capture
 * @param {string} caption - Optional caption
 */
export async function captureAndInsertChart(chartElement, caption = '') {
  const dataUrl = await captureChartScreenshot(chartElement);
  insertChartImageToNotes(dataUrl, caption);
}
