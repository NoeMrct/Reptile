import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Download,
  Eye,
  QrCode,
  ClipboardList,
  Beaker,
  Baby,
  BadgeCheck,
  Fingerprint,
  Scale,
  Shield,
} from 'lucide-react';
import { Snake, Pairing, Egg, Clutch } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

declare global {
  interface Window {
    QRCode?: any;
    __autotable_loaded__?: boolean;
  }
}

const loadedScripts = new Set<string>();

function loadScriptOnce(src: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (loadedScripts.has(src)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => {
      loadedScripts.add(src);
      resolve();
    };
    s.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(s);
  });
}

async function ensureAutoTable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (window.__autotable_loaded__) return true;

  try {
    await loadScriptOnce(
      'https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js'
    );
    window.__autotable_loaded__ = true;
    return true;
  } catch {
    return false;
  }
}

async function makeQrDataUrl(text: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    if (!window.QRCode) {
      await loadScriptOnce(
        'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js'
      );
    }
    if (window.QRCode && typeof window.QRCode.toDataURL === 'function') {
      return await window.QRCode.toDataURL(text, { width: 128, margin: 1 });
    }
  } catch {}
  return null;
}

const K_SNAKES   = (uid: string) => `snakes_by_user_${uid || 'anonymous'}`;
const K_PAIRINGS = (uid: string) => `pairings_by_user_${uid || 'anonymous'}`;
const K_CLUTCHES = (uid: string) => `clutches_by_user_${uid || 'anonymous'}`;
const K_EGGS     = (uid: string) => `eggs_by_user_${uid || 'anonymous'}`;

type CertificateKind =
  | 'birth'
  | 'pedigree'
  | 'clutch'
  | 'incubation'
  | 'hatch'
  | 'id'
  | 'sexing'
  | 'transfer'
  | 'quarantine';

type FreeForm = {
  vetName?: string;
  operatorName?: string;
  method?: 'popping' | 'probing' | 'echography' | 'autre';
  buyerName?: string;
  sellerName?: string;
  price?: string;
  quarantineStart?: string;
  quarantineEnd?: string;
  location?: string;
  notes?: string;
};

const defaultFreeForm: FreeForm = { method: 'popping' };

/** ********************************************************************
 * Thème PDF + helpers de dessin
 ********************************************************************* */
const THEME = {
  primary: [22, 163, 74] as [number, number, number],
  primaryLight: [209, 250, 229] as [number, number, number],
  grayText: [55, 65, 81] as [number, number, number],
  lightGray: [243, 244, 246] as [number, number, number],
};

function setFillRGB(doc: jsPDF, rgb: [number, number, number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}
function setStrokeRGB(doc: jsPDF, rgb: [number, number, number]) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}
function setTextRGB(doc: jsPDF, rgb: [number, number, number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function certNumber(prefix: string, snakeId: string) {
  const year = new Date().getFullYear();
  const tail = (snakeId || 'X').toString().slice(-6).padStart(6, '0');
  return `${prefix}-${year}-${tail}`;
}
function publicSnakeUrl(snake: Snake) {
  return `https://example.com/snake/${encodeURIComponent(snake.id)}`;
}

function drawBannerHeader(
  doc: jsPDF,
  title: string,
  opts: { certNo?: string; qrDataUrl?: string | null } = {}
) {
  const W = doc.internal.pageSize.getWidth();
  const headerH = 64;

  setFillRGB(doc, THEME.primary);
  doc.rect(0, 0, W, headerH, 'F');

  // Titre
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  setTextRGB(doc, [255, 255, 255]);
  doc.text(title, 32, 38);

  // N° de certificat
  if (opts.certNo) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`N°: ${opts.certNo}`, W - 32, 38, { align: 'right' });
  }

  // QR dans le bandeau (si dispo)
  if (opts.qrDataUrl) {
    try {
      doc.addImage(opts.qrDataUrl, 'PNG', W - 32 - 28, 10, 28, 28);
    } catch {}
  }
}

