"use client";

import { useMemo, useRef, useState } from "react";
import {
  Upload,
  Link2,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  Check,
  AlertTriangle,
  UserPlus,
  Sparkles,
  RotateCcw,
  Search,
} from "lucide-react";
import { fetchApi, postApi, uploadFile } from "@/lib/api";

// ---------------------------------------------------------------------------
// Field metadata — mirrors the backend FIELD_KEYS. `core` fields are shown as
// inline editable columns; the rest live in the per-row expand panel.
// ---------------------------------------------------------------------------
type FieldType = "int" | "float" | "str";
interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  core?: boolean;
}

const FIELDS: FieldDef[] = [
  { key: "callsMade", label: "Calls Made", type: "int", core: true },
  { key: "callsReceived", label: "Received", type: "int", core: true },
  { key: "interestedVisit", label: "Interested", type: "int", core: true },
  { key: "toursMade", label: "Tours", type: "int", core: true },
  { key: "hoursWorked", label: "Hours", type: "float", core: true },
  { key: "callType", label: "Call Type", type: "str" },
  { key: "interestedVisitNames", label: "Interested Visit Names", type: "str" },
  { key: "needsFollowUp", label: "Needs Follow-up", type: "int" },
  { key: "followUpNames", label: "Follow-up Names", type: "str" },
  { key: "prospects", label: "Prospects", type: "int" },
  { key: "admittedOther", label: "Admitted Elsewhere", type: "int" },
  { key: "afterResults", label: "Decide After Results", type: "int" },
  { key: "parentDiscussion", label: "Parent Discussion", type: "int" },
  { key: "financialIssues", label: "Financial Issues", type: "int" },
  { key: "scholarshipHesitation", label: "Scholarship Hesitation", type: "int" },
  { key: "courseNotAvailable", label: "Course Not Available", type: "int" },
  { key: "notInterested", label: "Not Interested", type: "int" },
  { key: "invalidNumbers", label: "Invalid Numbers", type: "int" },
  { key: "alreadyVisited", label: "Already Visited", type: "int" },
  { key: "highlyInterested", label: "Highly Interested", type: "int" },
  { key: "highlyInterestedNames", label: "Highly Interested Names", type: "str" },
  { key: "remarks", label: "Remarks", type: "str" },
];
const CORE_FIELDS = FIELDS.filter((f) => f.core);
const EXTRA_FIELDS = FIELDS.filter((f) => !f.core);

type Fields = Record<string, string | number | null>;
type Classification = "new" | "updated" | "unchanged";

interface InternRef {
  id: string;
  internId: string;
  name: string;
  team: string;
}

interface ReviewRow {
  index: number;
  sheet: string;
  team: string;
  name: string;
  role?: string;
  email: string | null;
  submittedAt: string;
  dateStr: string;
  fields: Fields;
  existingFields: Fields | null;
  matchInternId: string | null;
  matchName: string | null;
  matchType: "exact" | "fuzzy" | "none";
  classification: Classification;
  candidates: InternRef[];
}

interface ReviewResponse {
  fileName: string;
  fileSize: number;
  sheetsFound: string[];
  interns: InternRef[];
  rows: ReviewRow[];
  counts: {
    newRows: number;
    updatedRows: number;
    unchangedRows: number;
    unmatched: number;
    totalRows: number;
  };
}

// Editable row = review row + user overrides. `internId` is the user's current
// resolution (starts at matchInternId; null means "create a new intern").
interface EditRow extends ReviewRow {
  internId: string | null;
  include: boolean;
}

interface CommitResult {
  created: number;
  updated: number;
  skipped: number;
  newInterns: number;
  dateFrom: string | null;
  dateTo: string | null;
  errors: string[];
}

const NEW_INTERN = "__new__";
const teamShort = (t: string) => (t === "ALPHA" ? "Alpha" : t === "EA" ? "EA" : "Call Center");

function coerce(type: FieldType, raw: string): number | string | null {
  if (type === "str") {
    const s = raw.trim();
    return s || null;
  }
  if (raw === "" || raw == null) return type === "float" ? 0 : 0;
  const n = type === "float" ? parseFloat(raw) : parseInt(raw, 10);
  return isNaN(n) ? 0 : n;
}

