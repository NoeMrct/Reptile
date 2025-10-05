
// src/admin/pages/UsersList.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import SimpleTable from '../components/SimpleTable';
import { listUsers } from '../api/mock';
import { AdminUser } from '../types';

export default function UsersList() {
  const rows: AdminUser[] = listUsers();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Utilisateurs</h1>
        <p className="text-sm text-zinc-500">Gestion des comptes et rôles</p>
      </div>
      <SimpleTable
        rows={rows}
        cols={[
          { key: 'email', header: 'Email' },
          { key: 'displayName', header: 'Nom' },
          { key: 'role', header: 'Rôle' },
          { key: 'status', header: 'Statut' },
          { key: 'createdAt', header: 'Créé le' },
          { key: 'id', header: 'Action', render: (r) => <Link className="text-indigo-600 hover:underline" to={`/admin/users/${r.id}`}>Ouvrir</Link> }
        ]}
      />
    </div>
  );
}