function drawWatermark(doc: jsPDF, text = 'CERTIFICAT') {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  try {
    doc.saveGraphicsState();
    setTextRGB(doc, [230, 230, 230]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(60);
    // @ts-ignore
    doc.text(text, W / 2, H / 2, { align: 'center', angle: -20 });
  } catch {}
  // @ts-ignore
  if (doc.restoreGraphicsState) doc.restoreGraphicsState();
}

function drawFooterAllPages(doc: jsPDF, label = 'Généré par votre app') {
  const pageCount =
    (doc as any).internal?.getNumberOfPages?.() ?? (doc as any).getNumberOfPages?.() ?? 1;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    setStrokeRGB(doc, [229, 231, 235]);
    doc.line(32, H - 40, W - 32, H - 40);

    setTextRGB(doc, THEME.grayText);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`${label}`, 32, H - 24);
    doc.text(`Page ${i} / ${pageCount}`, W - 32, H - 24, { align: 'right' });
    doc.text(format(new Date(), 'dd/MM/yyyy HH:mm'), W - 32, H - 12, { align: 'right' });
  }
}

function sectionTitle(doc: jsPDF, y: number, text: string) {
  // pastille + titre
  setFillRGB(doc, THEME.primary);
  doc.circle(24, y - 3, 3, 'F');
  setTextRGB(doc, THEME.grayText);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(text, 32, y);
}

