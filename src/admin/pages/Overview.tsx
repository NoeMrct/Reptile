
// src/admin/pages/Overview.tsx
import React from 'react';
import KpiCard from '../components/KpiCard';
import { getKpis } from '../api/mock';

export default function Overview() {
  const kpis = getKpis();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-sm text-zinc-500">Vision instantanée de l’exploitation.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => <KpiCard key={k.label} label={k.label} value={k.value} />)}
      </div>
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
        <h2 className="font-medium mb-2">À faire</h2>
        <ul className="list-disc pl-5 text-sm text-zinc-600 space-y-1">
          <li>Valider les contributions en attente</li>
          <li>Vérifier les tickets Support ouverts</li>
          <li>Auditer les derniers changements sensibles</li>
        </ul>
      </div>
    </div>
  );
}
