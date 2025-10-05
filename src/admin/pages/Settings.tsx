
// src/admin/pages/Settings.tsx
import React from 'react';

export default function Settings() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Paramètres</h1>
        <p className="text-sm text-zinc-500">Sécurité, maintenance, feature flags</p>
      </div>
      <div className="rounded-2xl border p-4 bg-white dark:bg-zinc-900 space-y-3">
        <label className="flex items-center justify-between rounded-xl border px-3 py-2">
          <span>Activer le mode maintenance</span>
          <input type="checkbox" />
        </label>
        <div className="grid md:grid-cols-2 gap-3">
          <label className="flex items-center justify-between rounded-xl border px-3 py-2">
            <span>Feature: Contributions</span>
            <input type="checkbox" defaultChecked />
          </label>
          <label className="flex items-center justify-between rounded-xl border px-3 py-2">
            <span>Feature: Breeding Pro</span>
            <input type="checkbox" defaultChecked />
          </label>
          <label className="flex items-center justify-between rounded-xl border px-3 py-2">
            <span>Feature: Coupons</span>
            <input type="checkbox" />
          </label>
          <label className="flex items-center justify-between rounded-xl border px-3 py-2">
            <span>Exiger 2FA pour les rôles admin</span>
            <input type="checkbox" defaultChecked />
          </label>
        </div>
      </div>
    </div>
  );
}
