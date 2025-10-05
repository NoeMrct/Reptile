
// src/admin/components/DiffViewer.tsx
import React from 'react';

export default function DiffViewer({ diff }: { diff: string }) {
  return (
    <pre className="bg-zinc-950/90 text-zinc-100 text-xs rounded-xl p-4 overflow-auto max-h-[420px]">
      {diff}
    </pre>
  );
}
