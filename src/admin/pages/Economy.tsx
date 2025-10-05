
// src/admin/pages/Economy.tsx
import React from 'react';
import { listLedger } from '../api/mock';

export default function Economy() {
  const page = listLedger(1, 20);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Économie (Écailles)</h1>
        <p className="text-sm text-zinc-500">Règles & Ledger</p>
      </div>
      <div className="rounded-2xl border p-4 bg-white dark:bg-zinc-900">
        <h2 className="font-medium mb-2">Règles</h2>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <label className="flex items-center justify-between rounded-xl border px-3 py-2">
            <span>Stake à la soumission</span>
            <input type="number" defaultValue={10} className="w-24 text-right outline-none" />
          </label>
          <label className="flex items-center justify-between rounded-xl border px-3 py-2">
            <span>Récompense (espèce validée)</span>
            <input type="number" defaultValue={120} className="w-24 text-right outline-none" />
          </label>
          <label className="flex items-center justify-between rounded-xl border px-3 py-2">
            <span>Récompense (morph/localité)</span>
            <input type="number" defaultValue={80} className="w-24 text-right outline-none" />
          </label>
          <label className="flex items-center justify-between rounded-xl border px-3 py-2">
            <span>Plafond journalier</span>
            <input type="number" defaultValue={500} className="w-24 text-right outline-none" />
          </label>
        </div>
      </div>
      <div className="rounded-2xl border overflow-hidden bg-white dark:bg-zinc-900">
        <table className="min-w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Utilisateur</th>
              <th className="px-4 py-2 text-left">Changement</th>
              <th className="px-4 py-2 text-left">Raison</th>
              <th className="px-4 py-2 text-left">Par</th>
            </tr>
          </thead>
          <tbody>
            {page.items.map(l => (
              <tr key={l.id} className="border-b">
                <td className="px-4 py-2">{l.at}</td>
                <td className="px-4 py-2">{l.userEmail}</td>
                <td className="px-4 py-2">{l.change > 0 ? '+' : ''}{l.change} ⟡</td>
                <td className="px-4 py-2">{l.reason}</td>
                <td className="px-4 py-2">{l.by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
