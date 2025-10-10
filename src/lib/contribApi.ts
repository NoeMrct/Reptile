// lib/contribApi.ts — Version corrigée et complète (Supabase + Front helpers)
// - Types stricts et mapping snake_case -> camelCase
// - Fonctions: fetchSpecies, fetchMyContributions, submitContribution, updateContribution, deleteContribution
// - Catalogue anti‑doublon (depuis contributions approuvées)
// - Détection de doublons robuste (sans /\p{Diacritic}/)
// - Outils admin: adminFetchContributions, adminDecide, adminReopen
// NOTE: Adapte les noms de tables/colonnes si ton schéma diffère, mais garde l'API.

import { supabase } from '../context/AuthContext';

/** ===== Types ===== */
export type ContributionType = 'species' | 'morph' | 'locality' | 'alias' | 'locus' | 'group';
export type ContributionStatus = 'pending' | 'approved' | 'rejected';
export type StakeStatus = 'locked' | 'refunded' | 'burned';

export interface SpeciesOpt { id: string; label: string; latin?: string | null }

export interface ContributionInsert {
  type: ContributionType;
  speciesId: string | null;
  payload: any;
  reward?: number | null;
  stake?: number | null;
}

export interface Contribution {
  id: string;
  userId: string;
  type: ContributionType;
  speciesId: string | null;
  payload: any;
  createdAt: string;
  status: ContributionStatus;
  moderatorNote?: string | null;
  reward?: number | null;
  stake?: number | null;
  stakeStatus?: StakeStatus | null;
  decidedAt?: string | null;
  decidedBy?: string | null;
}

export interface ContributionRow {
  id: string;
  user_id: string;
  type: ContributionType;
  species_id: string | null;
  payload: any;
  created_at: string;
  status: ContributionStatus;
  moderator_note?: string | null;
  reward?: number | null;
  stake?: number | null;
  stake_state?: StakeStatus | null;
  decided_at?: string | null;
  decided_by?: string | null;
}

export interface CatalogItem {
  id: string;
  name: string;
  latin?: string | null;
  aliases?: string[];
}

/** ===== Helpers ===== */

function mapContributionRow(r: ContributionRow): Contribution {
  return {
    id: String(r.id),
    userId: r.user_id,
    type: r.type,
    speciesId: r.species_id,
    payload: r.payload ?? {},
    createdAt: r.created_at,
    status: r.status,
    moderatorNote: r.moderator_note ?? null,
    reward: r.reward ?? null,
    stake: r.stake ?? null,
    stakeStatus: r.stake_state ?? null,
    decidedAt: r.decided_at ?? null,
    decidedBy: r.decided_by ?? null,
  };
}

