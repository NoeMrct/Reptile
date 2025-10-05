import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { t } from 'i18next';
import {
  ArrowLeft,
  BadgeCheck,
  FilePlus2,
  Lightbulb,
  ListChecks,
  Medal,
  Coins,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  HelpCircle,
  Edit3,
  Trash2,
  ImagePlus,
  X,
  Upload,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UpgradeModal from '../components/UpgradeModal';

type ContributionType = 'species' | 'morph' | 'locality' | 'alias' | 'locus' | 'group';
type ContributionStatus = 'pending' | 'approved' | 'rejected';
type StakeStatus = 'locked' | 'refunded' | 'burned';

interface SpeciesOpt { id: string; label: string; }

interface ContributionBase {
  id: string;
  userId: string;
  type: ContributionType;
  speciesId?: string | null;
  payload: Record<string, any> & { images?: string[] };
  createdAt: string;
  status: ContributionStatus;
  moderatorNote?: string | null;
  reward?: number;
  stake?: number;
  stakeStatus?: StakeStatus;
}

const REWARD_BY_TYPE: Record<ContributionType, number> = {
  species: 250,
  morph: 80,
  locality: 40,
  alias: 15,
  locus: 60,
  group: 50,
};

const COIN_RULES = {
  redeem: { basicMonth: 1000, proMonth: 2500 },
  coupons: { min: 300, max: 800, discountRange: '−10 à −25 %' },
  badges: { verified: 80, topContributor: 200, photographer: 120 },
  tips: { min: 10 },
  stake: { min: 5, max: 10, defaultDeposit: 10 },
  transferability: 'non transférables (sauf tips), non convertibles en €',
  initialGrant: 50,
} as const;

const STORAGE_KEYS = {
  SUBMISSIONS: 'contrib_submissions',
  WALLET: 'contrib_wallet',
};

const MAX_IMAGES = 8;
const MAX_IMAGE_MB = 4;

const FALLBACK_SPECIES: SpeciesOpt[] = [
  { id: 'python-regius', label: 'Ball Python' },
  { id: 'pantherophis-guttatus', label: 'Corn Snake' },
  { id: 'morelia-viridis', label: 'Green Tree Python' },
  { id: 'morelia-spilota', label: 'Carpet Python' },
  { id: 'python-reticulatus', label: 'Reticulated Python' },
  { id: 'python-brongersmai', label: 'Blood Python' },
  { id: 'python-bivittatus', label: 'Burmese Python' },
];

function loadSubmissions(): ContributionBase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    return raw ? (JSON.parse(raw) as ContributionBase[]) : [];
  } catch {
    return [];
  }
}

function saveSubmissions(all: ContributionBase[]) {
  localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(all));
}

function loadWallet(userId: string): number | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.WALLET}:${userId}`);
    return raw !== null ? Number(raw) : null;
  } catch {
    return null;
  }
}

function saveWallet(userId: string, balance: number) {
  localStorage.setItem(`${STORAGE_KEYS.WALLET}:${userId}`, String(balance));
}

const StatusBadge: React.FC<{ status: ContributionStatus }> = ({ status }) => {
  const map: Record<ContributionStatus, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  const label: Record<ContributionStatus, string> = {
    pending: 'En attente',
    approved: 'Validé',
    rejected: 'Refusé',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${map[status]}`}>
      {label[status]}
    </span>
  );
};

const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>{children}</div>
);