// Client-side classification, honest about what we can know after edits/remaps.
function classifyRow(row: EditRow): Classification {
  if (!row.internId) return "new";
  if (row.internId !== row.matchInternId || !row.existingFields) return "new";
  for (const f of FIELDS) {
    if ((row.existingFields[f.key] ?? null) !== (row.fields[f.key] ?? null)) return "updated";
  }
  return "unchanged";
}

const classStyles: Record<Classification, string> = {
  new: "bg-emerald-100 text-emerald-700",
  updated: "bg-amber-100 text-amber-700",
  unchanged: "bg-neutral-100 text-neutral-500",
};

type FilterKey = "all" | "new" | "updated" | "unchanged" | "attention";

export default function ImportPage() {
  const [phase, setPhase] = useState<"source" | "review" | "done">("source");
  const [mode, setMode] = useState<"file" | "url">("file");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [rows, setRows] = useState<EditRow[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<CommitResult | null>(null);

  // -- Source step -----------------------------------------------------------
  const runReview = async () => {
    setError(null);
    setBusy(true);
    try {
      const data =
        mode === "file"
          ? await uploadFile<ReviewResponse>("/import/excel/review", file as File)
          : await postApi<ReviewResponse>("/import/excel/review-url", { url });
      if (!data.rows?.length) {
        setError("No importable rows were found. Expected a sheet named 'Call Center' or 'Alpha'.");
        setBusy(false);
        return;
      }
      setReview(data);
      setRows(
        data.rows.map((r) => ({
          ...r,
          internId: r.matchInternId,
          include: r.classification !== "unchanged",
        })),
      );
      setExpanded(new Set());
      setFilter("all");
      setSearch("");
      setPhase("review");
    } catch (e: any) {
      setError(e?.message || "Could not read that source.");
    } finally {
      setBusy(false);
    }
  };

  // -- Row mutations ----------------------------------------------------------
  const patchRow = (index: number, patch: Partial<EditRow>) =>
    setRows((prev) => prev.map((r) => (r.index === index ? { ...r, ...patch } : r)));

  const editField = (index: number, def: FieldDef, raw: string) =>
    setRows((prev) =>
      prev.map((r) =>
        r.index === index
          ? { ...r, fields: { ...r.fields, [def.key]: coerce(def.type, raw) } }
          : r,
      ),
    );

  const remap = (index: number, value: string) =>
    patchRow(index, { internId: value === NEW_INTERN ? null : value });

  const resetRow = (index: number) => {
    const orig = review?.rows.find((r) => r.index === index);
    if (!orig) return;
    patchRow(index, { fields: { ...orig.fields }, internId: orig.matchInternId });
  };

  const toggleExpand = (index: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });

  // -- Derived ----------------------------------------------------------------
  const decorated = useMemo(
    () => rows.map((r) => ({ ...r, live: classifyRow(r) })),
    [rows],
  );

  const liveCounts = useMemo(() => {
    const c = { new: 0, updated: 0, unchanged: 0, attention: 0, included: 0 };
    for (const r of decorated) {
      c[r.live]++;
      if (!r.internId || r.matchType !== "exact") c.attention++;
      if (r.include) c.included++;
    }
    return c;
  }, [decorated]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return decorated.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q)) return false;
      if (filter === "attention") return !r.internId || r.matchType !== "exact";
      if (filter !== "all") return r.live === filter;
      return true;
    });
  }, [decorated, filter, search]);

  const setAllVisibleInclude = (include: boolean) => {
    const ids = new Set(visible.map((r) => r.index));
    setRows((prev) => prev.map((r) => (ids.has(r.index) ? { ...r, include } : r)));
  };

  // -- Commit -----------------------------------------------------------------
  const commit = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        fileName: review?.fileName,
        fileSize: review?.fileSize,
        rows: rows.map((r) => ({
          sheet: r.sheet,
          team: r.team,
          name: r.name,
          role: r.role,
          email: r.email ?? undefined,
          submittedAt: r.submittedAt,
          dateStr: r.dateStr,
          fields: r.fields,
          internId: r.internId,
          include: r.include,
        })),
      };
      const res = await postApi<CommitResult>("/import/excel/commit", payload);
      setResult(res);
      setPhase("done");
    } catch (e: any) {
      setError(e?.message || "Import failed.");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setPhase("source");
    setReview(null);
    setRows([]);
    setResult(null);
    setFile(null);
    setUrl("");
    setError(null);
  };

  // ===========================================================================
  // Render
  // ===========================================================================
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Data Import</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload the daily reporting sheet, review and correct every row, then commit.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertTriangle size={16} className="text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {phase === "source" && (
        <SourceStep
          mode={mode}
          setMode={setMode}
          file={file}
          setFile={setFile}
          url={url}
          setUrl={setUrl}
          busy={busy}
          onReview={runReview}
          fileInputRef={fileInputRef}
        />
      )}

      {phase === "review" && review && (
        <>
          {/* Summary bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg text-sm">
              <FileSpreadsheet size={15} className="text-muted-foreground" />
              <span className="font-medium">{review.fileName}</span>
              <span className="text-muted-foreground">· {review.sheetsFound.join(", ")}</span>
            </div>
            <StatChip label="New" value={liveCounts.new} tone="emerald" />
            <StatChip label="Updated" value={liveCounts.updated} tone="amber" />
            <StatChip label="Unchanged" value={liveCounts.unchanged} tone="neutral" />
            <StatChip label="Needs attention" value={liveCounts.attention} tone="red" />
            <div className="ml-auto text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{liveCounts.included}</span> of{" "}
              {rows.length} selected
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {(
                [
                  ["all", "All"],
                  ["new", "New"],
                  ["updated", "Updated"],
                  ["unchanged", "Unchanged"],
                  ["attention", "Needs attention"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    filter === key
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name..."
                className="pl-9 pr-3 py-2 border border-border rounded-lg text-sm bg-background w-48"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setAllVisibleInclude(true)}
                className="px-3 py-2 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Select shown
              </button>
              <button
                onClick={() => setAllVisibleInclude(false)}
                className="px-3 py-2 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Clear shown
              </button>
              <button
                onClick={commit}
                disabled={busy || liveCounts.included === 0}
                className="flex items-center gap-2 px-5 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {busy ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={15} />
                )}
                Import {liveCounts.included} row{liveCounts.included === 1 ? "" : "s"}
              </button>
            </div>
          </div>

          {/* Review table */}
          <div className="bg-background border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="w-10 px-3 py-3"></th>
                    <th className="w-24 text-left px-2 py-3 font-medium">Status</th>
                    <th className="text-left px-3 py-3 font-medium min-w-[220px]">Intern</th>
                    <th className="text-left px-3 py-3 font-medium">Date</th>
                    {CORE_FIELDS.map((f) => (
                      <th key={f.key} className="text-center px-2 py-3 font-medium min-w-[64px]">
                        {f.label}
                      </th>
                    ))}
                    <th className="w-10 px-2 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => {
                    const attention = !r.internId || r.matchType !== "exact";
                    const isExpanded = expanded.has(r.index);
                    const edited =
                      review.rows.find((o) => o.index === r.index) &&
                      (r.internId !== r.matchInternId ||
                        FIELDS.some(
                          (f) =>
                            (r.fields[f.key] ?? null) !==
                            (review.rows.find((o) => o.index === r.index)!.fields[f.key] ?? null),
                        ));
                    return (
                      <FragmentRow
                        key={r.index}
                        r={r}
                        interns={review.interns}
                        attention={attention}
                        isExpanded={isExpanded}
                        edited={!!edited}
                        onToggleInclude={() => patchRow(r.index, { include: !r.include })}
                        onRemap={(v) => remap(r.index, v)}
                        onEditField={(def, v) => editField(r.index, def, v)}
                        onToggleExpand={() => toggleExpand(r.index)}
                        onReset={() => resetRow(r.index)}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
            {visible.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No rows match this filter.
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pb-4">
            <button
              onClick={reset}
              className="px-4 py-2.5 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {phase === "done" && result && (
        <ResultStep result={result} onAgain={reset} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Source step
// ---------------------------------------------------------------------------
function SourceStep({
  mode,
  setMode,
  file,
  setFile,
  url,
  setUrl,
  busy,
  onReview,
  fileInputRef,
}: {
  mode: "file" | "url";
  setMode: (m: "file" | "url") => void;
  file: File | null;
  setFile: (f: File | null) => void;
  url: string;
  setUrl: (u: string) => void;
  busy: boolean;
  onReview: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const canGo = mode === "file" ? !!file : url.trim().length > 0;
  return (
    <div className="bg-background border border-border rounded-2xl p-6 space-y-5 max-w-2xl">
      <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
        {(
          [
            ["file", "Upload file", Upload],
            ["url", "From link", Link2],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {mode === "file" ? (
        <div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-accent/50 hover:bg-muted/30 transition-colors"
          >
            <FileSpreadsheet size={28} className="mx-auto text-muted-foreground mb-2" />
            {file ? (
              <p className="text-sm font-medium">{file.name}</p>
            ) : (
              <>
                <p className="text-sm font-medium">Click to choose an .xlsx file</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The daily reporting workbook (Call Center / Alpha sheets)
                </p>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium mb-1.5">Spreadsheet link</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/... or a direct .xlsx URL"
            className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm bg-background"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            Google Sheets must be shared as “Anyone with the link”.
          </p>
        </div>
      )}

      <button
        onClick={onReview}
        disabled={!canGo || busy}
        className="flex items-center gap-2 px-6 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50"
      >
        {busy ? (
          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <Sparkles size={16} />
        )}
        Review rows
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// One review row (+ its expand panel), rendered as sibling <tr>s.
// ---------------------------------------------------------------------------
function FragmentRow({
  r,
  interns,
  attention,
  isExpanded,
  edited,
  onToggleInclude,
  onRemap,
  onEditField,
  onToggleExpand,
  onReset,
}: {
  r: EditRow & { live: Classification };
  interns: InternRef[];
  attention: boolean;
  isExpanded: boolean;
  edited: boolean;
  onToggleInclude: () => void;
  onRemap: (v: string) => void;
  onEditField: (def: FieldDef, v: string) => void;
  onToggleExpand: () => void;
  onReset: () => void;
}) {
  const candidateIds = new Set(r.candidates.map((c) => c.id));
  return (
    <>
      <tr
        className={`border-b border-border/50 ${r.include ? "" : "opacity-45"} ${
          attention ? "bg-red-50/40" : ""
        }`}
      >
        <td className="px-3 py-2 text-center">
          <input
            type="checkbox"
            checked={r.include}
            onChange={onToggleInclude}
            className="w-4 h-4 rounded border-neutral-300 accent-accent"
          />
        </td>
        <td className="px-2 py-2">
          <span
            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${classStyles[r.live]}`}
          >
            {r.live}
          </span>
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium truncate">{r.name}</span>
                {r.matchType === "fuzzy" && (
                  <span
                    title={`Fuzzy-matched to ${r.matchName}`}
                    className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-100 text-amber-700"
                  >
                    FUZZY
                  </span>
                )}
                {r.matchType === "none" && (
                  <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-red-100 text-red-700">
                    NEW PERSON
                  </span>
                )}
              </div>
              <select
                value={r.internId ?? NEW_INTERN}
                onChange={(e) => onRemap(e.target.value)}
                className={`mt-1 text-xs px-2 py-1 rounded border bg-background max-w-[240px] ${
                  r.internId ? "border-border" : "border-emerald-300 text-emerald-700"
                }`}
              >
                {r.candidates.length > 0 && (
                  <optgroup label="Suggested">
                    {r.candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {teamShort(c.team)}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="All interns">
                  {interns
                    .filter((i) => !candidateIds.has(i.id))
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} · {teamShort(i.team)}
                      </option>
                    ))}
                </optgroup>
                <option value={NEW_INTERN}>＋ Create new: {r.name}</option>
              </select>
            </div>
          </div>
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-muted-foreground text-xs">{r.dateStr}</td>
        {CORE_FIELDS.map((f) => (
          <td key={f.key} className="px-2 py-2">
            <CellInput def={f} value={r.fields[f.key]} onChange={(v) => onEditField(f, v)} />
          </td>
        ))}
        <td className="px-2 py-2 text-center">
          <div className="flex items-center gap-0.5">
            {edited && (
              <button
                onClick={onReset}
                title="Reset this row to the imported values"
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw size={13} />
              </button>
            )}
            <button
              onClick={onToggleExpand}
              title="Edit all fields"
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            </button>
          </div>
        </td>
      </tr>
      {isExpanded && (
        <tr className="border-b border-border/50 bg-muted/20">
          <td colSpan={5 + CORE_FIELDS.length}>
            <div className="px-6 py-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
                All fields
                {r.role && <span className="font-normal">· role: {r.role}</span>}
                {r.email && <span className="font-normal">· {r.email}</span>}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {EXTRA_FIELDS.map((f) => (
                  <div key={f.key}>
                    <label className="block text-[11px] text-muted-foreground mb-1">{f.label}</label>
                    <CellInput
                      def={f}
                      value={r.fields[f.key]}
                      onChange={(v) => onEditField(f, v)}
                      wide
                    />
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function CellInput({
  def,
  value,
  onChange,
  wide,
}: {
  def: FieldDef;
  value: string | number | null;
  onChange: (v: string) => void;
  wide?: boolean;
}) {
  const base =
    "px-2 py-1 border border-border rounded text-xs bg-background focus:outline-none focus:ring-2 focus:ring-accent/20";
  if (def.type === "str") {
    return (
      <input
        type="text"
        value={value == null ? "" : String(value)}
        onChange={(e) => onChange(e.target.value)}
        className={`${base} ${wide ? "w-full" : "w-28"}`}
      />
    );
  }
  return (
    <input
      type="number"
      step={def.type === "float" ? "0.1" : "1"}
      value={value == null ? 0 : Number(value)}
      onChange={(e) => onChange(e.target.value)}
      className={`${base} text-center ${wide ? "w-full" : "w-14"}`}
    />
  );
}

function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "neutral" | "red";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    neutral: "bg-neutral-50 text-neutral-600 border-neutral-200",
    red: "bg-red-50 text-red-700 border-red-200",
  }[tone];
  return (
    <div className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${tones}`}>
      {label}: <span className="font-bold">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Result step
// ---------------------------------------------------------------------------
function ResultStep({ result, onAgain }: { result: CommitResult; onAgain: () => void }) {
  return (
    <div className="bg-background border border-border rounded-2xl p-8 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center">
          <Check size={22} className="text-emerald-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Import complete</h2>
          <p className="text-sm text-muted-foreground">
            {result.dateFrom && result.dateTo
              ? `${result.dateFrom} → ${result.dateTo}`
              : "Records saved"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ResultStat label="Created" value={result.created} tone="text-emerald-600" />
        <ResultStat label="Updated" value={result.updated} tone="text-amber-600" />
        <ResultStat label="Skipped" value={result.skipped} tone="text-neutral-500" />
        <ResultStat label="New interns" value={result.newInterns} tone="text-blue-600" />
      </div>

      {result.newInterns > 0 && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
          <UserPlus size={16} className="text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-700">
            {result.newInterns} new intern{result.newInterns === 1 ? "" : "s"} created from
            unmatched rows. Review their profiles under Interns.
          </p>
        </div>
      )}

      {result.errors.length > 0 && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-medium text-red-700 mb-1">
            {result.errors.length} row error{result.errors.length === 1 ? "" : "s"}
          </p>
          <ul className="text-xs text-red-600 space-y-0.5 list-disc pl-4">
            {result.errors.slice(0, 10).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={onAgain}
        className="flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-foreground rounded-lg text-sm font-semibold hover:bg-neutral-800 transition-colors"
      >
        <Upload size={15} />
        Import another
      </button>
    </div>
  );
}

function ResultStat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="bg-muted/40 rounded-xl p-4 text-center">
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
