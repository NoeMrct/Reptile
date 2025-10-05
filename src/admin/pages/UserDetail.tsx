
// src/admin/pages/UserDetail.tsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { getUser, updateUserStatus } from '../api/mock';
import { AdminUser } from '../types';

export default function UserDetail() {
  const { id } = useParams();
  const [user, setUser] = useState<AdminUser | undefined>(() => id ? getUser(id) : undefined);
  if (!user) return <div>Introuvable</div>;

  const onChangeStatus = (status: AdminUser['status']) => {
    updateUserStatus(user.id, status);
    setUser({ ...user, status });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{user.displayName}</h1>
          <div className="text-sm text-zinc-500">{user.email} • Rôle: {user.role}</div>
        </div>
        <div className="flex gap-2">
          <select value={user.status} onChange={(e) => onChangeStatus(e.target.value as AdminUser['status'])} className="px-3 py-2 rounded-xl border">
            <option value="active">Actif</option>
            <option value="suspended">Suspendu</option>
            <option value="pending">En attente</option>
          </select>
          <button className="px-3 py-2 rounded-xl border">Reset 2FA</button>
          <button className="px-3 py-2 rounded-xl border">Force logout</button>
        </div>
      </div>
      <div className="rounded-2xl border p-4 bg-white dark:bg-zinc-900">
        <h2 className="font-medium mb-2">Notes internes</h2>
        <textarea className="w-full min-h-[120px] rounded-xl border p-3" placeholder="Ajouter une note…" defaultValue={user.notes || ''} />
      </div>
    </div>
  );
}
