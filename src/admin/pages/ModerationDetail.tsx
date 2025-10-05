
// src/admin/pages/ModerationDetail.tsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DiffViewer from '../components/DiffViewer';
import { getContribution, updateContribution } from '../api/mock';

export default function ModerationDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const contrib = id ? getContribution(id) : undefined;
  if (!contrib) return <div>Introuvable</div>;

  const approve = () => { updateContribution(contrib.id, 'approved', 'admin@site.tld'); nav('/admin/moderation'); };
  const reject = () => { updateContribution(contrib.id, 'rejected', 'admin@site.tld'); nav('/admin/moderation'); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{contrib.title}</h1>
          <p className="text-sm text-zinc-500">Type: {contrib.type} • Stake: {contrib.stake} ⟡ • Auteur: {contrib.authorEmail}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={reject} className="px-3 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50">Refuser</button>
          <button onClick={approve} className="px-3 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700">Valider</button>
        </div>
      </div>
      <DiffViewer diff={contrib.diff} />
    </div>
  );
}
