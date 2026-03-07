'use client';

import { ParseError, DiagnosticMessage } from '@/lib/dsl/errors';
import { useI18n } from '@/lib/i18n';

interface Props {
  errors: ParseError[];
  warnings?: DiagnosticMessage[];
}

export default function ErrorPanel({ errors, warnings = [] }: Props) {
  const { t } = useI18n();
  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <div className="border-t px-4 py-2 max-h-32 overflow-auto" style={{ backgroundColor: errors.length > 0 ? '#fff3cd' : '#fefce8', borderColor: errors.length > 0 ? '#ffc107' : '#d97706' }}>
      {errors.length > 0 && (
        <>
          <div className="text-xs font-mono font-medium mb-1" style={{ color: '#856404' }}>
            {errors.length} {t.errors}{errors.length > 1 ? 's' : ''}
          </div>
          {errors.map((err, i) => (
            <div key={`e${i}`} className="text-xs font-mono flex items-center gap-1.5" style={{ color: '#856404' }}>
              <span style={{ color: '#dc2626' }}>{'\u25CF'}</span>
              {t.line} {err.line}:{err.col} — {err.message}
            </div>
          ))}
        </>
      )}
      {warnings.length > 0 && (
        <>
          <div className="text-xs font-mono font-medium mb-1" style={{ color: '#92400e', marginTop: errors.length > 0 ? '4px' : 0 }}>
            {warnings.length} {t.warnings}{warnings.length > 1 ? 's' : ''}
          </div>
          {warnings.map((w, i) => (
            <div key={`w${i}`} className="text-xs font-mono flex items-center gap-1.5" style={{ color: '#92400e' }}>
              <span>{'\u26A0'}</span>
              {t.line} {w.line}:{w.col} — {w.message}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
