
// src/admin/components/AdminLayout.tsx
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Settings, Users, ShieldCheck, Workflow, Layers, BadgeDollarSign, Mail, Bell, ActivitySquare, ClipboardList } from 'lucide-react';

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition
   ${isActive ? 'bg-zinc-100 dark:bg-zinc-800 font-semibold' : 'text-zinc-700 dark:text-zinc-300'}`;

export default function AdminLayout() {
  return (
    <div className="min-h-screen grid md:grid-cols-[260px_1fr] bg-zinc-50 dark:bg-zinc-950">
      <aside className="hidden md:flex flex-col gap-2 p-3 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="px-2 py-3">
          <div className="text-lg font-bold">Admin</div>
          <div className="text-xs text-zinc-500">Back‑Office</div>
        </div>
        <nav className="flex-1 space-y-1">
          <NavLink to="/admin" end className={linkCls}><ActivitySquare size={16}/> Overview</NavLink>
          <NavLink to="/admin/moderation" className={linkCls}><ShieldCheck size={16}/> Modération</NavLink>
          <NavLink to="/admin/taxonomy" className={linkCls}><Layers size={16}/> Taxonomie</NavLink>
          <NavLink to="/admin/content" className={linkCls}><Workflow size={16}/> Contenu</NavLink>
          <NavLink to="/admin/users" className={linkCls}><Users size={16}/> Utilisateurs</NavLink>
          <NavLink to="/admin/economy" className={linkCls}><BadgeDollarSign size={16}/> Économie</NavLink>
          <NavLink to="/admin/support" className={linkCls}><Mail size={16}/> Support</NavLink>
          <NavLink to="/admin/notifications" className={linkCls}><Bell size={16}/> Notifications</NavLink>
          <NavLink to="/admin/audit" className={linkCls}><ClipboardList size={16}/> Audit</NavLink>
          <NavLink to="/admin/settings" className={linkCls}><Settings size={16}/> Paramètres</NavLink>
        </nav>
        <div className="text-xs text-zinc-400 px-2">© {new Date().getFullYear()}</div>
      </aside>
      <main className="min-h-screen">
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
