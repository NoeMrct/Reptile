
// src/admin/pages/SupportInbox.tsx
import React, { useState } from 'react';
import { listTickets, updateTicket } from '../api/mock';
import { ContactTicket } from '../types';

export default function SupportInbox() {
  const [tickets, setTickets] = useState<ContactTicket[]>(() => listTickets());

  const setStatus = (id: string, status: ContactTicket['status']) => {
    updateTicket(id, { status });
    setTickets(listTickets());
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Support</h1>
        <p className="text-sm text-zinc-500">Messages du formulaire Contact</p>
      </div>
      <div className="space-y-3">
        {tickets.map(t => (
          <div key={t.id} className="rounded-2xl border p-4 bg-white dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{t.subject}</div>
                <div className="text-xs text-zinc-500">{t.fromEmail} • {t.createdAt}</div>
              </div>
              <select value={t.status} onChange={(e) => setStatus(t.id, e.target.value as ContactTicket['status'])} className="px-3 py-2 rounded-xl border">
                <option value="open">Ouvert</option>
                <option value="pending">En attente</option>
                <option value="closed">Fermé</option>
              </select>
            </div>
            <p className="text-sm mt-3 whitespace-pre-wrap">{t.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
