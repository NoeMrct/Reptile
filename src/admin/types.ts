
export type Role = 'user' | 'superadmin' | 'admin' | 'moderator' | 'curator' | 'support' | 'finance' | 'devops';

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  lastLoginAt?: string;
  notes?: string;
}

export type ContributionType = 'species' | 'morph' | 'locality' | 'alias' | 'group' | 'image';

export interface Contribution {
  id: string;
  type: ContributionType;
  title: string;
  authorEmail: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  stake: number; // Ecailles staked by user
  diff: string;  // JSON diff string or markdown
}

export interface LedgerEntry {
  id: string;
  userEmail: string;
  change: number; // positive or negative (Ecailles)
  reason: string;
  at: string;
  by: string; // admin actor
}

export interface TaxonomyItem {
  id: string;
  kind: 'species' | 'morph' | 'locality' | 'alias';
  name: string;
  canonicalId?: string; // for aliases
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  channel: 'email' | 'push';
  subject?: string;
  body: string;
  variables: string[];
  updatedAt: string;
}

export interface ContactTicket {
  id: string;
  fromEmail: string;
  subject: string;
  body: string;
  createdAt: string;
  status: 'open' | 'pending' | 'closed';
  assignee?: string;
  tags?: string[];
}

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  action: string;
  target?: string;
  meta?: Record<string, unknown>;
}

export interface KPI {
  label: string;
  value: string | number;
  hint?: string;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
