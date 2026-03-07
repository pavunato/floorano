'use client';

import { FloorNode } from '@/lib/dsl/types';
import { useI18n } from '@/lib/i18n';

interface Props {
  floors: FloorNode[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export default function FloorTabs({ floors, activeIndex, onSelect }: Props) {
  const { t } = useI18n();
  if (floors.length <= 1) return null;

  return (
    <div className="flex gap-1 px-4 py-2 border-b" style={{ backgroundColor: '#f5f0e8', borderColor: '#d4cfc8' }}>
      {floors.map((floor, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className="px-3 py-1.5 text-xs font-mono rounded-sm transition-colors"
          style={{
            backgroundColor: i === activeIndex ? '#1a1614' : 'transparent',
            color: i === activeIndex ? '#fdfaf4' : '#5c5048',
            letterSpacing: '1px',
          }}
        >
          {floor.label || floor.name.toUpperCase()}
        </button>
      ))}
      <button
        onClick={() => onSelect(-1)}
        className="px-3 py-1.5 text-xs font-mono rounded-sm transition-colors ml-auto"
        style={{
          backgroundColor: activeIndex === -1 ? '#1a1614' : 'transparent',
          color: activeIndex === -1 ? '#fdfaf4' : '#5c5048',
          letterSpacing: '1px',
        }}
      >
        {t.allFloors}
      </button>
    </div>
  );
}