const Thumbs: React.FC<{ images: string[]; onRemove?: (idx: number) => void }> = ({ images, onRemove }) => {
  if (!images || images.length === 0) return null;
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {images.map((src, idx) => (
        <div key={idx} className="relative group border rounded-lg overflow-hidden">
          <img src={src} alt={`proof-${idx}`} className="w-full h-24 object-cover" />
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="absolute top-1 right-1 bg-white/90 border rounded-full p-1 shadow hidden group-hover:block"
              aria-label={t('contribute.photo.delete')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

const RedeemCoinsModal: React.FC<{
  open: boolean;
  wallet: number;
  onClose: () => void;
  onDebit: (amount: number) => void;
}> = ({ open, wallet, onClose, onDebit }) => {
  const [couponSpend, setCouponSpend] = useState<number>(COIN_RULES.coupons.min);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  if (!open) return null;

  const canBasic = wallet >= COIN_RULES.redeem.basicMonth;
  const canPro = wallet >= COIN_RULES.redeem.proMonth;
  const validCoupon = couponSpend >= COIN_RULES.coupons.min && couponSpend <= COIN_RULES.coupons.max && wallet >= couponSpend;

  const makeCode = () => 'ECA-' + Math.random().toString(36).slice(2, 8).toUpperCase();

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border">
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold">{t('contribute.redeem.title')}</h4>
            </div>
            <button className="p-2 hover:bg-gray-50 rounded-lg" onClick={onClose} aria-label="Fermer">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-5 space-y-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-600">Solde disponible</div>
              <div className="text-3xl font-extrabold">{wallet} ⟡</div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="border rounded-xl p-4">
                <h5 className="font-semibold mb-2">Échanger contre un mois de plan</h5>
                <div className="space-y-2">
                  <button
                    disabled={!canBasic}
                    onClick={() => { onDebit(COIN_RULES.redeem.basicMonth); alert('Échange réussi : 1 mois Basic payé en Écailles.'); onClose(); }}
                    className={`w-full px-4 py-2 rounded-lg border font-medium ${canBasic ? 'hover:bg-green-50' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    Basic — {COIN_RULES.redeem.basicMonth} ⟡
                  </button>
                  <button
                    disabled={!canPro}
                    onClick={() => { onDebit(COIN_RULES.redeem.proMonth); alert('Échange réussi : 1 mois Pro payé en Écailles.'); onClose(); }}
                    className={`w-full px-4 py-2 rounded-lg border font-medium ${canPro ? 'hover:bg-green-50' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    Pro — {COIN_RULES.redeem.proMonth} ⟡
                  </button>
                </div>
              </div>

              <div className="border rounded-xl p-4">
                <h5 className="font-semibold mb-2">{t('contribute.redeem.generateCoupon')}</h5>
                <p className="text-sm text-gray-600 mb-2">Déduis {t('contribute.redeem.coinsRange', { min: COIN_RULES.coupons.min, max: COIN_RULES.coupons.max })} ⟡ pour obtenir un bon ({COIN_RULES.coupons.discountRange}).</p>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="number"
                    className="w-32 rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500"
                    min={COIN_RULES.coupons.min}
                    max={COIN_RULES.coupons.max}
                    value={couponSpend}
                    onChange={(e)=>setCouponSpend(Number(e.target.value))}
                  />
                  <span className="text-sm text-gray-600">⟡ à dépenser</span>
                </div>
                <button
                  disabled={!validCoupon}
                  onClick={() => { onDebit(couponSpend); const code = makeCode(); setGeneratedCode(code); alert(`Bon créé : ${code}`); onClose(); }}
                  className={`px-4 py-2 rounded-lg border font-medium ${validCoupon ? 'hover:bg-green-50' : 'opacity-50 cursor-not-allowed'}`}
                >
                  Générer le code
                </button>
                {generatedCode && (
                  <div className="mt-2 text-sm">Code : <span className="font-mono font-semibold">{generatedCode}</span></div>
                )}
              </div>
            </div>

            <div className="text-xs text-gray-500">Les Écailles sont {COIN_RULES.transferability}. Opération maquette pour tests.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContributePage: React.FC = () => {
  const { user } = useAuth();
  const [species, setSpecies] = useState<SpeciesOpt[]>(FALLBACK_SPECIES);
  const [tab, setTab] = useState<'propose' | 'mine' | 'leaderboard' | 'about'>('propose');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const userId = user?.id || 'guest';
  const [wallet, setWallet] = useState<number>(() => loadWallet(userId) ?? 0);
  const [submissions, setSubmissions] = useState<ContributionBase[]>(() => loadSubmissions());

  useEffect(() => {
    const existing = loadWallet(userId);
    if (existing === null) {
      setWallet(COIN_RULES.initialGrant);
      saveWallet(userId, COIN_RULES.initialGrant);
    }
  }, [userId]);

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const res = await fetch('/data/species.json', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (aborted) return;
        if (Array.isArray(data?.species)) {
          const opts: SpeciesOpt[] = data.species.map((s: any) => ({ id: s.id, label: s.names?.[1] || s.names?.[0] || s.id }));
          if (opts.length) setSpecies(opts);
        }
      } catch {}
    })();
    return () => { aborted = true; };
  }, []);

  const mySubs = useMemo(() => submissions.filter(s => s.userId === userId), [submissions, userId]);
  const approvedCoins = useMemo(() => mySubs.filter(s => s.status === 'approved').reduce((acc, s) => acc + (s.reward || 0), 0), [mySubs]);
  const lockedStake = useMemo(() => mySubs.filter(s => s.stakeStatus === 'locked').reduce((acc, s) => acc + (s.stake || 0), 0), [mySubs]);
  const [type, setType] = useState<ContributionType>('morph');
  const [speciesId, setSpeciesId] = useState<string>('python-regius');
  const [name, setName] = useState('');
  const [genType, setGenType] = useState<'recessive' | 'incomplete' | 'dominant' | ''>('');
  const [aliases, setAliases] = useState('');
  const [notes, setNotes] = useState('');
  const [references, setReferences] = useState('');
  const [latin, setLatin] = useState('');
  const [commonNames, setCommonNames] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const resetForm = () => {
    setName('');
    setGenType('');
    setAliases('');
    setNotes('');
    setReferences('');
    setLatin('');
    setCommonNames('');
    setImages([]);
  };
  const rewardForCurrent = REWARD_BY_TYPE[type];

  const readFilesAsDataUrls = (files: FileList) => {
    const arr = Array.from(files);
    arr.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        alert(`Image trop lourde (> ${MAX_IMAGE_MB} Mo): ${file.name}`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = String(e.target?.result || '');
        setImages((prev) => {
          if (prev.length >= MAX_IMAGES) return prev;
          if (prev.includes(url)) return prev; 
          return [...prev, url];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const onRemoveImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert("Connecte-toi pour proposer une contribution.");
      return;
    }

    if (type !== 'species' && !speciesId) {
      alert('Sélectionne une espèce.');
      return;
    }
    if (type === 'species' && !latin.trim()) {
      alert('Le nom latin de la nouvelle espèce est requis.');
      return;
    }
    if (['morph', 'locality', 'alias', 'locus', 'group'].includes(type) && !name.trim()) {
      alert('Le nom proposé est requis.');
      return;
    }
    if (type === 'morph' || type === 'locus') {
      if (!genType) {
        alert("Sélectionne le type génétique (récessif/incomplet/dominant).");
        return;
      }
    }

    const deposit = COIN_RULES.stake.defaultDeposit;
    if (deposit > 0) {
      if (wallet < deposit) {
        alert(`Il te faut au moins ${deposit} ⟡ disponibles pour soumettre (stake).`);
        return;
      }
      const newBal = wallet - deposit;
      setWallet(newBal);
      saveWallet(userId, newBal);
    }

    const payload: ContributionBase['payload'] = {
      name: name.trim(),
      genType: genType || undefined,
      aliases: aliases
        .split(',')
        .map(a => a.trim())
        .filter(Boolean),
      notes: notes.trim() || undefined,
      references: references
        .split(',')
        .map(u => u.trim())
        .filter(Boolean),
      images: images,
    };

    if (type === 'species') {
      payload['latin'] = latin.trim();
      payload['commonNames'] = commonNames
        .split(',')
        .map(n => n.trim())
        .filter(Boolean);
    }

    const newItem: ContributionBase = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      type,
      speciesId: type === 'species' ? null : speciesId,
      payload,
      createdAt: new Date().toISOString(),
      status: 'pending',
      moderatorNote: null,
      reward: rewardForCurrent,
      stake: deposit,
      stakeStatus: deposit > 0 ? 'locked' : undefined,
    };

    const all = [newItem, ...submissions];
    setSubmissions(all);
    saveSubmissions(all);
    resetForm();
    setTab('mine');
  };

  const handleRedeem = () => {
    setShowRedeem(true);
  };

  const leaderboard = useMemo(() => {
    const map = new Map<string, { name: string; coins: number }>();
    const sample: Array<{ id: string; name: string; coins: number }> = [
      { id: 'u_demo_1', name: 'Ari', coins: 520 },
      { id: 'u_demo_2', name: 'Léo', coins: 310 },
      { id: 'u_demo_3', name: 'Maya', coins: 295 },
    ];
    sample.forEach(s => map.set(s.id, { name: s.name, coins: s.coins }));
    const mine = mySubs.filter(s => s.status === 'approved').reduce((acc, s) => acc + (s.reward || 0), 0);
    if (!map.has(userId)) map.set(userId, { name: user?.name || user?.email || 'Moi', coins: mine });
    return Array.from(map, ([id, v]) => ({ id, ...v })).sort((a, b) => b.coins - a.coins).slice(0, 10);
  }, [mySubs, userId, user]);

  const [editing, setEditing] = useState<ContributionBase | null>(null);
  const [eType, setEType] = useState<ContributionType>('morph');
  const [eSpeciesId, setESpeciesId] = useState<string>('python-regius');
  const [eName, setEName] = useState('');
  const [eGenType, setEGenType] = useState<'recessive' | 'incomplete' | 'dominant' | ''>('');
  const [eAliases, setEAliases] = useState('');
  const [eNotes, setENotes] = useState('');
  const [eReferences, setEReferences] = useState('');
  const [eLatin, setELatin] = useState('');
  const [eCommonNames, setECommonNames] = useState('');
  const [eImages, setEImages] = useState<string[]>([]);
  const openEdit = (s: ContributionBase) => {
    setEditing(s);
    setEType(s.type);
    setESpeciesId(s.speciesId || 'python-regius');
    setEName((s.payload as any)?.name || '');
    setEGenType(((s.payload as any)?.genType as any) || '');
    setEAliases(((s.payload as any)?.aliases || []).join(', '));
    setENotes((s.payload as any)?.notes || '');
    setEReferences(((s.payload as any)?.references || []).join(', '));
    setELatin((s.payload as any)?.latin || '');
    setECommonNames(((s.payload as any)?.commonNames || []).join(', '));
    setEImages((s.payload as any)?.images || []);
  };
  const closeEdit = () => setEditing(null);
  const editReadFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        alert(`Image trop lourde (> ${MAX_IMAGE_MB} Mo): ${file.name}`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = String(e.target?.result || '');
        setEImages((prev) => {
          if (prev.length >= MAX_IMAGES) return prev;
          if (prev.includes(url)) return prev;
          return [...prev, url];
        });
      };
      reader.readAsDataURL(file);
    });
  };
  const removeEditImage = (idx: number) => setEImages((prev) => prev.filter((_, i) => i !== idx));
  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    if (eType !== 'species' && !eSpeciesId) {
      alert('Sélectionne une espèce.');
      return;
    }
    if (eType === 'species' && !eLatin.trim()) {
      alert('Le nom latin de la nouvelle espèce est requis.');
      return;
    }
    if (['morph', 'locality', 'alias', 'locus', 'group'].includes(eType) && !eName.trim()) {
      alert('Le nom proposé est requis.');
      return;
    }
    if (eType === 'morph' || eType === 'locus') {
      if (!eGenType) {
        alert("Sélectionne le type génétique (récessif/incomplet/dominant).");
        return;
      }
    }

    const updatedPayload: ContributionBase['payload'] = {
      name: eName.trim(),
      genType: eGenType || undefined,
      aliases: eAliases.split(',').map(a => a.trim()).filter(Boolean),
      notes: eNotes.trim() || undefined,
      references: eReferences.split(',').map(u => u.trim()).filter(Boolean),
      images: eImages,
    };
    if (eType === 'species') {
      updatedPayload['latin'] = eLatin.trim();
      updatedPayload['commonNames'] = eCommonNames.split(',').map(n => n.trim()).filter(Boolean);
    }

    const updated: ContributionBase = {
      ...editing,
      type: eType,
      speciesId: eType === 'species' ? null : eSpeciesId,
      payload: updatedPayload,
    };

    const next = submissions.map((x) => (x.id === editing.id ? updated : x));
    setSubmissions(next);
    saveSubmissions(next);
    setEditing(null);
  };

  const deleteSubmission = (s: ContributionBase) => {
    if (s.status !== 'pending') {
      alert('Seules les propositions en attente peuvent être supprimées.');
      return;
    }
    if (!confirm('Supprimer définitivement cette proposition ?')) return;
    const next = submissions.filter((x) => x.id !== s.id);
    setSubmissions(next);
    saveSubmissions(next);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white/80 backdrop-blur border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-600 hover:text-green-600 transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Contribuer au projet</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-start gap-4">
              <Lightbulb className="h-10 w-10 text-amber-500" />
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Propose des ajouts, gagne des Écailles</h2>
                <p className="text-gray-600">Suggère de nouvelles espèces, morphs, localités, alias, loci ou groupes. Quand nous validons ta proposition, tu reçois des <span className="font-semibold">Écailles</span> (monnaie interne) utilisables pour payer un plan payant.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <FilePlus2 className="h-5 w-5" />
                <p className="mt-2 font-semibold">1. Propose</p>
                <p className="text-sm text-gray-600">Remplis le formulaire détaillé.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <ShieldCheck className="h-5 w-5" />
                <p className="mt-2 font-semibold">2. Modération</p>
                <p className="text-sm text-gray-600">Nous vérifions, ajustons et validons.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <Coins className="h-5 w-5" />
                <p className="mt-2 font-semibold">3. Récompense</p>
                <p className="text-sm text-gray-600">Reçois des Écailles utilisables sur le site.</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-6 w-6 text-yellow-500" />
                <h3 className="text-lg font-bold">Mon portefeuille</h3>
              </div>
              <button onClick={handleRedeem} className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1.5 rounded-lg">{t('contribute.redeem.title')}</button>
            </div>
            <div className="mt-4">
              <p className="text-4xl font-extrabold text-gray-900">{wallet}</p>
              <p className="text-sm text-gray-500">Disponible</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                <BadgeCheck className="h-5 w-5 text-green-600" />
                <p className="text-sm mt-1 text-gray-700"><span className="font-semibold">{approvedCoins}</span> Écailles reçues (validées)</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <Lock className="h-5 w-5 text-amber-600" />
                <p className="text-sm mt-1 text-gray-700"><span className="font-semibold">{lockedStake}</span> Écailles en stake (verrouillées)</p>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-600">Tous les comptes démarrent avec <span className="font-semibold">{COIN_RULES.initialGrant} ⟡</span>. Chaque soumission consomme <span className="font-semibold">{COIN_RULES.stake.defaultDeposit} ⟡</span> (remboursées si validée).</div>
          </Card>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="border-b px-4 sm:px-6">
            <nav className="flex flex-wrap gap-4">
              {([
                { id: 'propose', label: t('contribute.tabs.propose'), icon: FilePlus2 },
                { id: 'mine', label: t('contribute.tabs.mine'), icon: ListChecks },
                { id: 'leaderboard', label: t('contribute.tabs.leaderboard'), icon: Medal },
                { id: 'about', label: t('contribute.tabs.about'), icon: HelpCircle },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 py-3 border-b-2 -mb-[1px] ${
                    tab === (t.id as any)
                      ? 'text-green-600 border-green-600'
                      : 'text-gray-600 border-transparent hover:text-gray-800'
                  }`}
                >
                  <t.icon className="h-5 w-5" />
                  <span className="font-medium">{t.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {tab === 'propose' && (
              <div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-bold mb-3">Formulaire de contribution</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Type d'ajout</label>
                          <select
                            className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500"
                            value={type}
                            onChange={(e) => setType(e.target.value as ContributionType)}
                          >
                            <option value="morph">Morph</option>
                            <option value="locality">Localité</option>
                            <option value="alias">Alias</option>
                            <option value="locus">Locus (gène)</option>
                            <option value="group">Groupe (complexe allélique)</option>
                            <option value="species">Nouvelle espèce</option>
                          </select>
                        </div>

                        {type !== 'species' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Espèce concernée</label>
                            <select
                              className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500"
                              value={speciesId}
                              onChange={(e) => setSpeciesId(e.target.value)}
                            >
                              {species.map((s) => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {type === 'species' && (
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Nom latin (obligatoire)</label>
                            <input
                              className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500"
                              placeholder="Ex : Pantherophis guttatus"
                              value={latin}
                              onChange={(e) => setLatin(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Noms communs (séparés par des virgules)</label>
                            <input
                              className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500"
                              placeholder="Corn Snake, Serpent des blés"
                              value={commonNames}
                              onChange={(e) => setCommonNames(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {type !== 'species' && (
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Nom proposé {type === 'alias' ? '(alias)' : ''}</label>
                            <input
                              className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500"
                              placeholder={type === 'alias' ? 'Ex : CG pour Coral Glow' : 'Ex : Ultramel'}
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                            />
                          </div>

                          {(type === 'morph' || type === 'locus') && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Type génétique</label>
                              <select
                                className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500"
                                value={genType}
                                onChange={(e) => setGenType(e.target.value as any)}
                              >
                                <option value="">Sélectionner…</option>
                                <option value="recessive">Récessif</option>
                                <option value="incomplete">Incomplet (codominant)</option>
                                <option value="dominant">Dominant</option>
                              </select>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Alias (séparés par des virgules)</label>
                          <input
                            className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500"
                            placeholder="amel, T- albino, …"
                            value={aliases}
                            onChange={(e) => setAliases(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Références (URLs, séparées par des virgules)</label>
                          <input
                            className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500"
                            placeholder="https://…, https://…"
                            value={references}
                            onChange={(e) => setReferences(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Notes (contexte, preuves, éleveurs, etc.)</label>
                          <textarea
                            rows={4}
                            className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500"
                            placeholder="Détails utiles pour la modération (captures d’échanges, publications, tests d’accouplements, etc.)"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Photos (optionnel)</label>
                          <div className="mt-1 flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                              <Upload className="h-4 w-4" />
                              <span className="text-sm">Ajouter des photos</span>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(ev) => {
                                  const files = (ev.target as HTMLInputElement).files;
                                  if (files) readFilesAsDataUrls(files);
                                  (ev.target as HTMLInputElement).value = '';
                                }}
                              />
                            </label>
                            <span className="text-xs text-gray-500">Jusqu’à {MAX_IMAGES} images • {MAX_IMAGE_MB} Mo max / image</span>
                          </div>
                          <div className="mt-2">
                            <Thumbs images={images} onRemove={onRemoveImage} />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 space-y-0.5">
                          <div>Récompense estimée : <span className="font-semibold">{rewardForCurrent} ⟡</span></div>
                          <div className="text-amber-700">Stake requis à la soumission : <span className="font-semibold">{COIN_RULES.stake.defaultDeposit} ⟡</span> (remboursées si validée, brûlé si refus de qualité)</div>
                        </div>
                        <button
                          type="submit"
                          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold"
                        >
                          Envoyer la proposition
                        </button>
                      </div>
                    </form>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold mb-3">Barème des récompenses</h3>
                    <ul className="space-y-2">
                      {(
                        [
                          ['species', 'Nouvelle espèce'],
                          ['morph', 'Nouveau morph (confirmé)'],
                          ['locus', 'Nouveau locus (gène)'],
                          ['group', 'Nouveau groupe allélique'],
                          ['locality', 'Nouvelle localité'],
                          ['alias', 'Alias pertinent/documenté'],
                        ] as Array<[ContributionType, string]>
                      ).map(([key, label]) => (
                        <li key={key} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                          <span className="text-gray-700">{label}</span>
                          <span className="font-semibold">{REWARD_BY_TYPE[key]} ⟡</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <div className="flex items-start gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-semibold">Conseil</p>
                          <p className="text-sm text-blue-800">Plus ta proposition est sourcée (références, photos, élevages), plus elle a de chances d’être validée rapidement.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'mine' && (
              <div>
                <h3 className="text-lg font-bold mb-4">Mes propositions</h3>
                {mySubs.length === 0 ? (
                  <div className="text-center py-12">
                    <FilePlus2 className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Tu n’as pas encore proposé d’ajout.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600 border-b">
                          <th className="py-2 pr-4">Date</th>
                          <th className="py-2 pr-4">Type</th>
                          <th className="py-2 pr-4">Espèce</th>
                          <th className="py-2 pr-4">Contenu</th>
                          <th className="py-2 pr-4">Statut</th>
                          <th className="py-2 pr-4 text-right">Récompense</th>
                          <th className="py-2 pr-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mySubs.map((s) => (
                          <tr key={s.id} className="border-b last:border-none align-top">
                            <td className="py-2 pr-4 text-gray-600 whitespace-nowrap">{new Date(s.createdAt).toLocaleString()}</td>
                            <td className="py-2 pr-4 capitalize whitespace-nowrap">{s.type}</td>
                            <td className="py-2 pr-4 whitespace-nowrap">{s.type === 'species' ? '—' : (species.find(sp => sp.id === s.speciesId)?.label || s.speciesId)}</td>
                            <td className="py-2 pr-4">
                              <div className="text-gray-900 font-medium">{s.payload?.name || s.payload?.latin || '—'}</div>
                              {s.payload?.images?.length ? (
                                <div className="mt-2">
                                  <Thumbs images={s.payload.images.slice(0, 3)} />
                                  {s.payload.images.length > 3 && (
                                    <div className="text-xs text-gray-500 mt-1">+ {s.payload.images.length - 3} autres photo(s)</div>
                                  )}
                                </div>
                              ) : null}
                              {s.stake ? (
                                <div className="text-xs text-amber-700 mt-1">
                                  Stake : {s.stake} ⟡ — {s.stakeStatus === 'locked' ? 'verrouillé' : s.stakeStatus === 'refunded' ? 'remboursé' : 'brûlé'}
                                </div>
                              ) : null}
                              {s.moderatorNote && (
                                <div className="text-xs text-gray-500 mt-1">Note modérateur : {s.moderatorNote}</div>
                              )}
                            </td>
                            <td className="py-2 pr-4"><StatusBadge status={s.status} /></td>
                            <td className="py-2 pr-4 text-right">{s.status === 'approved' ? (s.reward || 0) : '—'}</td>
                            <td className="py-2 pr-4">
                              <div className="flex gap-2 justify-end">
                                <button
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border ${s.status === 'pending' ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
                                  onClick={() => s.status === 'pending' && openEdit(s)}
                                  title={s.status === 'pending' ? 'Modifier' : 'Édition disponible uniquement en attente'}
                                >
                                  <Edit3 className="h-4 w-4" />
                                  Éditer
                                </button>
                                <button
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-rose-600 ${s.status === 'pending' ? 'hover:bg-rose-50' : 'opacity-50 cursor-not-allowed'}`}
                                  onClick={() => s.status === 'pending' && deleteSubmission(s)}
                                  title={s.status === 'pending' ? 'Supprimer' : 'Suppression disponible uniquement en attente'}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Supprimer
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === 'leaderboard' && (
              <div>
                <h3 className="text-lg font-bold mb-4">Classement des contributeurs</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leaderboard.map((u, idx) => (
                    <div key={u.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-500' : idx === 2 ? 'bg-amber-700' : 'bg-green-600'}`}>{idx + 1}</div>
                        <div>
                          <div className="font-semibold">{u.name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Écailles</div>
                        </div>
                      </div>
                      <div className="text-xl font-extrabold">{u.coins}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'about' && (
              <div className="prose prose-sm max-w-none">
                <h3>Règles de contribution</h3>
                <ul>
                  <li>Fournis des sources fiables (éleveurs reconnus, publications, discussions étayées, tests d’accouplement).</li>
                  <li>Exemples d’éléments acceptés : nouveaux morphs établis, localités documentées, alias largement utilisés, loci/mécanismes génétiques, groupes allélique cohérents.</li>
                  <li>Les propositions dupliquées ou non sourcées peuvent être refusées.</li>
                  <li>La modération peut renommer/normaliser pour cohérence (casse, accents, alias ↔ label).</li>
                  <li>Les récompenses sont versées uniquement après validation.</li>
                  <li>Tous les comptes démarrent avec {COIN_RULES.initialGrant} ⟡. Chaque soumission consomme {COIN_RULES.stake.defaultDeposit} ⟡ (remboursées si validée).</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {showUpgrade && (
        <UpgradeModal
          onClose={() => { setShowUpgrade(false); setShowRedeem(false); }}
          onUpgrade={(plan) => {
            console.log(`[Contribute] Redeem coins toward ${plan} plan`);
            setShowUpgrade(false);
            setShowRedeem(false);
          }}
        />
      )}

      <RedeemCoinsModal
        open={showRedeem}
        wallet={wallet}
        onClose={() => setShowRedeem(false)}
        onDebit={(amount) => { const next = Math.max(0, wallet - amount); setWallet(next); saveWallet(userId, next); }}
      />

      {editing && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={closeEdit} />
          <div className="absolute inset-0 grid place-items-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border">
              <div className="flex items-center justify-between px-5 py-3 border-b">
                <div className="flex items-center gap-2">
                  <ImagePlus className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold">Éditer la proposition</h4>
                </div>
                <button className="p-2 hover:bg-gray-50 rounded-lg" onClick={closeEdit} aria-label="Fermer">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={saveEdit} className="p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type d'ajout</label>
                    <select
                      className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500"
                      value={eType}
                      onChange={(ev) => setEType(ev.target.value as ContributionType)}
                    >
                      <option value="morph">Morph</option>
                      <option value="locality">Localité</option>
                      <option value="alias">Alias</option>
                      <option value="locus">Locus (gène)</option>
                      <option value="group">Groupe (complexe allélique)</option>
                      <option value="species">Nouvelle espèce</option>
                    </select>
                  </div>

                  {eType !== 'species' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Espèce concernée</label>
                      <select
                        className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500"
                        value={eSpeciesId}
                        onChange={(e) => setESpeciesId(e.target.value)}
                      >
                        {species.map((s) => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {eType === 'species' ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nom latin (obligatoire)</label>
                      <input className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={eLatin} onChange={(e)=>setELatin(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Noms communs (séparés par des virgules)</label>
                      <input className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={eCommonNames} onChange={(e)=>setECommonNames(e.target.value)} />
                    </div>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nom proposé</label>
                      <input className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={eName} onChange={(e)=>setEName(e.target.value)} />
                    </div>
                    {(eType === 'morph' || eType === 'locus') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Type génétique</label>
                        <select className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={eGenType} onChange={(e)=>setEGenType(e.target.value as any)}>
                          <option value="">Sélectionner…</option>
                          <option value="recessive">Récessif</option>
                          <option value="incomplete">Incomplet (codominant)</option>
                          <option value="dominant">Dominant</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Alias (séparés par des virgules)</label>
                    <input className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={eAliases} onChange={(e)=>setEAliases(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Références (URLs, séparées par des virgules)</label>
                    <input className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={eReferences} onChange={(e)=>setEReferences(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea rows={3} className="mt-1 w-full rounded-lg border-gray-300 focus:ring-2 focus:ring-green-500" value={eNotes} onChange={(e)=>setENotes(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Photos</label>
                    <div className="mt-1 flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">Ajouter des photos</span>
                        <input type="file" multiple accept="image/*" className="hidden" onChange={(ev)=>{ const f=(ev.target as HTMLInputElement).files; if(f) editReadFiles(f); (ev.target as HTMLInputElement).value=''; }} />
                      </label>
                      <span className="text-xs text-gray-500">Jusqu’à {MAX_IMAGES} images • {MAX_IMAGE_MB} Mo max / image</span>
                    </div>
                    <div className="mt-2"><Thumbs images={eImages} onRemove={removeEditImage} /></div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button type="button" onClick={closeEdit} className="px-4 py-2 rounded-lg border hover:bg-gray-50">Annuler</button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">Enregistrer</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContributePage;