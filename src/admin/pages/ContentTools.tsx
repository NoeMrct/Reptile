
// src/admin/pages/ContentTools.tsx
import React from 'react';

export default function ContentTools() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Contenu</h1>
        <p className="text-sm text-zinc-500">Actions en masse, imports/exports</p>
      </div>
      <div className="rounded-2xl border p-4 bg-white dark:bg-zinc-900">
        <div className="grid md:grid-cols-2 gap-3">
          <button className="px-3 py-2 rounded-xl border">Importer CSV (serpents)</button>
          <button className="px-3 py-2 rounded-xl border">Importer CSV (événements)</button>
          <button className="px-3 py-2 rounded-xl border">Exporter JSON (tous les serpents)</button>
          <button className="px-3 py-2 rounded-xl border">Archiver images orphelines</button>
        </div>
      </div>
    </div>
  );
}
