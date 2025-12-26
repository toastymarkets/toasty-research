import { NodeViewWrapper } from '@tiptap/react';

const TYPE_COLORS = {
  temperature: 'bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400',
  forecast: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
  market: 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400',
  humidity: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400',
  wind: 'bg-teal-500/10 text-teal-600 border-teal-500/20 dark:text-teal-400',
  pressure: 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400',
  default: 'bg-gray-500/10 text-gray-600 border-gray-500/20 dark:text-gray-400',
};

export default function DataChipComponent({ node }) {
  const { value, source, timestamp, type } = node.attrs;
  const colorClasses = TYPE_COLORS[type] || TYPE_COLORS.default;

  return (
    <NodeViewWrapper as="span" className="data-chip-wrapper">
      <span className={`data-chip ${colorClasses}`}>
        <span className="data-chip-value">{value}</span>
        <span className="data-chip-meta">{source} • {timestamp}</span>
      </span>
    </NodeViewWrapper>
  );
}
