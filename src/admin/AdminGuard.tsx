
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ALLOWED_ROLES = new Set(['user', 'superadmin','admin','moderator','curator','support','finance','devops']);

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="p-6">Chargement…</div>;
  // if (!user || !ALLOWED_ROLES.has(user.role)) {
  //   return <Navigate to="/auth" replace state={{ from: loc.pathname }} />;
  // }
  return <>{children}</>;
}
