import React, { useEffect, useMemo, useRef, useState } from "react";
import { GitBranch, Plus, LayoutGrid, Columns, Rows, ListTree, Table, Download } from "lucide-react";
import { Snake } from "../../types";
import { useAuth } from "../../context/AuthContext";

type TreeNode = {
  snake: Snake;
  children: TreeNode[];
  level: number;
};

type AncestorRow = {
  snake: Snake | null;
  generation: number;
  relation: string;
  parentMaleId?: string | null;
  parentFemaleId?: string | null;
};

type ViewMode = "vertical" | "horizontal" | "grid" | "table" | "compact";

const REL = {
  father: "Père",
  mother: "Mère",
  paternalGrandfather: "Grand-père paternel",
  paternalGrandmother: "Grand-mère paternelle",
  maternalGrandfather: "Grand-père maternel",
  maternalGrandmother: "Grand-mère maternelle",
};

const PedigreeTab: React.FC = () => {
  const { user } = useAuth();
  const [snakes, setSnakes] = useState<Snake[]>([]);
  const [selectedSnake, setSelectedSnake] = useState<Snake | null>(null);
  const [view, setView] = useState<ViewMode>("vertical");
  const [maxGen, setMaxGen] = useState<number>(3);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showParentsModal, setShowParentsModal] = useState(false);
  const [fatherId, setFatherId] = useState<string>("");
  const [motherId, setMotherId] = useState<string>("");
  const males = useMemo(() => snakes.filter((s) => s.sex === "Male"), [snakes]);
  const females = useMemo(() => snakes.filter((s) => s.sex === "Female"), [snakes]);

  useEffect(() => {
    const mockSnakes: Snake[] = [
      {
        id: "1",
        name: "Luna",
        species: "Ball Python",
        morph: "Pastel",
        sex: "Female",
        birthDate: "2022-03-15",
        weight: 1200,
        length: 120,
        imageUrl:
          "https://images.pexels.com/photos/45863/python-snake-reptile-green-45863.jpeg?auto=compress&cs=tinysrgb&w=400",
        parentMaleId: "3",
        parentFemaleId: "4",
        userId: user?.id || "",
      },
      {
        id: "2",
        name: "Thor",
        species: "Ball Python",
        morph: "Anery",
        sex: "Male",
        birthDate: "2021-08-20",
        weight: 800,
        length: 95,
        imageUrl:
          "https://images.pexels.com/photos/8142977/pexels-photo-8142977.jpeg?auto=compress&cs=tinysrgb&w=400",
        parentMaleId: "5",
        parentFemaleId: "6",
        userId: user?.id || "",
      },
      {
        id: "3",
        name: "Apollo",
        species: "Ball Python",
        morph: "Normal",
        sex: "Male",
        birthDate: "2020-01-10",
        weight: 1500,
        length: 140,
        userId: user?.id || "",
      },
      {
        id: "4",
        name: "Diana",
        species: "Ball Python",
        morph: "Pastel",
        sex: "Female",
        birthDate: "2019-11-20",
        weight: 1400,
        length: 135,
        userId: user?.id || "",
      },
      {
        id: "5",
        name: "Zeus",
        species: "Ball Python",
        morph: "Anery",
        sex: "Male",
        birthDate: "2019-05-15",
        weight: 1600,
        length: 145,
        userId: user?.id || "",
      },
      {
        id: "6",
        name: "Hera",
        species: "Ball Python",
        morph: "Normal",
        sex: "Female",
        birthDate: "2019-08-22",
        weight: 1450,
        length: 138,
        userId: user?.id || "",
      },
    ];

    setSnakes(mockSnakes);
    if (mockSnakes.length > 0) setSelectedSnake(mockSnakes[0]);
  }, [user]);

  const findById = (id?: string | null) => (id ? snakes.find((s) => s.id === id) || null : null);

  const buildPedigreeTree = (snake: Snake, level = 0): TreeNode => {
    const children: TreeNode[] = [];
    const father = findById(snake.parentMaleId || null);
    const mother = findById(snake.parentFemaleId || null);
    if (father) children.push(buildPedigreeTree(father, level + 1));
    if (mother) children.push(buildPedigreeTree(mother, level + 1));
    return { snake, children, level };
  };

  const listAncestors = (snake: Snake, generations = 3): AncestorRow[] => {
    const rows: AncestorRow[] = [
      { snake, generation: 0, relation: "Individu", parentMaleId: snake.parentMaleId, parentFemaleId: snake.parentFemaleId },
    ];

    const walk = (
      s: Snake | null,
      gen: number,
      sidePath: ("paternal" | "maternal")[]
    ) => {
      if (!s || gen > generations) return;

      const rel = (() => {
        if (gen === 1) return sidePath[0] === "paternal" ? REL.father : REL.mother;
        if (gen === 2) {
          if (sidePath[0] === "paternal") return sidePath[1] === "paternal" ? REL.paternalGrandfather : REL.paternalGrandmother;
          return sidePath[1] === "paternal" ? REL.maternalGrandfather : REL.maternalGrandmother;
        }
        const side = sidePath.map((p) => (p === "paternal" ? "paternel" : "maternel")).join("/");
        return `${gen === 3 ? "Arrière-grand-" : `${gen - 1}x arrière-grand-`}parent ${side}`;
      })();

      rows.push({
        snake: s,
        generation: gen,
        relation: rel,
        parentMaleId: s.parentMaleId,
        parentFemaleId: s.parentFemaleId,
      });

      walk(findById(s.parentMaleId), gen + 1, [...sidePath, "paternal"]);
      walk(findById(s.parentFemaleId), gen + 1, [...sidePath, "maternal"]);
    };

    walk(findById(snake.parentMaleId), 1, ["paternal"]);
    walk(findById(snake.parentFemaleId), 1, ["maternal"]);

    return rows;
  };

  const pedigreeTree = useMemo(() => (selectedSnake ? buildPedigreeTree(selectedSnake) : null), [selectedSnake, snakes]);
  const ancestorRows = useMemo(() => (selectedSnake ? listAncestors(selectedSnake, maxGen) : []), [selectedSnake, snakes, maxGen]);

  const Card: React.FC<{ s: Snake | null; label?: string } & React.HTMLAttributes<HTMLDivElement>> = ({ s, label, className = "", ...rest }) => (
    <div
      className={
        "relative bg-white border-2 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow min-w-[200px] " +
        (s?.sex === "Male" ? "border-blue-500" : s?.sex === "Female" ? "border-pink-500" : "border-gray-300") +
        (className ? ` ${className}` : "")
      }
      {...rest}
    >
      {label && (
        <span className="absolute -top-2 left-3 text-[10px] px-2 py-0.5 rounded-full border bg-white text-gray-700">
          {label}
        </span>
      )}
      {s ? (
        <>
          <div className="flex items-center space-x-3 mb-2">
            {s.imageUrl && (
              <img src={s.imageUrl} alt={s.name} className="w-12 h-12 rounded-full object-cover" />
            )}
            <div>
              <p className="font-semibold text-gray-900">{s.name}</p>
              <p className="text-xs text-gray-600">{s.morph || "—"}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            <p>{s.sex || "—"}</p>
            {s.birthDate && <p>{new Date(s.birthDate).getFullYear()}</p>}
          </div>
        </>
      ) : (
        <div className="text-gray-400 text-sm">Inconnu</div>
      )}
    </div>
  );

  const Divider = () => <div className="h-px bg-gray-200 my-2" />;

  const renderVertical = (node: TreeNode): React.ReactNode => {
    const hasParents = node.children.length > 0 && node.level < maxGen;
    return (
      <div key={node.snake.id} className="relative pl-6">
        {node.level > 0 && (
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-px bg-gray-300" />
        )}
        <Card s={node.snake} />
        {hasParents && (
          <div className="mt-4 ml-6 border-l-2 border-gray-200 pl-4 space-y-6 relative">
            {node.children.map((child) => (
              <div key={child.snake.id} className="relative">
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-px bg-gray-300" />
                <div className="pl-0">{renderVertical(child)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderHorizontal = (): React.ReactNode => {
    const cols: AncestorRow[][] = [];
    ancestorRows.forEach((r) => {
      if (r.generation > maxGen) return;
      cols[r.generation] = cols[r.generation] || [];
      cols[r.generation].push(r);
    });

    return (
      <div className="flex gap-8 overflow-x-auto pb-2 items-start">
        {cols.map((genRows, gen) => (
          <div key={gen} className="min-w-[280px]">
            <div className="sticky top-0 z-10 bg-gray-100/80 backdrop-blur border rounded-md px-3 py-1.5 text-sm font-semibold text-gray-700 mb-3">
              Génération {gen}
            </div>
            <div className="flex flex-col gap-4">
              {genRows.map((r, i) => (
                <Card key={`${gen}-${i}-${r.snake?.id || "x"}`} s={r.snake} label={gen === 0 ? "Individu" : r.relation} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderGrid = (): React.ReactNode => {
    const perGen: Record<number, AncestorRow[]> = {};
    ancestorRows.forEach((r) => {
      if (r.generation > maxGen) return;
      perGen[r.generation] = perGen[r.generation] || [];
      perGen[r.generation].push(r);
    });

    return (
      <div className="space-y-6">
        {Object.keys(perGen)
          .map((k) => parseInt(k, 10))
          .sort((a, b) => a - b)
          .map((gen) => (
            <div key={gen}>
              <div className="text-sm font-semibold text-gray-700 mb-3">Génération {gen}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {perGen[gen].map((r, i) => (
                  <Card key={`${gen}-${i}-${r.snake?.id || "x"}`} s={r.snake} />
                ))}
              </div>
            </div>
          ))}
      </div>
    );
  };

  const renderTable = (): React.ReactNode => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left text-xs font-semibold text-gray-600 px-4 py-2">Génération</th>
            <th className="text-left text-xs font-semibold text-gray-600 px-4 py-2">Relation</th>
            <th className="text-left text-xs font-semibold text-gray-600 px-4 py-2">Nom</th>
            <th className="text-left text-xs font-semibold text-gray-600 px-4 py-2">Sexe</th>
            <th className="text-left text-xs font-semibold text-gray-600 px-4 py-2">Morph</th>
            <th className="text-left text-xs font-semibold text-gray-600 px-4 py-2">Naissance</th>
          </tr>
        </thead>
        <tbody>
          {ancestorRows
            .filter((r) => r.generation <= maxGen)
            .sort((a, b) => a.generation - b.generation)
            .map((r, i) => (
              <tr key={`${r.generation}-${i}-${r.snake?.id || "x"}`} className="border-t">
                <td className="px-4 py-2 text-sm text-gray-700">{r.generation}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{r.relation}</td>
                <td className="px-4 py-2 text-sm text-gray-900">{r.snake?.name || "Inconnu"}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{r.snake?.sex || "—"}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{r.snake?.morph || "—"}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{r.snake?.birthDate ? new Date(r.snake.birthDate).getFullYear() : "—"}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );

  const renderCompact = (): React.ReactNode => {
    if (!selectedSnake) return null;
    const f = findById(selectedSnake.parentMaleId);
    const m = findById(selectedSnake.parentFemaleId);
    const ff = f ? findById(f.parentMaleId) : null;
    const fm = f ? findById(f.parentFemaleId) : null;
    const mf = m ? findById(m.parentMaleId) : null;
    const mm = m ? findById(m.parentFemaleId) : null;

    return (
      <div className="w-full overflow-x-auto">
        <div className="min-w-[860px] mx-auto">
          <div className="flex justify-center mb-6">
            <Card s={selectedSnake} className="min-w-[260px]" />
          </div>
          <div className="flex justify-center gap-8 mb-6">
            <Card s={f} className="min-w-[220px]" />
            <Card s={m} className="min-w-[220px]" />
          </div>
          <div className="grid grid-cols-4 gap-6">
            <Card s={ff} />
            <Card s={fm} />
            <Card s={mf} />
            <Card s={mm} />
          </div>
        </div>
      </div>
    );
  };

  const handleExportPdf = async () => {
    if (!exportRef.current) return;
    try {
      setExporting(true);
      const [{ jsPDF }, html2canvasMod] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);
      const html2canvas = (html2canvasMod as any).default || (html2canvasMod as any);

      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        scrollX: 0,
        scrollY: -window.scrollY,
      });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const outerMargin = 10;
      const innerMargin = 15;
      const outerW = pageWidth - 2 * outerMargin;
      const outerH = pageHeight - 2 * outerMargin;

      const drawFrame = () => {
        pdf.setDrawColor(22, 163, 74);
        pdf.setLineWidth(3);
        pdf.rect(outerMargin, outerMargin, outerW, outerH);
        pdf.setDrawColor(209, 213, 219);
        pdf.setLineWidth(0.8);
        pdf.rect(outerMargin + 5, outerMargin + 5, outerW - 10, outerH - 10);
      };

      const drawHeader = () => {
        pdf.setFontSize(24);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(22, 163, 74);
        const title = "ARBRE GÉNÉALOGIQUE";
        const titleWidth = pdf.getTextWidth(title);
        pdf.text(title, (pageWidth - titleWidth) / 2, outerMargin + 18);

        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(75, 85, 99);
        const subtitle = "Snake Manager - Breeding Program";
        const subtitleWidth = pdf.getTextWidth(subtitle);
        pdf.text(subtitle, (pageWidth - subtitleWidth) / 2, outerMargin + 26);

        pdf.setLineWidth(0.5);
        pdf.setDrawColor(209, 213, 219);
        pdf.line(outerMargin + 25, outerMargin + 30, pageWidth - outerMargin - 25, outerMargin + 30);
      };

      const drawMeta = () => {
        if (!selectedSnake) return;
        const left = outerMargin + innerMargin;
        let y = outerMargin + 42;
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(55, 65, 81);
        pdf.setFontSize(12);
        pdf.text("INFORMATIONS", left, y);

        y += 8;
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(75, 85, 99);
        const lines: Array<[string, string]> = [
          ["Individu:", selectedSnake.name],
          ["Espèce:", selectedSnake.species || "—"],
          ["Morphe:", selectedSnake.morph || "—"],
          ["Sexe:", selectedSnake.sex || "—"],
          ["Générations affichées:", String(maxGen)],
          ["Exporté le:", new Date().toLocaleDateString()],
        ];
        const labelWidth = 55;
        lines.forEach(([label, value]) => {
          pdf.setFont("helvetica", "bold");
          pdf.text(label, left, y);
          pdf.setFont("helvetica", "normal");
          pdf.text(value, left + labelWidth, y);
          y += 6;
        });
      };

      const contentLeft = outerMargin + innerMargin;
      const contentTop = outerMargin + 70;
      const contentRight = pageWidth - outerMargin - innerMargin;
      const contentBottom = pageHeight - outerMargin - innerMargin - 16;
      const contentWidth = contentRight - contentLeft;
      const contentHeight = contentBottom - contentTop;

      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let offsetY = 0;
      let firstPage = true;

      const drawFooter = () => {
        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        const footer = `Document généré par Snake Manager — ${new Date().toLocaleDateString()}`;
        const w = pdf.getTextWidth(footer);
        pdf.text(footer, (pageWidth - w) / 2, pageHeight - outerMargin + 2);
      };

      while (offsetY < imgHeight) {
        if (!firstPage) {
          pdf.addPage();
        }
        drawFrame();
        drawHeader();
        if (firstPage) drawMeta();

        const available = firstPage ? contentHeight : (pageHeight - (outerMargin + innerMargin) - (outerMargin + innerMargin) - 16);
        pdf.addImage(imgData, "PNG", contentLeft, contentTop - offsetY, imgWidth, imgHeight);
        drawFooter();

        offsetY += available;
        firstPage = false;
      }

      pdf.save(`pedigree_${selectedSnake?.name || "snake"}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const handleSaveParents = async () => {
    if (!selectedSnake) return;
    setSnakes((prev) =>
      prev.map((s) =>
        s.id === selectedSnake.id
          ? { ...s, parentMaleId: fatherId || null, parentFemaleId: motherId || null }
          : s
      )
    );
    setSelectedSnake((prev) =>
      prev ? { ...prev, parentMaleId: fatherId || null, parentFemaleId: motherId || null } : prev
    );
    setShowParentsModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Arbre généalogique</h3>
          <p className="text-gray-600 mt-1">Visualisez les lignées de vos serpents</p>
        </div>
        <div className="flex items-center">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
            onClick={() => {
              setFatherId(selectedSnake?.parentMaleId || "");
              setMotherId(selectedSnake?.parentFemaleId || "");
              setShowParentsModal(true);
            }}
            disabled={!selectedSnake}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter des parents
          </button>
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className={
              "ml-2 px-4 py-2 rounded-lg border flex items-center gap-2 " +
              (exporting ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-white hover:bg-gray-50")
            }
            title="Exporter l'arbre généalogique en PDF"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Export..." : "Exporter PDF"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Sélectionner :</label>
        <select
          value={selectedSnake?.id || ""}
          onChange={(e) => setSelectedSnake(snakes.find((s) => s.id === e.target.value) || null)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          {snakes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.morph})
            </option>
          ))}
        </select>

        <Divider />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setView("vertical")}
            className={
              "px-3 py-1.5 rounded-lg border text-sm flex items-center gap-1 " +
              (view === "vertical" ? "bg-gray-900 text-white" : "bg-white text-gray-700")
            }
            title="Arbre vertical"
          >
            <ListTree className="w-4 h-4" /> Vertical
          </button>
          <button
            onClick={() => setView("horizontal")}
            className={
              "px-3 py-1.5 rounded-lg border text-sm flex items-center gap-1 " +
              (view === "horizontal" ? "bg-gray-900 text-white" : "bg-white text-gray-700")
            }
            title="Arbre horizontal"
          >
            <Columns className="w-4 h-4" /> Horizontal
          </button>
          <button
            onClick={() => setView("grid")}
            className={
              "px-3 py-1.5 rounded-lg border text-sm flex items-center gap-1 " +
              (view === "grid" ? "bg-gray-900 text-white" : "bg-white text-gray-700")
            }
            title="Générations (grille)"
          >
            <LayoutGrid className="w-4 h-4" /> Grille
          </button>
          <button
            onClick={() => setView("table")}
            className={
              "px-3 py-1.5 rounded-lg border text-sm flex items-center gap-1 " +
              (view === "table" ? "bg-gray-900 text-white" : "bg-white text-gray-700")
            }
            title="Table"
          >
            <Table className="w-4 h-4" /> Table
          </button>
          <button
            onClick={() => setView("compact")}
            className={
              "px-3 py-1.5 rounded-lg border text-sm flex items-center gap-1 " +
              (view === "compact" ? "bg-gray-900 text-white" : "bg-white text-gray-700")
            }
            title="Compact 3G"
          >
            <Rows className="w-4 h-4" /> Compact
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-gray-700">Profondeur</span>
          <select
            value={maxGen}
            onChange={(e) => setMaxGen(parseInt(e.target.value, 10))}
            className="px-2 py-1 border border-gray-300 rounded-md text-sm"
          >
            {[1, 2, 3, 4, 5].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedSnake ? (
        <div ref={exportRef} className="bg-gray-50 rounded-xl p-6 overflow-x-auto">
          {view === "vertical" && pedigreeTree && <div className="inline-block min-w-full">{renderVertical(pedigreeTree)}</div>}
          {view === "horizontal" && renderHorizontal()}
          {view === "grid" && renderGrid()}
          {view === "table" && renderTable()}
          {view === "compact" && renderCompact()}
        </div>
      ) : (
        <div className="text-center py-12">
          <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Aucune donnée généalogique disponible</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Légende</h4>
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-blue-500 rounded mr-2" />
            <span className="text-blue-900">Mâle</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-pink-500 rounded mr-2" />
            <span className="text-blue-900">Femelle</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-gray-300 rounded mr-2" />
            <span className="text-blue-900">Inconnu</span>
          </div>
        </div>
      </div>

      {showParentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h4 className="text-lg font-semibold mb-4">Associer des parents</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Père (mâle)</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={fatherId}
                  onChange={(e) => setFatherId(e.target.value)}
                >
                  <option value="">— Aucun / Inconnu —</option>
                  {males.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.morph || "—"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mère (femelle)</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={motherId}
                  onChange={(e) => setMotherId(e.target.value)}
                >
                  <option value="">— Aucune / Inconnue —</option>
                  {females.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.morph || "—"})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button className="px-4 py-2 rounded-lg border" onClick={() => setShowParentsModal(false)}>
                Annuler
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                onClick={handleSaveParents}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PedigreeTab;
