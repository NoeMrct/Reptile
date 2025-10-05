
// src/admin/pages/Notifications.tsx
import React, { useState } from 'react';
import { listTemplates, upsertTemplate } from '../api/mock';
import { NotificationTemplate } from '../types';

export default function Notifications() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>(() => listTemplates());

  const save = (tpl: NotificationTemplate) => {
    upsertTemplate(tpl);
    setTemplates(listTemplates());
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <p className="text-sm text-zinc-500">Modèles & tests d’envoi</p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {templates.map(t => (
          <div key={t.id} className="rounded-2xl border p-4 bg-white dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-zinc-500">{t.channel} • MAJ {t.updatedAt}</div>
              </div>
              <button className="px-3 py-2 rounded-xl border">Envoyer un test</button>
            </div>
            {t.channel === 'email' && (
              <input className="mt-3 w-full px-3 py-2 rounded-xl border" defaultValue={t.subject || ''} placeholder="Sujet" onBlur={(e) => save({ ...t, subject: e.target.value })} />
            )}
            <textarea className="mt-3 w-full min-h-[120px] px-3 py-2 rounded-xl border" defaultValue={t.body} onBlur={(e) => save({ ...t, body: e.target.value })} />
            <div className="text-xs text-zinc-500 mt-2">Variables: {t.variables.join(', ')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
