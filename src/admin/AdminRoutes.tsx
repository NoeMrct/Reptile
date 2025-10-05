
// src/admin/AdminRoutes.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminGuard from './AdminGuard';
import AdminLayout from './components/AdminLayout';

import Overview from './pages/Overview';
import ModerationQueue from './pages/ModerationQueue';
import ModerationDetail from './pages/ModerationDetail';
import UsersList from './pages/UsersList';
import UserDetail from './pages/UserDetail';
import Taxonomy from './pages/Taxonomy';
import Economy from './pages/Economy';
import SupportInbox from './pages/SupportInbox';
import Notifications from './pages/Notifications';
import AuditLog from './pages/AuditLog';
import Settings from './pages/Settings';
import ContentTools from './pages/ContentTools';

export function AdminApp() {
  return (
    <AdminGuard>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="moderation" element={<ModerationQueue />} />
          <Route path="moderation/:id" element={<ModerationDetail />} />
          <Route path="users" element={<UsersList />} />
          <Route path="users/:id" element={<UserDetail />} />
          <Route path="taxonomy" element={<Taxonomy />} />
          <Route path="economy" element={<Economy />} />
          <Route path="support" element={<SupportInbox />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="audit" element={<AuditLog />} />
          <Route path="settings" element={<Settings />} />
          <Route path="content" element={<ContentTools />} />
        </Route>
      </Routes>
    </AdminGuard>
  );
}