/** Remove accents/diacritics safely (wide browser support) */
export function stripDiacritics(input: string): string {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Normalize string for fuzzy compare */
export function norm(s: string): string {
  return stripDiacritics(String(s || '').toLowerCase())
    .replace(/[^a-z0-9\s\-']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** ===== Reads ===== */

// Species (for selects)
export async function fetchSpecies(): Promise<SpeciesOpt[]> {
  const { data, error } = await supabase
    .from('species')
    .select('id, latin')
    .order('latin', { ascending: true })
    .limit(5000);
  if (error) throw error;
  return (data || []).map((s: any) => ({
    id: String(s.id),
    label: s.latin || String(s.id),
    latin: s.latin || null,
  }));
}

export async function fetchMyContributions(userId: string): Promise<Contribution[]> {
  const { data, error } = await supabase
    .from('contributions')
    .select(
      'id, user_id, type, species_id, payload, created_at, status, moderator_note, reward, stake, stake_state, decided_at, decided_by'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapContributionRow);
}

/** ===== Public create/update/delete ===== */
export async function submitContribution(userId: string, input: ContributionInsert): Promise<Contribution> {
  const toInsert: any = {
    user_id: userId,
    type: input.type,
    species_id: input.type === 'species' ? null : input.speciesId,
    payload: input.payload,
    status: 'pending',
    reward: input.reward ?? null,
    stake: input.stake ?? 10,
    stake_state: (input.stake ?? 10) > 0 ? 'locked' : null,
  };
  const { data, error } = await supabase
    .from('contributions')
    .insert(toInsert)
    .select(
      'id, user_id, type, species_id, payload, created_at, status, moderator_note, reward, stake, stake_state, decided_at, decided_by'
    )
    .single();
  if (error) throw error;
  return mapContributionRow(data as ContributionRow);
}

export async function updateContribution(
  id: string,
  patch: Partial<{ type: ContributionType; species_id: string | null; payload: any }>
): Promise<Contribution> {
  const toUpdate: any = {};
  if (patch.type) toUpdate.type = patch.type;
  if ('species_id' in patch) toUpdate.species_id = patch.species_id;
  if ('payload' in patch) toUpdate.payload = patch.payload;

  const { data, error } = await supabase
    .from('contributions')
    .update(toUpdate)
    .eq('id', id)
    .eq('status', 'pending')
    .select(
      'id, user_id, type, species_id, payload, created_at, status, moderator_note, reward, stake, stake_state, decided_at, decided_by'
    )
    .single();
  if (error) throw error;
  return mapContributionRow(data as ContributionRow);
}

export async function deleteContribution(id: string): Promise<void> {
  const { error } = await supabase
    .from('contributions')
    .delete()
    .eq('id', id)
    .eq('status', 'pending');
  if (error) throw error;
}

/** ===== Catalog (anti‑doublon) =====
 * On s'appuie sur les contributions VALIDÉES (approved) pour disposer d'un catalogue simple,
 * quel que soit l'état d'implémentation des tables métier.
 */
export async function fetchCatalog(
  type: ContributionType,
  speciesId: string | null
): Promise<CatalogItem[]> {
  // Cas spécial espèce: on lit directement la table species
  if (type === 'species') {
    const { data, error } = await supabase
      .from('species')
      .select('id, latin')
      .order('latin', { ascending: true })
      .limit(10000);
    if (error) throw error;
    return (data || []).map((r: any) => ({
      id: String(r.id),
      name: r.latin || String(r.id),
      latin: r.latin || null,
      aliases: [],
    }));
  }

  // Sinon, on lit les contributions approuvées du type concerné (optionnellement filtrées par espèce)
  let query = supabase
    .from('contributions')
    .select('id, type, species_id, payload, status')
    .eq('type', type)
    .eq('status', 'approved')
    .limit(10000);

  if (speciesId) query = query.eq('species_id', speciesId);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((row: any) => {
    const p = row.payload || {};
    return {
      id: String(row.id),
      name: String(p.name || p.latin || ''),
      latin: p.latin || null,
      aliases: Array.isArray(p.aliases) ? p.aliases : [],
    } as CatalogItem;
  });
}

/** Détection (très) simple de doublons dans un catalogue existant.
 * - compare nom (ou latin) + alias normalisés
 * - cherche des inclusions grossières (contains) pour tolérer variantes.
 */
export function findDuplicatesForProposal(
  proposal: {
    type: ContributionType;
    speciesId: string | null;
    name?: string;
    latin?: string;
    aliases?: string[];
  },
  catalog: CatalogItem[]
): CatalogItem[] {
  const targetNames: string[] = [];
  if (proposal.type === 'species') {
    if (proposal.latin) targetNames.push(proposal.latin);
  } else {
    if (proposal.name) targetNames.push(proposal.name);
  }
  (proposal.aliases || []).forEach(a => targetNames.push(a));

  const targets = targetNames.map(norm).filter(Boolean);
  if (!targets.length) return [];

  return catalog.filter((c) => {
    const hay = [
      c.name,
      c.latin || '',
      ...(c.aliases || []),
    ]
      .map(norm)
      .filter(Boolean);

    // Match si l'un des targets === un hay ou est contenu (ou inversement)
    for (const t of targets) {
      for (const h of hay) {
        if (!t || !h) continue;
        if (t === h) return true;
        if (t.length >= 3 && (h.includes(t) || t.includes(h))) return true;
      }
    }
    return false;
  });
}

/** ===== Admin helpers =====
 * Ces fonctions supposent que l'auth côté Supabase donne les droits nécessaires
 * aux comptes "modérateurs" ou que vous utilisez une clé service côté serveur.
 */
export async function adminFetchContributions(params?: {
  q?: string;
  type?: 'all' | ContributionType;
  status?: 'all' | ContributionStatus;
  limit?: number;
}): Promise<Contribution[]> {
  const type = params?.type ?? 'all';
  const status = params?.status ?? 'all';
  const limit = params?.limit ?? 1000;

  let query = supabase
    .from('contributions')
    .select(
      'id, user_id, type, species_id, payload, created_at, status, moderator_note, reward, stake, stake_state, decided_at, decided_by'
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (type !== 'all') query = query.eq('type', type);
  if (status !== 'all') query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  let rows = (data || []).map(mapContributionRow);

  const q = (params?.q || '').trim().toLowerCase();
  if (q) {
    rows = rows.filter((i) => {
      const text = [
        i.id,
        i.type,
        i.speciesId || '',
        i.status,
        i.moderatorNote || '',
        i.payload?.name || '',
        i.payload?.latin || '',
        ...(Array.isArray(i.payload?.aliases) ? i.payload.aliases : []),
      ]
        .map((x) => norm(String(x)))
        .join(' ');
      return text.includes(norm(q));
    });
  }

  return rows;
}

export async function adminDecide(
  id: string,
  decision: 'approve' | 'reject',
  opts?: { moderatorNote?: string; decidedBy?: string }
): Promise<Contribution> {
  const now = new Date().toISOString();
  const status: ContributionStatus = decision === 'approve' ? 'approved' : 'rejected';
  const stake_state: StakeStatus | null = decision === 'approve' ? 'refunded' : 'burned';

  const { data, error } = await supabase
    .from('contributions')
    .update({
      status,
      moderator_note: opts?.moderatorNote ?? null,
      decided_at: now,
      decided_by: opts?.decidedBy ?? null,
      stake_state,
    })
    .eq('id', id)
    .select(
      'id, user_id, type, species_id, payload, created_at, status, moderator_note, reward, stake, stake_state, decided_at, decided_by'
    )
    .single();

  if (error) throw error;
  return mapContributionRow(data as ContributionRow);
}

export async function adminReopen(id: string): Promise<void> {
  const { error } = await supabase
    .from('contributions')
    .update({
      status: 'pending',
      decided_at: null,
      decided_by: null,
      moderator_note: null,
      stake_state: 'locked',
    })
    .eq('id', id);
  if (error) throw error;
}

// Donne le grant initial si besoin (idempotent)
export async function ensureInitialWallet(userId: string): Promise<void> {
  const { error } = await supabase.rpc('ensure_initial_wallet', {
    p_user_id: userId,
    p_amount: 50, // valeur par défaut
  });
  if (error) throw error;
}

// Solde (vue SQL wallet_balances)
export async function fetchWalletBalance(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('wallet_balances')
    .select('balance')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error; // pas de ligne => 0
  return data?.balance ?? 0;
}

// Récompenses validées sur 30 jours
export async function fetchRewardsLast30(userId: string): Promise<number> {
  const sinceIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('wallet_ledger')
    .select('amount')
    .eq('user_id', userId)
    .eq('reason', 'contribution_reward')
    .gte('created_at', sinceIso);
  if (error) throw error;
  return (data ?? []).reduce((sum: number, r: any) => sum + (r?.amount ?? 0), 0);
}