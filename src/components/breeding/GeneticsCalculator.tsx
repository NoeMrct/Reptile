import React, { useEffect, useMemo, useState } from "react";
import { Dna, Calculator, AlertTriangle, ShieldAlert } from "lucide-react";
import { Snake } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { t } from 'i18next';

type LocusType = "dominant" | "recessive" | "incomplete";
type Zygosity = "normal" | "het" | "super" | "visual" | "unknown";
type GenoToken = "RR" | "Rr" | "rr" | "DD" | "Dd" | "dd" | "??";
type ChildZygo = "normal" | "het" | "super" | "visual";

type SpeciesIndex = {
  version: number;
  species: { id: string; names: string[]; registry_file: string }[];
};

type LocusJson = {
  name: string;
  label: string;
  type: LocusType;
  aliases?: string[];
  group?: string;
};
type GroupJson = {
  id: string;
  label: string;
  exclusive: boolean;
  allowInterallelicNames?: boolean;
  status?: "confirmed" | "consensus" | "disputed" | "mixed" | "caution";
  notes?: string;
};

type SpeciesRegistry = {
  version: number;
  meta?: { revision?: string; updated?: string };
  species: { id: string; label: string; aliases: string[] };
  groups: GroupJson[];
  loci: LocusJson[];
  interallelicPhenotypes: Record<string, Record<string, string>>;
  superNames?: Record<string, string>;
  namedCombos?: Record<string, string>;
};

type ParentViolation = { parentId: string; parentName: string; group: string; genes: string[] };

