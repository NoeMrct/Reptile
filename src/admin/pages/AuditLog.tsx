
// src/admin/pages/AuditLog.tsx
import React from 'react';
import { listAudit } from '../api/mock';

export default function AuditLog() {
  const page = listAudit(1, 50);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Journal d’audit</h1>
        <p className="text-sm text-zinc-500">Qui a fait quoi, quand</p>
      </div>
      <div className="rounded-2xl border overflow-hidden bg-white dark:bg-zinc-900">
        <table className="min-w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Acteur</th>
              <th className="px-4 py-2 text-left">Action</th>
              <th className="px-4 py-2 text-left">Cible</th>
              <th className="px-4 py-2 text-left">Détails</th>
            </tr>
          </thead>
          <tbody>
            {page.items.map(a => (
              <tr key={a.id} className="border-b">
                <td className="px-4 py-2">{a.at}</td>
                <td className="px-4 py-2">{a.actor}</td>
                <td className="px-4 py-2">{a.action}</td>
                <td className="px-4 py-2">{a.target || '-'}</td>
                <td className="px-4 py-2">{a.meta ? JSON.stringify(a.meta) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
