
// src/admin/pages/ModerationQueue.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import SimpleTable from '../components/SimpleTable';
import { listContributions } from '../api/mock';
import { Contribution } from '../types';

export default function ModerationQueue() {
  const rows: Contribution[] = listContributions().filter(c => c.status === 'pending');
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Modération</h1>
          <p className="text-sm text-zinc-500">Propositions en attente</p>
        </div>
      </div>
      <SimpleTable
        rows={rows}
        cols={[
          { key: 'id', header: 'ID' },
          { key: 'type', header: 'Type' },
          { key: 'title', header: 'Titre' },
          { key: 'authorEmail', header: 'Auteur' },
          { key: 'submittedAt', header: 'Soumis le' },
          { key: 'stake', header: 'Stake' },
          { key: 'id', header: 'Action', render: (r) => <Link className="text-indigo-600 hover:underline" to={`/admin/moderation/${r.id}`}>Ouvrir</Link> }
        ]}
      />
    </div>
  );
}
