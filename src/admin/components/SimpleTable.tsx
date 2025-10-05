
// src/admin/components/SimpleTable.tsx
import React from 'react';

type Col<T> = { key: keyof T; header: string; render?: (row: T) => React.ReactNode; width?: string };

export default function SimpleTable<T extends { id: string }>(
  { rows, cols }: { rows: T[]; cols: Col<T>[] }
) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <table className="min-w-full text-sm">
        <thead className="text-left border-b border-zinc-200 dark:border-zinc-800">
          <tr>
            {cols.map((c) => (
              <th key={String(c.key)} className="px-4 py-2 font-medium" style={{ width: c.width }}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-800">
              {cols.map((c) => (
                <td key={String(c.key)} className="px-4 py-2">
                  {c.render ? c.render(r) : String(r[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
