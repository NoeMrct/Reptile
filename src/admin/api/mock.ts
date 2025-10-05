import { AdminUser, Contribution, LedgerEntry, TaxonomyItem, ContactTicket, NotificationTemplate, AuditEvent, Paged } from '../types';

const KEY = 'reptile_admin_mock_v1';

type Db = {
  users: AdminUser[];
  contributions: Contribution[];
  ledger: LedgerEntry[];
  taxonomy: TaxonomyItem[];
  tickets: ContactTicket[];
  templates: NotificationTemplate[];
  audit: AuditEvent[];
};

function seed(): Db {
  const now = new Date().toISOString();
  const db: Db = {
    users: [
      { id: 'u1', email: 'mercourt.noe@outlook.fr', displayName: 'Super Admin', role: 'superadmin', status: 'active', createdAt: now, lastLoginAt: now },
      { id: 'u2', email: 'mod@site.tld', displayName: 'Modérateur', role: 'moderator', status: 'active', createdAt: now },
      { id: 'u3', email: 'finance@site.tld', displayName: 'Finance', role: 'finance', status: 'active', createdAt: now }
    ],
    contributions: Array.from({ length: 8 }).map((_, i) => ({
      id: 'c' + (i+1),
      type: (['species','morph','locality','alias','image'] as Contribution['type'][])[i % 5],
      title: `Proposition #${i+1}`,
      authorEmail: i % 2 ? 'user@foo.tld' : 'poweruser@bar.tld',
      submittedAt: now,
      status: 'pending',
      stake: 10,
      diff: JSON.stringify({ before: { name: 'Old' }, after: { name: 'New '+(i+1) }}, null, 2)
    })),
    ledger: Array.from({ length: 12 }).map((_, i) => ({
      id: 'l' + (i+1),
      userEmail: i % 2 ? 'user@foo.tld' : 'poweruser@bar.tld',
      change: i % 3 === 0 ? 100 : -10,
      reason: i % 3 === 0 ? 'Reward - approved contribution' : 'Stake - submission',
      at: now,
      by: 'mercourt.noe@outlook.fr'
    })),
    taxonomy: [
      { id: 't1', kind: 'species', name: 'Python regius', createdAt: now },
      { id: 't2', kind: 'species', name: 'Pantherophis guttatus', createdAt: now },
      { id: 't3', kind: 'morph', name: 'Pastel', createdAt: now },
      { id: 't4', kind: 'alias', name: 'Royal Python', canonicalId: 't1', createdAt: now },
    ],
    tickets: [
      { id: 'tk1', fromEmail: 'foo@bar.tld', subject: "Problème d'inscription", body: "Je n'arrive pas à valider...", createdAt: now, status: 'open' },
      { id: 'tk2', fromEmail: 'alice@doe.tld', subject: 'Suggestion de morph', body: 'Ajouter Morph XYZ', createdAt: now, status: 'pending' }
    ],
    templates: [
      { id: 'nt1', name: 'Rappel nourrissage', channel: 'email', subject: 'Rappel', body: 'Bonjour {{name}}, pensez à nourrir {{snake}}', variables: ['name','snake'], updatedAt: now },
      { id: 'nt2', name: 'Maintenance', channel: 'push', body: 'Le site sera indisponible à {{time}}', variables: ['time'], updatedAt: now }
    ],
    audit: [
      { id: 'a1', at: now, actor: 'mercourt.noe@outlook.fr', action: 'LOGIN', meta: { ip: '127.0.0.1' } },
      { id: 'a2', at: now, actor: 'mod@site.tld', action: 'APPROVE_CONTRIBUTION', target: 'c1' }
    ]
  };
  return db;
}

function readDb(): Db {
  const raw = localStorage.getItem(KEY);
  if (!raw) {
    const seeded = seed();
    localStorage.setItem(KEY, JSON.stringify(seeded));
    return seeded;
  }
  return JSON.parse(raw) as Db;
}

function writeDb(db: Db) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export function getKpis() {
  const db = readDb();
  return [
    { label: 'Contribs en attente', value: db.contributions.filter(c => c.status === 'pending').length },
    { label: 'Utilisateurs', value: db.users.length },
    { label: 'Entrées ledger (30j)', value: db.ledger.length },
    { label: 'Tickets ouverts', value: db.tickets.filter(t => t.status !== 'closed').length },
  ];
}

export function listContributions(): Contribution[] {
  return readDb().contributions;
}

export function updateContribution(id: string, status: 'approved'|'rejected', actor: string) {
  const db = readDb();
  const idx = db.contributions.findIndex(c => c.id === id);
  if (idx >= 0) {
    db.contributions[idx].status = status;
    db.audit.unshift({ id: 'a'+(Date.now()), at: new Date().toISOString(), actor, action: status === 'approved' ? 'APPROVE_CONTRIBUTION' : 'REJECT_CONTRIBUTION', target: id });
    writeDb(db);
  }
}

export function getContribution(id: string): Contribution | undefined {
  return readDb().contributions.find(c => c.id === id);
}

export function listUsers(): AdminUser[] {
  return readDb().users;
}

export function getUser(id: string): AdminUser | undefined {
  return readDb().users.find(u => u.id === id);
}

export function updateUserStatus(id: string, status: AdminUser['status']) {
  const db = readDb();
  const u = db.users.find(x => x.id === id);
  if (u) {
    u.status = status;
    db.audit.unshift({ id: 'a'+Date.now(), at: new Date().toISOString(), actor: 'mercourt.noe@outlook.fr', action: 'UPDATE_USER_STATUS', target: id, meta: { status } });
    writeDb(db);
  }
}

export function listLedger(page = 1, pageSize = 25): Paged<LedgerEntry> {
  const db = readDb();
  const start = (page - 1) * pageSize;
  const items = db.ledger.slice(start, start + pageSize);
  return { items, total: db.ledger.length, page, pageSize };
}

export function listTaxonomy(): TaxonomyItem[] {
  return readDb().taxonomy;
}

export function upsertTaxonomy(item: TaxonomyItem) {
  const db = readDb();
  const idx = db.taxonomy.findIndex(t => t.id === item.id);
  if (idx >= 0) db.taxonomy[idx] = { ...item, updatedAt: new Date().toISOString() };
  else db.taxonomy.unshift({ ...item, createdAt: new Date().toISOString() });
  writeDb(db);
}

export function listTickets(): ContactTicket[] {
  return readDb().tickets;
}

export function updateTicket(id: string, patch: Partial<ContactTicket>) {
  const db = readDb();
  const t = db.tickets.find(x => x.id === id);
  if (t) {
    Object.assign(t, patch);
    writeDb(db);
  }
}

export function listTemplates(): NotificationTemplate[] {
  return readDb().templates;
}

export function upsertTemplate(tpl: NotificationTemplate) {
  const db = readDb();
  const idx = db.templates.findIndex(t => t.id === tpl.id);
  if (idx >= 0) db.templates[idx] = { ...tpl, updatedAt: new Date().toISOString() };
  else db.templates.unshift({ ...tpl, updatedAt: new Date().toISOString() });
  writeDb(db);
}

export function listAudit(page = 1, pageSize = 50): Paged<AuditEvent> {
  const db = readDb();
  const start = (page - 1) * pageSize;
  const items = db.audit.slice(start, start + pageSize);
  return { items, total: db.audit.length, page, pageSize };
}