interface GeneticPrediction {
  morph: string;
  probability: number; // %
  isVisual: boolean;
  genes: string[];
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const normalize = (s?: string) =>
  (s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

function morphSuggestsLocus(morph?: string, locus?: LocusJson): boolean {
  if (!morph || !locus) return false;
  const hay = morph.toLowerCase();
  const names = [locus.name, ...(locus.aliases || []), locus.label]
    .filter(Boolean)
    .map((x) => x.toLowerCase());
  return names.some((name) => hay.includes(name));
}

async function fetchJsonCandidates<T = any>(candidates: string[]): Promise<T> {
  let lastErr: any;
  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (res.ok) return (await res.json()) as T;
      lastErr = new Error(`${url} => HTTP ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Aucune URL valide");
}

const BASE = (import.meta as any)?.env?.BASE_URL || "/";

async function loadSpeciesIndex(): Promise<SpeciesIndex> {
  return fetchJsonCandidates<SpeciesIndex>([`${BASE}genetics/species.json`, `/genetics/species.json`]);
}

function guessRegistryPath(speciesName: string): string[] {
  const n = normalize(speciesName);
  const toId =
    n.includes("ball python") ||
    n.includes("python regius") ||
    n.includes("royal python") ||
    n.includes("python royal")
      ? "python-regius"
      : n.includes("corn snake") || n.includes("pantherophis guttatus") || n.includes("elaphe guttata")
      ? "pantherophis-guttatus"
      : "";

  if (!toId) return [];
  return [`${BASE}genetics/${toId}.json`, `/genetics/${toId}.json`];
}

async function resolveRegistryForSpeciesName(name: string): Promise<SpeciesRegistry | null> {
  try {
    const index = await loadSpeciesIndex();
    const n = normalize(name);
    const hit =
      index.species.find((sp) => sp.names.map(normalize).includes(n)) ||
      index.species.find((sp) => sp.names.map(normalize).some((x) => n.includes(x)));
    if (hit) {
      return await fetchJsonCandidates<SpeciesRegistry>([hit.registry_file, `${BASE}${hit.registry_file}`]);
    }
  } catch {}

  const guesses = guessRegistryPath(name);
  if (guesses.length) {
    try {
      return await fetchJsonCandidates<SpeciesRegistry>(guesses);
    } catch {}
  }
  return null;
}

const mapZygosityToGeno = (t: LocusType, z: Zygosity): GenoToken => {
  if (z === "unknown") return "??";
  if (t === "recessive") return z === "visual" || z === "super" ? "rr" : z === "het" ? "Rr" : "RR";
  return z === "super" ? "DD" : z === "visual" || z === "het" ? "Dd" : "dd";
};

const gametes = (g: GenoToken): Record<string, number> =>
  g === "RR"
    ? { R: 1 }
    : g === "Rr"
    ? { R: 0.5, r: 0.5 }
    : g === "rr"
    ? { r: 1 }
    : g === "DD"
    ? { D: 1 }
    : g === "Dd"
    ? { D: 0.5, d: 0.5 }
    : g === "dd"
    ? { d: 1 }
    : { "?": 1 };

function punnettLocus(t: LocusType, m: GenoToken, f: GenoToken): Record<ChildZygo, number> {
  if (m === "??" || f === "??") {
    return t === "recessive"
      ? { normal: 0, het: 0.5, super: 0, visual: 0.5 }
      : { normal: 0.5, het: 0.5, super: 0, visual: 0 };
  }
  const tally: Record<ChildZygo, number> = { normal: 0, het: 0, super: 0, visual: 0 };
  for (const [am, pm] of Object.entries(gametes(m))) {
    for (const [af, pf] of Object.entries(gametes(f))) {
      const p = (pm as number) * (pf as number);
      if (t === "recessive") {
        const g = [am, af].sort().join("");
        if (g === "RR") tally.normal += p;
        else if (g === "Rr") tally.het += p;
        else tally.visual += p;
      } else {
        const g = [am, af].sort().join("");
        if (g === "DD") tally.super += p;
        else if (g === "Dd") tally.het += p;
        else tally.normal += p;
      }
    }
  }
  return tally;
}

function extractParentGenoFromJson(parent: Snake, locus: LocusJson): GenoToken {
  const z = (parent.genetics || {})[locus.name] as Zygosity | undefined;
  if (z) return mapZygosityToGeno(locus.type, z);

  if (morphSuggestsLocus(parent.morph, locus)) {
    return locus.type === "recessive" ? "rr" : "Dd";
  }

  return locus.type === "recessive" ? "RR" : "dd";
}

function validateAllelicExclusivityFromJson(male: Snake, female: Snake, reg: SpeciesRegistry): ParentViolation[] {
  const groupConf = new Map(reg.groups.map((g) => [g.id, g]));

  const scan = (p: Snake) => {
    const byGroup = new Map<string, string[]>();
    for (const l of reg.loci) {
      if (!l.group) continue;
      const z = (p.genetics || {})[l.name] as Zygosity | undefined;
      const present = z && z !== "normal" && z !== "unknown";
      if (!present) continue;
      const arr = byGroup.get(l.group) || [];
      arr.push(l.label);
      byGroup.set(l.group, arr);
    }
    const vios: ParentViolation[] = [];
    for (const [gid, genes] of byGroup.entries()) {
      const g = groupConf.get(gid);
      if (g?.exclusive && genes.length > 1) {
        vios.push({ parentId: p.id, parentName: p.name || p.id, group: g.label, genes });
      }
    }
    return vios;
  };

  return [...scan(male), ...scan(female)];
}

function formatPhenotype(l: LocusJson, z: ChildZygo, reg: SpeciesRegistry) {
  const superKeyCandidates = [l.name, `${l.name}:2`, `${l.name}:DD`];

  if (l.type === "recessive") {
    if (z === "visual") return { tag: l.label, isVisual: true };
    if (z === "het") return { tag: `het ${l.label}`, isVisual: false };
    return { tag: null, isVisual: false };
  } else {
    if (z === "super") {
      const superName =
        (reg.superNames && superKeyCandidates.map(k => reg.superNames![k]).find(Boolean)) || `Super ${l.label}`;
      return { tag: superName, isVisual: true };
    }
    if (z === "het") return { tag: l.label, isVisual: true };
    return { tag: null, isVisual: false };
  }
}

function applyInterallelicNames(
  tags: string[],
  zByLocus: Record<string, ChildZygo>,
  reg: SpeciesRegistry
): string[] {
  if (!reg.interallelicPhenotypes) return tags;

  const lociByGroup = new Map<string, string[]>();
  for (const l of reg.loci) {
    if (!l.group) continue;
    const zy = zByLocus[l.name];
    if (!zy || zy === "normal") continue;
    lociByGroup.set(l.group, [...(lociByGroup.get(l.group) || []), l.name]);
  }

  const groupConf = new Map(reg.groups.map((g) => [g.id, g]));
  let out = [...tags];

  for (const [gid, alleles] of lociByGroup.entries()) {
    const groupInfo = groupConf.get(gid);
    const allow = groupInfo?.allowInterallelicNames ?? true;
    if (!allow) continue;

    if (alleles.length === 2 && reg.interallelicPhenotypes[gid]) {
      const key = alleles.join("+");
      const keyR = alleles.slice().reverse().join("+");
      const phen = reg.interallelicPhenotypes[gid][key] || reg.interallelicPhenotypes[gid][keyR];
      if (phen) {
        const toRemove = new Set(
          alleles
            .map((a) => {
              const l = reg.loci.find((x) => x.name === a);
              return l ? [l.label.toLowerCase(), `het ${l.label.toLowerCase()}`] : [];
            })
            .flat()
        );
        out = out.filter((t) => !toRemove.has(t.toLowerCase()));
        out.push(phen);
      }
    }
  }

  return out;
}

function applyNamedCombos(tags: string[], zByLocus: Record<string, ChildZygo>, reg: SpeciesRegistry): string[] {
  const combos = reg.namedCombos || {};
  if (!Object.keys(combos).length) return tags;

  const present = new Set<string>();
  for (const l of reg.loci) {
    const zy = zByLocus[l.name];
    if (!zy || zy === "normal") continue;
    if (l.type === "recessive") {
      if (zy === "visual") present.add(l.name);
    } else {
      if (zy === "het" || zy === "super") present.add(l.name);
    }
  }

  let out = [...tags];

  for (const [key, name] of Object.entries(combos)) {
    const req = key.split("+").map((s) => s.trim());
    if (req.every((r) => present.has(r))) {
      const toRemove = new Set(
        req
          .map((a) => {
            const l = reg.loci.find((x) => x.name === a);
            return l ? [l.label.toLowerCase(), `het ${l.label.toLowerCase()}`] : [];
          })
          .flat()
      );
      out = out.filter((t) => !toRemove.has(t.toLowerCase()));
      if (!out.some((t) => t.toLowerCase() === name.toLowerCase())) out.push(name);
    }
  }

  return out;
}

function calculateOffspringFromJson(reg: SpeciesRegistry, male: Snake, female: Snake): GeneticPrediction[] {
  const loci = reg.loci;
  let combos: Array<{ p: number; z: Record<string, ChildZygo> }> = [{ p: 1, z: {} }];

  for (const l of loci) {
    const dist = punnettLocus(l.type, extractParentGenoFromJson(male, l), extractParentGenoFromJson(female, l));
    const next: typeof combos = [];
    for (const c of combos) {
      for (const [zy, pp] of Object.entries(dist)) {
        if (pp > 0) next.push({ p: c.p * (pp as number), z: { ...c.z, [l.name]: zy as ChildZygo } });
      }
    }
    combos = next;
  }

  const byLabel = new Map<string, { p: number; genes: Set<string>; visual: boolean }>();

  for (const c of combos) {
    let tags: string[] = [];

    loci.forEach((l) => {
      const zy = c.z[l.name];
      if (!zy) return;
      const f = formatPhenotype(l, zy, reg);
      if (f.tag) tags.push(f.tag);
    });

    tags = applyInterallelicNames(tags, c.z, reg);

    tags = applyNamedCombos(tags, c.z, reg);

    const uniq = Array.from(new Set(tags));
    const label = uniq.length ? uniq.join(" ") : "Normal";
    const visual = uniq.some((t) => !t.toLowerCase().startsWith("het "));
    const ex = byLabel.get(label);
    if (ex) {
      ex.p += c.p;
      uniq.forEach((t) => ex.genes.add(t));
      ex.visual = ex.visual || visual;
    } else {
      byLabel.set(label, { p: c.p, genes: new Set(uniq), visual });
    }
  }

  const out = Array.from(byLabel.entries())
    .map(([morph, v]) => ({
      morph,
      probability: Math.round(v.p * 1000) / 10,
      isVisual: v.visual,
      genes: Array.from(v.genes),
    }))
    .sort((a, b) => b.probability - a.probability);

  out.forEach((o) => {
    o.probability = Number(o.probability.toFixed(2));
  });
  return out;
}

const normTag = (t: string) => t.trim().toLowerCase();

function computeCommonTags(preds: GeneticPrediction[]): string[] {
  if (!preds.length) return [];
  const counts = new Map<string, { canon: string; count: number }>();
  preds.forEach((p) => {
    const set = new Set(p.genes.map(normTag));
    set.forEach((key) => {
      const canon = p.genes.find((g) => normTag(g) === key) || key;
      const prev = counts.get(key);
      if (prev) prev.count += 1;
      else counts.set(key, { canon, count: 1 });
    });
  });
  const n = preds.length;
  return Array.from(counts.entries())
    .filter(([, v]) => v.count === n)
    .map(([, v]) => v.canon);
}

function withoutCommon(tags: string[], commons: string[]): string[] {
  const set = new Set(commons.map(normTag));
  return tags.filter((t) => !set.has(normTag(t)));
}

const FALLBACK_REG: SpeciesRegistry = {
  version: 1,
  species: { id: "python-regius", label: "Ball Python", aliases: ["python regius", "ball python"] },
  groups: [
    { id: "BEL", label: "Blue-Eyed Leucistic complex", exclusive: true, allowInterallelicNames: true },
    { id: "YB", label: "Yellow Belly complex", exclusive: true, allowInterallelicNames: true },
  ],
  loci: [
    { name: "pastel", label: "Pastel", type: "incomplete" },
    { name: "banana", label: "Banana", type: "incomplete" },
    { name: "yellowbelly", label: "Yellow Belly", type: "incomplete", group: "YB", aliases: ["yb"] },
    { name: "gravel", label: "Gravel", type: "incomplete", group: "YB" },
    { name: "asphalt", label: "Asphalt", type: "incomplete", group: "YB" },
    { name: "mojave", label: "Mojave", type: "incomplete", group: "BEL" },
    { name: "lesser", label: "Lesser", type: "incomplete", group: "BEL" },
    { name: "phantom", label: "Phantom", type: "incomplete", group: "BEL" },
    { name: "clown", label: "Clown", type: "recessive" },
  ],
  interallelicPhenotypes: {
    BEL: {
      "lesser+mojave": "BEL (Lesser Mojave)",
      "lesser+phantom": "BEL (Lesser Phantom)",
    },
    YB: {
      "yellowbelly+gravel": "Highway",
      "yellowbelly+asphalt": "Freeway",
    },
  },
  superNames: {
    pastel: "Super Pastel",
    banana: "Super Banana",
  },
  namedCombos: {},
};

const GeneticsCalculator: React.FC = () => {
  const { user } = useAuth();
  const [snakes, setSnakes] = useState<Snake[]>([]);
  const [maleId, setMaleId] = useState("");
  const [femaleId, setFemaleId] = useState("");
  const [registry, setRegistry] = useState<SpeciesRegistry | null>(null);
  const [predictions, setPredictions] = useState<GeneticPrediction[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [violations, setViolations] = useState<ParentViolation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const mock: Snake[] = [
      {
        id: "1",
        name: "Apollo",
        species: "Ball Python",
        sex: "Male",
        morph: "Mojave",
        birthDate: "2020-04-15",
        weight: 1450,
        length: 130,
        userId: "U1",
        genetics: {
          mojave: "visual",
        },
      },
      {
        id: "2",
        name: "Luna",
        species: "Ball Python",
        sex: "Female",
        morph: "Lesser",
        birthDate: "2021-03-10",
        weight: 1300,
        length: 120,
        userId: "U1",
        genetics: {
          lesser: "visual",
        },
      },
      {
        id: "3",
        name: "Nova",
        species: "Ball Python",
        sex: "Female",
        morph: "Pastel Yellow Belly",
        birthDate: "2022-01-12",
        weight: 950,
        length: 110,
        userId: "U1",
        genetics: {
          pastel: "het",
          yellowbelly: "het",
        },
      },
      {
        id: "4",
        name: "Odin",
        species: "Ball Python",
        sex: "Male",
        morph: "Gravel",
        birthDate: "2021-06-05",
        weight: 1100,
        length: 115,
        userId: "U1",
        genetics: {
          gravel: "visual",
        },
      },
      {
        id: "5",
        name: "Nyx",
        species: "Ball Python",
        sex: "Female",
        morph: "Banana Clown het Pied",
        birthDate: "2020-09-21",
        weight: 1350,
        length: 125,
        userId: "U1",
        genetics: {
          banana: "het",
          clown: "visual",
          pied: "het",
        },
      },
      {
        id: "6",
        name: "Helios",
        species: "Ball Python",
        sex: "Male",
        morph: "Pastel Asphalt",
        birthDate: "2019-12-20",
        weight: 1600,
        length: 135,
        userId: "U1",
        genetics: {
          pastel: "het",
          asphalt: "visual",
        },
      },
      {
        id: "7",
        name: "Echo",
        species: "Corn Snake",
        sex: "Male",
        morph: "Amel",
        birthDate: "2021-05-10",
        weight: 400,
        length: 90,
        userId: "U1",
        genetics: {
          amel: "visual",
        },
      },
      {
        id: "8",
        name: "Cleo",
        species: "Corn Snake",
        sex: "Female",
        morph: "Anery",
        birthDate: "2020-08-02",
        weight: 450,
        length: 95,
        userId: "U1",
        genetics: {
          anery: "visual",
        },
      },
      {
        id: "9",
        name: "Soleil",
        species: "Corn Snake",
        sex: "Female",
        morph: "Hypo Motley",
        birthDate: "2021-03-28",
        weight: 420,
        length: 92,
        userId: "U1",
        genetics: {
          hypo: "visual",
          motley: "visual",
        },
      },
      {
        id: "10",
        name: "Orion",
        species: "Corn Snake",
        sex: "Male",
        morph: "Charcoal",
        birthDate: "2021-06-18",
        weight: 410,
        length: 88,
        userId: "U1",
        genetics: {
          charcoal: "visual",
        },
      },
      {
        id: "11",
        name: "Scarlet",
        species: "Corn Snake",
        sex: "Female",
        morph: "Amel Anery Diffused",
        birthDate: "2019-10-07",
        weight: 470,
        length: 98,
        userId: "U1",
        genetics: {
          amel: "visual",
          anery: "visual",
          diffused: "visual",
        },
      },
      {
        id: "12",
        name: "Zephyr",
        species: "Corn Snake",
        sex: "Male",
        morph: "Hypo Lava",
        birthDate: "2020-05-19",
        weight: 390,
        length: 87,
        userId: "U1",
        genetics: {
          hypo: "visual",
          lava: "visual",
        },
      },
      {
        id: "13",
        name: "Iris",
        species: "Corn Snake",
        sex: "Female",
        morph: "Lavender Motley",
        birthDate: "2021-07-11",
        weight: 440,
        length: 93,
        userId: "U1",
        genetics: {
          lavender: "visual",
          motley: "visual",
        },
      },
      {
        id: "14",
        name: "Atlas",
        species: "Corn Snake",
        sex: "Male",
        morph: "Caramel Hypo",
        birthDate: "2020-12-25",
        weight: 430,
        length: 91,
        userId: "U1",
        genetics: {
          caramel: "visual",
          hypo: "visual",
        },
      },
    ];
    setSnakes(mock);
  }, [user]);

  const males = useMemo(() => snakes.filter((s) => s.sex === "Male"), [snakes]);
  const females = useMemo(() => snakes.filter((s) => s.sex === "Female"), [snakes]);

  async function loadRegistryForPair(male?: Snake, female?: Snake) {
    setRegistry(null);
    setWarnings([]);
    if (!male || !female) return;
    const sm = normalize(male.species);
    const sf = normalize(female.species);
    if (!sm || sm !== sf) {
      setWarnings([
        "Les deux parents doivent être de la même espèce pour un calcul fiable.",
        sm && sf ? `Espèces détectées: "${male.species}" vs "${female.species}".` : "Espèce manquante sur un parent.",
      ]);
      return;
    }

    setLoading(true);
    try {
      const reg = await resolveRegistryForSpeciesName(male.species);
      if (!reg) {
        setWarnings([t('genetics.warn.unsupportedSpecies', { species: male.species })]);
        setRegistry(null);
      } else {
        setRegistry(reg);
      }
    } catch (e) {
      setWarnings((w) => [
        ...w,
        t('genetics.warn.registryFallback'),
      ]);
      setRegistry(FALLBACK_REG);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const m = snakes.find((s) => s.id === maleId);
    const f = snakes.find((s) => s.id === femaleId);
    if (m && f) loadRegistryForPair(m, f);
  }, [maleId, femaleId, snakes]);

  const onCalculate = async () => {
    setWarnings([]);
    setViolations([]);
    setPredictions([]);

    const male = snakes.find((s) => s.id === maleId);
    const female = snakes.find((s) => s.id === femaleId);
    if (!male || !female) return;

    if (!registry) {
      await loadRegistryForPair(male, female);
      if (!registry) return;
    }

    const reg = registry || FALLBACK_REG;

    const vios = validateAllelicExclusivityFromJson(male, female, reg);
    if (vios.length) {
      setViolations(vios);
      setWarnings([
        t('genetics.warn.allelicConflictMessage'),
      ]);
      return;
    }

    const preds = calculateOffspringFromJson(reg, male, female);
    setPredictions(preds);
  };

  const commonTags = useMemo(() => computeCommonTags(predictions), [predictions]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900">{t('genetics.title')}</h3>
        <p className="text-gray-600 mt-1">
          {t('genetics.subtitle')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2" />
            <h4 className="font-semibold text-blue-900">{t('genetics.maleParent')}</h4>
          </div>
          <select
            value={maleId}
            onChange={(e) => setMaleId(e.target.value)}
            className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">{t('genetics.selectMale')}</option>
            {males.map((snake) => (
              <option key={snake.id} value={snake.id}>
                {snake.name} — {snake.species} — {snake.morph}
              </option>
            ))}
          </select>
          {maleId && (
            <div className="mt-4 p-3 bg-white rounded-lg">
              <p className="text-sm font-medium text-gray-900">{snakes.find((s) => s.id === maleId)?.name}</p>
              <p className="text-xs text-gray-600 mt-1">
                {snakes.find((s) => s.id === maleId)?.species} — {t('genetics.morphLabel')}: {snakes.find((s) => s.id === maleId)?.morph}
              </p>
            </div>
          )}
        </div>

        <div className="bg-pink-50 border-2 border-pink-200 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-pink-500 rounded-full mr-2" />
            <h4 className="font-semibold text-pink-900">{t('genetics.femaleParent')}</h4>
          </div>
          <select
            value={femaleId}
            onChange={(e) => setFemaleId(e.target.value)}
            className="w-full px-4 py-3 border border-pink-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
          >
            <option value="">{t('genetics.selectFemale')}</option>
            {females.map((snake) => (
              <option key={snake.id} value={snake.id}>
                {snake.name} — {snake.species} — {snake.morph}
              </option>
            ))}
          </select>
          {femaleId && (
            <div className="mt-4 p-3 bg-white rounded-lg">
              <p className="text-sm font-medium text-gray-900">{snakes.find((s) => s.id === femaleId)?.name}</p>
              <p className="text-xs text-gray-600 mt-1">
                {snakes.find((s) => s.id === femaleId)?.species} — {t('genetics.morphLabel')}: {snakes.find((s) => s.id === femaleId)?.morph}
              </p>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
          <Dna className="h-5 w-5 text-blue-600 mt-0.5" />
          {t('genetics.loadingRegistry')}
        </div>
      )}

      {(warnings.length > 0 || violations.length > 0) && (
        <div className="space-y-3">
          {warnings.map((w, i) => (
            <div key={`w-${i}`} className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-900">{w}</div>
            </div>
          ))}
          {violations.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
                <ShieldAlert className="h-5 w-5" />
                {t('genetics.violations.title')}
              </div>
              <ul className="list-disc list-inside text-sm text-red-900">
                {violations.map((v, i) => (
                  <li key={`v-${i}`}>
                    <strong>{t('genetics.violations.item', { parent: v.parentName, group: v.group, genes: v.genes.join(' + ') })}</strong>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-red-700 mt-2">
                {t('genetics.violations.hint')}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="text-center">
        <button
          onClick={onCalculate}
          disabled={!maleId || !femaleId || loading}
          className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center mx-auto ${
            maleId && femaleId && !loading
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          <Calculator className="h-5 w-5 mr-2" />
          {t('genetics.calculate')}
        </button>
      </div>

      {predictions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Dna className="h-5 w-5 text-green-600 mr-2" />
            {t('genetics.results.title')}
          </h4>

          {commonTags.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800">
              <span className="font-semibold mr-2">{t('genetics.results.commons')}</span>
              {commonTags.map((t) => (
                <span
                  key={t}
                  className="inline-block align-middle text-xs px-2 py-1 mr-2 mb-1 rounded-full bg-gray-200 text-gray-800"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {predictions.map((pred, idx) => {
              const filteredGenes = withoutCommon(pred.genes, commonTags);
              const displayLabel = filteredGenes.length ? filteredGenes.join(" ") : t('genetics.normal');
              const displayIsVisual = filteredGenes.some((t) => !t.toLowerCase().startsWith("het "));

              return (
                <div key={idx} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-gray-900">{displayLabel}</span>
                      {displayIsVisual ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                          Visuel
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full font-medium">
                          Het/Porteur
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      {t('genetics.results.genes')}: {filteredGenes.length ? filteredGenes.join(", ") : "—"}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-green-600">{pred.probability}%</div>
                    <div className="text-xs text-gray-500">{t('genetics.results.probability')}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
            {t('genetics.results.methodNote')}
          </div>
        </div>
      )}

      {predictions.length === 0 && maleId && femaleId && violations.length === 0 && !loading && (
        <div className="text-center py-8">
          <Dna className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t('genetics.emptyAfterSelect')}</p>
        </div>
      )}
    </div>
  );
};

export default GeneticsCalculator;