function keyValue(doc: jsPDF, x: number, y: number, label: string, value: string) {
  doc.setFontSize(11);
  setTextRGB(doc, THEME.grayText);
  doc.setFont('helvetica', 'bold');
  doc.text(`${label}`, x, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${value}`, x + 120, y);
}

function lightPanel(doc: jsPDF, x: number, y: number, w: number, h: number) {
  setFillRGB(doc, THEME.primaryLight);
  setStrokeRGB(doc, THEME.primary);
  // @ts-ignore
  doc.roundedRect(x, y, w, h, 6, 6, 'FD');
}

function drawSimpleTable(
  doc: jsPDF,
  startY: number,
  headers: string[],
  rows: (string | number | null | undefined)[][]
) {
  const W = doc.internal.pageSize.getWidth();
  const colWidth = (W - 64) / headers.length;
  const rowH = 20;

  // head
  setFillRGB(doc, THEME.primary);
  setTextRGB(doc, [255, 255, 255]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.rect(32, startY, W - 64, rowH, 'F');
  headers.forEach((h, i) => {
    const x = 32 + i * colWidth + 6;
    doc.text(String(h), x, startY + 13);
  });

  // rows
  doc.setFont('helvetica', 'normal');
  rows.forEach((r, idx) => {
    const y = startY + rowH * (idx + 1);
    // alternance
    setFillRGB(doc, idx % 2 ? [255, 255, 255] : THEME.lightGray);
    doc.rect(32, y, W - 64, rowH, 'F');
    setTextRGB(doc, THEME.grayText);
    r.forEach((cell, i) => {
      const x = 32 + i * colWidth + 6;
      doc.text(cell == null ? '' : String(cell), x, y + 13);
    });
  });

  return startY + rowH * (rows.length + 1) + 8;
}

const BirthCertificates: React.FC = () => {
  const { user } = useAuth();
  const ukey = user?.id || '';

  const [snakes, setSnakes] = useState<Snake[]>([]);
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [clutches, setClutches] = useState<Clutch[]>([]);
  const [eggs, setEggs] = useState<Egg[]>([]);

  const [selectedSnakeId, setSelectedSnakeId] = useState<string>('');
  const [selectedClutchId, setSelectedClutchId] = useState<string>('');

  const [freeForm, setFreeForm] = useState<FreeForm>(defaultFreeForm);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(K_SNAKES(ukey));
      if (s) setSnakes(JSON.parse(s));
      else {
        const mock: Snake[] = [
          { id: '1', name: 'Luna', species: 'Ball Python', morph: 'Pastel', sex: 'Female', birthDate: '2025-03-18', weight: 120, length: 35, userId: ukey },
          { id: '2', name: 'Thor', species: 'Ball Python', morph: 'Anery', sex: 'Male', birthDate: '2023-06-10', weight: 850, length: 95, userId: ukey },
        ];
        setSnakes(mock);
        localStorage.setItem(K_SNAKES(ukey), JSON.stringify(mock));
      }
    } catch {}

    try {
      const p = localStorage.getItem(K_PAIRINGS(ukey));
      if (p) setPairings(JSON.parse(p));
      else {
        const mock: Pairing[] = [
          { id: 'p1', maleSnakeId: '2', femaleSnakeId: '1', pairingDate: '2024-12-05', status: 'successful', userId: ukey, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ];
        setPairings(mock);
        localStorage.setItem(K_PAIRINGS(ukey), JSON.stringify(mock));
      }
    } catch {}

    try {
      const c = localStorage.getItem(K_CLUTCHES(ukey));
      if (c) setClutches(JSON.parse(c));
      else {
        const mock: Clutch[] = [
          { id: 'c1', pairingId: 'p1', laidDate: '2025-01-15', eggCount: 8, fertileCount: 7, incubationTemp: 31.5, incubationHumidity: 90, expectedHatchDate: '2025-03-15', notes: 'Première ponte de Luna', userId: ukey, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ];
        setClutches(mock);
        localStorage.setItem(K_CLUTCHES(ukey), JSON.stringify(mock));
      }
    } catch {}

    try {
      const e = localStorage.getItem(K_EGGS(ukey));
      if (e) setEggs(JSON.parse(e));
      else {
        const mock: Egg[] = Array.from({ length: 8 }, (_, i) => ({
          id: `e${i + 1}`,
          clutchId: 'c1',
          eggNumber: i + 1,
          status: i === 7 ? 'infertile' : 'incubating',
          weight: Math.round((55 + Math.random() * 10) * 10) / 10,
          userId: ukey,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        setEggs(mock);
        localStorage.setItem(K_EGGS(ukey), JSON.stringify(mock));
      }
    } catch {}
  }, [ukey]);

  const selectedSnake = useMemo(
    () => snakes.find((s) => s.id === selectedSnakeId) || null,
    [snakes, selectedSnakeId]
  );
  const selectedClutch = useMemo(
    () => clutches.find((c) => c.id === selectedClutchId) || null,
    [clutches, selectedClutchId]
  );
  const snakePairing = useMemo(() => {
    if (!selectedSnake) return null;
    const p = pairings.find(
      (pp) => pp.femaleSnakeId === selectedSnake.id || pp.maleSnakeId === selectedSnake.id
    );
    return p || null;
  }, [selectedSnake, pairings]);

  const eggsOfClutch = useMemo(
    () =>
      selectedClutch
        ? eggs
            .filter((e) => e.clutchId === selectedClutch.id)
            .sort((a, b) => a.eggNumber - b.eggNumber)
        : [],
    [selectedClutch, eggs]
  );

  function getSnakeName(id: string) {
    return snakes.find((s) => s.id === id)?.name || '—';
  }

  async function generate(kind: CertificateKind) {
    if (!selectedSnake) {
      alert('Sélectionne d’abord un serpent.');
      return;
    }
    setBusy(true);
    setPreviewUrl(null);
    setDownloadName('');

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const certNo = certNumber(kind.toUpperCase(), selectedSnake.id);
    const qr = await makeQrDataUrl(publicSnakeUrl(selectedSnake));

    (doc as any).setProperties?.({
      title: `${kind} - ${selectedSnake.name || selectedSnake.id}`,
      subject: 'Certificat généré',
      creator: 'Reptile Manager',
    });

    drawWatermark(doc, 'REPTILES');

    switch (kind) {
      case 'birth':
        await renderBirthCertificate(doc, selectedSnake, snakePairing, certNo, qr);
        break;
      case 'pedigree':
        await renderPedigree(doc, selectedSnake, pairings, snakes, certNo, qr);
        break;
      case 'clutch':
        await renderClutchReport(doc, selectedSnake, selectedClutch, snakePairing, eggsOfClutch, certNo, qr);
        break;
      case 'incubation':
        await renderIncubationReport(doc, selectedClutch, eggsOfClutch, certNo, qr);
        break;
      case 'hatch':
        await renderHatchCertificate(doc, selectedSnake, selectedClutch, certNo, qr);
        break;
      case 'id':
        await renderIdentificationCertificate(doc, selectedSnake, certNo, qr);
        break;
      case 'sexing':
        await renderSexingCertificate(doc, selectedSnake, freeForm, certNo, qr);
        break;
      case 'transfer':
        await renderTransferCertificate(doc, selectedSnake, freeForm, certNo, qr);
        break;
      case 'quarantine':
        await renderQuarantineAttestation(doc, selectedSnake, freeForm, certNo, qr);
        break;
    }

    // Footer pagination + date
    drawFooterAllPages(doc, 'Certificat généré par votre application');

    // Créer l’aperçu mais NE PAS télécharger
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setDownloadName(`${kind}_${(selectedSnake.name || selectedSnake.id).replace(/\s+/g, '_')}.pdf`);
    setBusy(false);
  }

  async function renderBirthCertificate(
    doc: jsPDF,
    snake: Snake,
    p: Pairing | null,
    certNo: string,
    qr: string | null
  ) {
    drawBannerHeader(doc, 'Certificat de Naissance', { certNo, qrDataUrl: qr });

    let y = 96;

    sectionTitle(doc, y, 'Juvénile'); y += 20;
    keyValue(doc, 40, y, 'Nom', snake.name || '—'); y += 16;
    keyValue(doc, 40, y, 'Espèce', snake.species || '—'); y += 16;
    keyValue(doc, 40, y, 'Morph', snake.morph || '—'); y += 16;
    keyValue(doc, 40, y, 'Sexe', snake.sex || '—'); y += 16;
    keyValue(doc, 40, y, 'Date de naissance', format(new Date(snake.birthDate), 'dd MMM yyyy')); y += 16;
    keyValue(doc, 40, y, 'Poids actuel', `${snake.weight ?? '—'} g`); y += 16;
    keyValue(doc, 40, y, 'Longueur actuelle', `${snake.length ?? '—'} cm`); y += 24;

    sectionTitle(doc, y, 'Parents'); y += 20;
    keyValue(doc, 40, y, 'Mâle', p ? getSnakeName(p.maleSnakeId) : '—'); y += 16;
    keyValue(doc, 40, y, 'Femelle', p ? getSnakeName(p.femaleSnakeId) : '—'); y += 24;

    lightPanel(doc, 32, y, doc.internal.pageSize.getWidth() - 64, 70);
    setTextRGB(doc, THEME.grayText);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Certifie que l’animal décrit ci-dessus est né en captivité (CB).', 44, y + 22);
    doc.text('Signature de l’éleveur : ______________________', 44, y + 46);
    doc.text('Date : ____ / ____ / ______', 360, y + 46);
  }

  async function renderPedigree(
    doc: jsPDF,
    snake: Snake,
    pairings: Pairing[],
    snakes: Snake[],
    certNo: string,
    qr: string | null
  ) {
    drawBannerHeader(doc, 'Pédigrée (3 générations)', { certNo, qrDataUrl: qr });

    let y = 96;
    sectionTitle(doc, y, 'Sujet'); y += 20;
    keyValue(doc, 40, y, 'Nom', snake.name || '—'); y += 16;
    keyValue(doc, 40, y, 'Espèce', snake.species || '—'); y += 16;
    keyValue(doc, 40, y, 'Morph', snake.morph || '—'); y += 24;

    const p = pairings.find((pp) => pp.femaleSnakeId === snake.id || pp.maleSnakeId === snake.id) || null;
    const father = p ? snakes.find((s) => s.id === p.maleSnakeId) : null;
    const mother = p ? snakes.find((s) => s.id === p.femaleSnakeId) : null;

    sectionTitle(doc, y, 'Parents (G1)'); y += 20;
    keyValue(doc, 40, y, 'Père', father ? `${father.name} (${father.morph})` : '—'); y += 16;
    keyValue(doc, 40, y, 'Mère', mother ? `${mother.name} (${mother.morph})` : '—'); y += 24;

    const pf = father ? pairings.find((pp) => pp.femaleSnakeId === father.id || pp.maleSnakeId === father.id) : null;
    const pm = mother ? pairings.find((pp) => pp.femaleSnakeId === mother.id || pp.maleSnakeId === mother.id) : null;

    const gfather_f = pf ? snakes.find((s) => s.id === pf.maleSnakeId) : null;
    const gfather_m = pm ? snakes.find((s) => s.id === pm.maleSnakeId) : null;
    const gmother_f = pf ? snakes.find((s) => s.id === pf.femaleSnakeId) : null;
    const gmother_m = pm ? snakes.find((s) => s.id === pm.femaleSnakeId) : null;

    sectionTitle(doc, y, 'Grands-parents (G2)'); y += 20;
    keyValue(doc, 40, y, 'Grand-père paternel', gfather_f ? `${gfather_f.name} (${gfather_f.morph})` : '—'); y += 16;
    keyValue(doc, 40, y, 'Grand-mère paternelle', gmother_f ? `${gmother_f.name} (${gmother_f.morph})` : '—'); y += 16;
    keyValue(doc, 40, y, 'Grand-père maternel', gfather_m ? `${gfather_m.name} (${gfather_m.morph})` : '—'); y += 16;
    keyValue(doc, 40, y, 'Grand-mère maternelle', gmother_m ? `${gmother_m.name} (${gmother_m.morph})` : '—'); y += 24;

    sectionTitle(doc, y, 'Arrière-grands-parents (G3)'); y += 20;
    doc.setFont('helvetica', 'italic'); doc.setFontSize(10);
    setTextRGB(doc, THEME.grayText);
    doc.text('Renseigner via données étendues si disponibles (non fournies par défaut).', 40, y);
  }

  async function renderClutchReport(
    doc: jsPDF,
    snake: Snake,
    clutch: Clutch | null,
    p: Pairing | null,
    clutchEggs: Egg[],
    certNo: string,
    qr: string | null
  ) {
    drawBannerHeader(doc, 'Rapport de ponte', { certNo, qrDataUrl: qr });

    let y = 96;
    sectionTitle(doc, y, 'Informations générales'); y += 20;
    keyValue(doc, 40, y, 'Sujet', snake.name || '—'); y += 16;
    keyValue(doc, 40, y, 'Couple', p ? `${getSnakeName(p.maleSnakeId)} × ${getSnakeName(p.femaleSnakeId)}` : '—'); y += 16;
    keyValue(doc, 40, y, 'Date de ponte', clutch ? format(new Date(clutch.laidDate), 'dd MMM yyyy') : '—'); y += 16;
    keyValue(doc, 40, y, 'Œufs (total/fertiles)', clutch ? `${clutch.eggCount} / ${clutch.fertileCount ?? 0}` : '—'); y += 16;
    keyValue(doc, 40, y, 'Incubation (T°/HR)', clutch ? `${clutch.incubationTemp ?? '—'} °C / ${clutch.incubationHumidity ?? '—'} %` : '—'); y += 24;

    sectionTitle(doc, y, 'Détail des œufs'); y += 14;

    const hasAutoTable = await ensureAutoTable();
    const rows = clutchEggs.map((e) => [
      e.eggNumber,
      e.status,
      e.weight == null ? '—' : `${e.weight} g`,
    ]);

    if (hasAutoTable && (doc as any).autoTable) {
      (doc as any).autoTable({
        head: [['#', 'Statut', 'Poids']],
        body: rows,
        startY: y,
        styles: { font: 'helvetica', fontSize: 10, textColor: THEME.grayText },
        theme: 'grid',
        headStyles: { fillColor: THEME.primary, textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: THEME.lightGray },
        margin: { left: 32, right: 32 },
      });
    } else {
      y = drawSimpleTable(doc, y, ['#', 'Statut', 'Poids'], rows);
    }
  }

  async function renderIncubationReport(
    doc: jsPDF,
    clutch: Clutch | null,
    clutchEggs: Egg[],
    certNo: string,
    qr: string | null
  ) {
    drawBannerHeader(doc, 'Rapport d’incubation', { certNo, qrDataUrl: qr });

    let y = 96;
    sectionTitle(doc, y, 'Paramètres'); y += 20;
    keyValue(doc, 40, y, 'Date de ponte', clutch ? format(new Date(clutch.laidDate), 'dd MMM yyyy') : '—'); y += 16;
    keyValue(doc, 40, y, 'T° cible', clutch?.incubationTemp != null ? `${clutch.incubationTemp} °C` : '—'); y += 16;
    keyValue(doc, 40, y, 'Humidité cible', clutch?.incubationHumidity != null ? `${clutch.incubationHumidity} %` : '—'); y += 24;

    sectionTitle(doc, y, 'Suivi (statuts & poids)'); y += 14;

    const hasAutoTable = await ensureAutoTable();
    const rows = clutchEggs.map((e) => [
      e.eggNumber,
      e.status,
      e.weight == null ? '—' : `${e.weight} g`,
      e.updatedAt ? format(new Date(e.updatedAt), 'dd/MM/yy HH:mm') : '—',
    ]);

    if (hasAutoTable && (doc as any).autoTable) {
      (doc as any).autoTable({
        head: [['#', 'Statut', 'Poids', 'Dernière mise à jour']],
        body: rows,
        startY: y,
        styles: { font: 'helvetica', fontSize: 10, textColor: THEME.grayText },
        theme: 'grid',
        headStyles: { fillColor: THEME.primary, textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: THEME.lightGray },
        margin: { left: 32, right: 32 },
      });
    } else {
      y = drawSimpleTable(doc, y, ['#', 'Statut', 'Poids', 'MAJ'], rows);
    }

    const finalY = (doc as any).lastAutoTable?.finalY;
    if (finalY) {
      lightPanel(doc, 32, finalY + 16, doc.internal.pageSize.getWidth() - 64, 46);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      setTextRGB(doc, THEME.grayText);
      doc.text('Conseil : pour les courbes T°/HR, enregistre des logs et exporte-les ici.', 44, finalY + 45);
    }
  }

  async function renderHatchCertificate(
    doc: jsPDF,
    snake: Snake,
    clutch: Clutch | null,
    certNo: string,
    qr: string | null
  ) {
    drawBannerHeader(doc, 'Certificat d’éclosion', { certNo, qrDataUrl: qr });

    let y = 96;
    sectionTitle(doc, y, 'Informations'); y += 20;
    keyValue(doc, 40, y, 'Nom', snake.name || '—'); y += 16;
    keyValue(doc, 40, y, 'Espèce', snake.species || '—'); y += 16;
    keyValue(doc, 40, y, 'Morph', snake.morph || '—'); y += 16;
    keyValue(doc, 40, y, 'Date d’éclosion', format(new Date(snake.birthDate), 'dd MMM yyyy')); y += 16;
    keyValue(doc, 40, y, 'Ponte', clutch ? `${format(new Date(clutch.laidDate), 'dd MMM yyyy')} (${clutch.eggCount} œufs)` : '—'); y += 24;

    lightPanel(doc, 32, y, doc.internal.pageSize.getWidth() - 64, 70);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    setTextRGB(doc, THEME.grayText);
    doc.text('Je soussigné(e), atteste de l’éclosion en captivité de l’animal décrit ci-dessus.', 44, y + 22);
    doc.text('Signature de l’éleveur : ______________________', 44, y + 46);
    doc.text('Date : ____ / ____ / ______', 360, y + 46);
  }

  async function renderIdentificationCertificate(
    doc: jsPDF,
    snake: Snake,
    certNo: string,
    qr: string | null
  ) {
    drawBannerHeader(doc, 'Certificat d’identification', { certNo, qrDataUrl: qr });

    let y = 96;
    sectionTitle(doc, y, 'Animal'); y += 20;
    keyValue(doc, 40, y, 'Nom', snake.name || '—'); y += 16;
    keyValue(doc, 40, y, 'Espèce', snake.species || '—'); y += 16;
    keyValue(doc, 40, y, 'Morph', snake.morph || '—'); y += 16;
    keyValue(doc, 40, y, 'Sexe', snake.sex || '—'); y += 16;
    keyValue(doc, 40, y, 'Identifiant interne', snake.id); y += 24;

    lightPanel(doc, 32, y, doc.internal.pageSize.getWidth() - 64, 70);
    doc.setFont('helvetica', 'italic'); doc.setFontSize(10); setTextRGB(doc, THEME.grayText);
    doc.text('Ajoute ici le n° de microchip si applicable.', 44, y + 22);
    doc.setFont('helvetica', 'normal');
    doc.text('Éleveur : ______________________', 44, y + 46);
    doc.text('Propriétaire : ______________________', 320, y + 46);
  }

  async function renderSexingCertificate(
    doc: jsPDF,
    snake: Snake,
    ff: FreeForm,
    certNo: string,
    qr: string | null
  ) {
    drawBannerHeader(doc, 'Certificat de sexage', { certNo, qrDataUrl: qr });

    let y = 96;
    sectionTitle(doc, y, 'Animal'); y += 20;
    keyValue(doc, 40, y, 'Nom', snake.name || '—'); y += 16;
    keyValue(doc, 40, y, 'Espèce', snake.species || '—'); y += 16;
    keyValue(doc, 40, y, 'Morph', snake.morph || '—'); y += 24;

    sectionTitle(doc, y, 'Résultat'); y += 20;
    keyValue(doc, 40, y, 'Sexe déterminé', snake.sex || '—'); y += 16;
    keyValue(doc, 40, y, 'Méthode', ff.method || '—'); y += 16;
    keyValue(doc, 40, y, 'Opérateur', ff.operatorName || '—'); y += 24;

    lightPanel(doc, 32, y, doc.internal.pageSize.getWidth() - 64, 58);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); setTextRGB(doc, THEME.grayText);
    doc.text('Signature : ______________________', 44, y + 24);
    doc.text('Date : ____ / ____ / ______', 360, y + 24);
  }

  async function renderTransferCertificate(
    doc: jsPDF,
    snake: Snake,
    ff: FreeForm,
    certNo: string,
    qr: string | null
  ) {
    drawBannerHeader(doc, 'Certificat de cession / facture', { certNo, qrDataUrl: qr });

    let y = 96;
    sectionTitle(doc, y, 'Animal'); y += 20;
    keyValue(doc, 40, y, 'Nom', snake.name || '—'); y += 16;
    keyValue(doc, 40, y, 'Espèce', snake.species || '—'); y += 16;
    keyValue(doc, 40, y, 'Morph', snake.morph || '—'); y += 24;

    sectionTitle(doc, y, 'Parties'); y += 20;
    keyValue(doc, 40, y, 'Vendeur', ff.sellerName || '—'); y += 16;
    keyValue(doc, 40, y, 'Acheteur', ff.buyerName || '—'); y += 16;
    keyValue(doc, 40, y, 'Prix', ff.price || '—'); y += 24;

    lightPanel(doc, 32, y, doc.internal.pageSize.getWidth() - 64, 70);
    doc.setFont('helvetica', 'italic'); doc.setFontSize(10); setTextRGB(doc, THEME.grayText);
    doc.text('Conditions de garantie, retour, transport : à préciser ici.', 44, y + 22);
    doc.setFont('helvetica', 'normal');
    doc.text('Vendeur : ______________________', 44, y + 46);
    doc.text('Acheteur : ______________________', 320, y + 46);
  }

  async function renderQuarantineAttestation(
    doc: jsPDF,
    snake: Snake,
    ff: FreeForm,
    certNo: string,
    qr: string | null
  ) {
    drawBannerHeader(doc, 'Attestation de quarantaine', { certNo, qrDataUrl: qr });

    let y = 96;
    sectionTitle(doc, y, 'Animal'); y += 20;
    keyValue(doc, 40, y, 'Nom', snake.name || '—'); y += 16;
    keyValue(doc, 40, y, 'Espèce', snake.species || '—'); y += 16;
    keyValue(doc, 40, y, 'Morph', snake.morph || '—'); y += 24;

    sectionTitle(doc, y, 'Période de quarantaine'); y += 20;
    keyValue(doc, 40, y, 'Début', ff.quarantineStart ? format(new Date(ff.quarantineStart), 'dd/MM/yy') : '—'); y += 16;
    keyValue(doc, 40, y, 'Fin', ff.quarantineEnd ? format(new Date(ff.quarantineEnd), 'dd/MM/yy') : '—'); y += 16;
    keyValue(doc, 40, y, 'Lieu', ff.location || '—'); y += 24;

    lightPanel(doc, 32, y, doc.internal.pageSize.getWidth() - 64, 58);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); setTextRGB(doc, THEME.grayText);
    doc.text('Attesté par : ______________________', 44, y + 24);
    doc.text('Date : ____ / ____ / ______', 320, y + 24);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Certificats & Export PDF</h3>
          <p className="text-gray-600 mt-1">Génère les certificats puis télécharge-les depuis l’aperçu.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Serpent</label>
          <select
            value={selectedSnakeId}
            onChange={(e) => setSelectedSnakeId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">Sélectionner un serpent…</option>
            {snakes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.morph} ({s.sex})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            Astuce : ajoute des champs (microchip, photos) côté modèle pour enrichir les PDF.
          </p>
        </div>

        <div className="bg-white border rounded-xl p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Ponte (optionnelle)</label>
          <select
            value={selectedClutchId}
            onChange={(e) => setSelectedClutchId(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="">—</option>
            {clutches.map((c) => (
              <option key={c.id} value={c.id}>
                {format(new Date(c.laidDate), 'dd MMM yyyy')} — {c.eggCount} œufs
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Opérateur (sexage)</label>
              <input
                value={freeForm.operatorName || ''}
                onChange={(e) => setFreeForm((f) => ({ ...f, operatorName: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="Ex: Dr Dupont"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Méthode</label>
              <select
                value={freeForm.method || 'popping'}
                onChange={(e) => setFreeForm((f) => ({ ...f, method: e.target.value as any }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="popping">Popping</option>
                <option value="probing">Probing</option>
                <option value="echography">Échographie</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Vendeur</label>
              <input
                value={freeForm.sellerName || ''}
                onChange={(e) => setFreeForm((f) => ({ ...f, sellerName: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="Éleveur / Société"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Acheteur</label>
              <input
                value={freeForm.buyerName || ''}
                onChange={(e) => setFreeForm((f) => ({ ...f, buyerName: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="Nom de l’acheteur"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Prix</label>
              <input
                value={freeForm.price || ''}
                onChange={(e) => setFreeForm((f) => ({ ...f, price: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="€"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Lieu (quarantaine)</label>
              <input
                value={freeForm.location || ''}
                onChange={(e) => setFreeForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="Ex: Local dédié, rack 2"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Début (quarantaine)</label>
              <input
                type="date"
                value={freeForm.quarantineStart || ''}
                onChange={(e) => setFreeForm((f) => ({ ...f, quarantineStart: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Fin (quarantaine)</label>
              <input
                type="date"
                value={freeForm.quarantineEnd || ''}
                onChange={(e) => setFreeForm((f) => ({ ...f, quarantineEnd: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        <button onClick={() => generate('birth')} className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border hover:shadow" disabled={busy} title="Certificat de naissance">
          <Baby className="w-4 h-4" /> Naissance
        </button>

        <button onClick={() => generate('pedigree')} className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border hover:shadow" disabled={busy} title="Pédigrée 3 générations">
          <ClipboardList className="w-4 h-4" /> Pédigrée
        </button>

        <button onClick={() => generate('clutch')} className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border hover:shadow" disabled={busy} title="Rapport de ponte">
          <FileText className="w-4 h-4" /> Rapport ponte
        </button>

        <button onClick={() => generate('incubation')} className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border hover:shadow" disabled={busy} title="Rapport d’incubation">
          <Beaker className="w-4 h-4" /> Incubation
        </button>

        <button onClick={() => generate('hatch')} className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border hover:shadow" disabled={busy} title="Certificat d’éclosion">
          <BadgeCheck className="w-4 h-4" /> Éclosion
        </button>

        <button onClick={() => generate('id')} className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border hover:shadow" disabled={busy} title="Certificat d’identification">
          <Fingerprint className="w-4 h-4" /> Identification
        </button>

        <button onClick={() => generate('sexing')} className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border hover:shadow" disabled={busy} title="Certificat de sexage">
          <Scale className="w-4 h-4" /> Sexage
        </button>

        <button onClick={() => generate('transfer')} className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border hover:shadow" disabled={busy} title="Certificat de cession / vente">
          <Download className="w-4 h-4" /> Cession / Vente
        </button>

        <button onClick={() => generate('quarantine')} className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border hover:shadow" disabled={busy} title="Attestation de quarantaine">
          <Shield className="w-4 h-4" /> Quarantaine
        </button>
      </div>

      {previewUrl && (
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span className="font-medium">Aperçu PDF</span>
            </div>
            <a
              href={previewUrl}
              download={downloadName || 'certificat.pdf'}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${previewUrl ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300'} text-white`}
              aria-disabled={!previewUrl}
            >
              <Download className="w-4 h-4" />
              Télécharger
            </a>
          </div>
          <iframe title="pdf-preview" src={previewUrl} className="w-full h-[70vh] rounded-lg border" />
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <QrCode className="w-3 h-3" />
            Les QR codes et tableaux avancés se chargent via CDN. Sans réseau, le PDF reste lisible (fallback).
          </p>
        </div>
      )}
    </div>
  );
};

export default BirthCertificates;
