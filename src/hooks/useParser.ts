'use client';

import { useState, useEffect, useRef } from 'react';
import { parse } from '@/lib/dsl/parser';
import { PlanNode } from '@/lib/dsl/types';
import { ParseError, DiagnosticMessage } from '@/lib/dsl/errors';
import { validateAll, OverlapRegion } from '@/lib/dsl/validate';

interface ParseResult {
  ast: PlanNode | null;
  errors: ParseError[];
  warnings: DiagnosticMessage[];
  overlaps: OverlapRegion[];
}

export function useParser(source: string, debounceMs: number = 300): ParseResult {
  const [result, setResult] = useState<ParseResult>({ ast: null, errors: [], warnings: [], overlaps: [] });
  const lastValidAstRef = useRef<PlanNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      try {
        const parsed = parse(source);
        if (parsed.ast) {
          lastValidAstRef.current = parsed.ast;
          const { warnings, overlaps } = validateAll(parsed.ast);
          setResult({ ...parsed, warnings, overlaps });
        } else {
          // Parse errors — keep showing the last valid AST in the preview
          setResult({ ast: lastValidAstRef.current, errors: parsed.errors, warnings: [], overlaps: [] });
        }
      } catch {
        setResult({ 
          ast: lastValidAstRef.current, 
          errors: [new ParseError('Parse error', 1, 1)], 
          warnings: [], 
          overlaps: [] 
        });
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [source, debounceMs]);

  return result;
}
