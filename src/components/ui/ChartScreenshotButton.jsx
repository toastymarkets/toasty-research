/**
 * ChartScreenshotButton
 *
 * A camera button that appears on hover over charts.
 * Clicking captures the chart and adds it to the notes sidebar.
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Camera, Check } from 'lucide-react';
import { captureAndInsertChart } from '../../utils/chartScreenshot';

export default function ChartScreenshotButton({ chartRef, caption = '' }) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [justCaptured, setJustCaptured] = useState(false);

  const handleCapture = async (e) => {
    e.stopPropagation(); // Prevent triggering parent click handlers

    if (!chartRef?.current || isCapturing) return;

    setIsCapturing(true);

    try {
      await captureAndInsertChart(chartRef.current, caption);
      setJustCaptured(true);

      // Reset the checkmark after 2 seconds
      setTimeout(() => setJustCaptured(false), 2000);
    } catch (error) {
      console.error('Failed to capture chart:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <button
      onClick={handleCapture}
      disabled={isCapturing}
      className={`
        absolute top-2 right-2 z-10
        p-2 rounded-full
        transition-all duration-200
        ${justCaptured
          ? 'bg-green-500/80 text-white'
          : 'bg-black/40 text-white/60 hover:text-white hover:bg-black/60'
        }
        ${isCapturing ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
        opacity-0 group-hover:opacity-100
      `}
      title="Add chart to notes"
    >
      {isCapturing ? (
        <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
      ) : justCaptured ? (
        <Check className="w-4 h-4" />
      ) : (
        <Camera className="w-4 h-4" />
      )}
    </button>
  );
}

ChartScreenshotButton.propTypes = {
  chartRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  caption: PropTypes.string,
};
