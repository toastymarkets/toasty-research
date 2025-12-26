import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useDataChip } from '../../context/DataChipContext';

export default function SelectableData({
  value,
  label,
  source,
  type = 'default',
  children,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { insertDataChip, isAvailable } = useDataChip();

  // Don't show button if context is not available (e.g., in standalone view)
  if (!isAvailable) {
    return children;
  }

  const handleInsert = (e) => {
    e.stopPropagation();
    e.preventDefault();

    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    insertDataChip({
      value,
      label,
      source,
      timestamp,
      type,
    });
  };

  return (
    <span
      className="selectable-data"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      {isHovered && (
        <button
          onClick={handleInsert}
          className="selectable-data-btn"
          title={`Add "${value}" to notes`}
          type="button"
        >
          <Plus size={10} strokeWidth={3} />
        </button>
      )}
    </span>
  );
}
