
// src/admin/pages/Taxonomy.tsx
import React, { useMemo, useState } from 'react';
import { listTaxonomy, upsertTaxonomy } from '../api/mock';
import { TaxonomyItem } from '../types';
import { Plus } from 'lucide-react';

export default function Taxonomy() {
  const [items, setItems] = useState<TaxonomyItem[]>(() => listTaxonomy());
  const [filter, setFilter] = useState('');
  const filtered = useMemo(() => items.filter(i => i.name.toLowerCase().includes(filter.toLowerCase())), [items, filter]);

  const add = () => {
    const name = prompt('Nom ?');
    if (!name) return;
    const kind = (prompt('Type (species|morph|locality|alias) ?') || 'species') as TaxonomyItem['kind'];
    const item: TaxonomyItem = { id: 't' + Date.now(), name, kind, createdAt: new Date().toISOString() };
    upsertTaxonomy(item);
    setItems(listTaxonomy());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Taxonomie</h1>
          <p className="text-sm text-zinc-500">Source de vérité (versionnée)</p>
        </div>
        <button onClick={add} className="px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-2">
          <Plus size={16}/> Ajouter
        </button>
      </div>
      <input placeholder="Filtrer…" value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 rounded-xl border w-full md:w-80" />
      <div className="rounded-2xl border bg-white dark:bg-zinc-900">
        <table className="min-w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Nom</th>
              <th className="px-4 py-2 text-left">MAJ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(i => (
              <tr key={i.id} className="border-b">
                <td className="px-4 py-2">{i.kind}</td>
                <td className="px-4 py-2">{i.name}</td>
                <td className="px-4 py-2">{i.updatedAt || i.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
