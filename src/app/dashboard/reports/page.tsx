"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  Download,
  Users,
  Phone,
  Calendar,
  Clock,
  History,
  Link as LinkIcon,
} from "lucide-react";
import { fetchApi, uploadFile, postApi } from "@/lib/api";

interface InternSummary {
  intern: { id: string; internId: string; name: string; team: string };
  totalCalls: number;
  totalReceived: number;
  totalInterested: number;
  totalTours: number;
  totalFollowUp: number;
  totalProspects: number;
  days: number;
}

interface Summary {
  month: number;
  year: number;
  totalLogs: number;
  totalCalls: number;
  totalInterested: number;
  totalTours: number;
  byIntern: InternSummary[];
  byTeam: {
    alpha: InternSummary[];
    callCenter: InternSummary[];
  };
}

interface PreviewData {
  fileName: string;
  fileSize: number;
  sheetsFound: string[];
  sheets: Array<{
    name: string;
    team: string;
    rows: number;
    uniqueInterns: string[];
    internCount: number;
    dateRange: { from: string | null; to: string | null };
    stats: { totalCalls: number; totalInterested: number; totalTours: number };
    sampleRows: Array<{
      name: string;
      date: string | null;
      callsMade: number;
      callsReceived: number;
      interested: number;
      hours: number;
    }>;
  }>;
  existingData: { interns: number; callLogs: number };
  counts: {
    newRows: number;
    updatedRows: number;
    unchangedRows: number;
    totalRows: number;
    newInternCount: number;
  };
  byDate: Array<{
    date: string;
    new: number;
    updated: number;
    unchanged: number;
    internsReporting: number;
  }>;
  lastImport: {
    fileName: string;
    importedAt: string;
    createdCount: number;
    updatedCount: number;
    dateFrom: string | null;
    dateTo: string | null;
  } | null;
}

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  newInterns: number;
  dateFrom?: string | null;
  dateTo?: string | null;
  errors: string[];
}

interface ImportBatch {
  id: string;
  fileName: string;
  importedAt: string;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  newInternCount: number;
  dateFrom: string | null;
  dateTo: string | null;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function ReportsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [teamView, setTeamView] = useState<"all" | "alpha" | "cc">("all");
  const [history, setHistory] = useState<ImportBatch[]>([]);
  const [importMode, setImportMode] = useState<"file" | "link">("file");
  const [linkUrl, setLinkUrl] = useState("");
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadHistory = useCallback(() => {
    fetchApi<ImportBatch[]>("/import/history").then(setHistory).catch(() => {});
  }, []);

  useEffect(() => {
    fetchApi<Summary>("/call-logs/summary?month=6&year=2026").then((d) => {
      setSummary(d);
      setLoading(false);
    });
    loadHistory();
  }, [loadHistory]);

  const errorResult = (msg: string): ImportResult => ({
    created: 0,
    updated: 0,
    skipped: 0,
    newInterns: 0,
    errors: [msg],
  });

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setImportResult(errorResult("Invalid file type. Please upload an .xlsx or .xls file."));
      return;
    }
    setSelectedFile(file);
    setPendingUrl(null);
    setPreviewing(true);
    setPreview(null);
    setImportResult(null);
    try {
      const result = await uploadFile<PreviewData>("/import/excel/preview", file);
      setPreview(result);
    } catch (err: any) {
      setImportResult(errorResult(err.message));
    }
    setPreviewing(false);
  }, []);

  const handleLink = async () => {
    const url = linkUrl.trim();
    if (!url) return;
    setSelectedFile(null);
    setPendingUrl(url);
    setPreviewing(true);
    setPreview(null);
    setImportResult(null);
    try {
      const result = await postApi<PreviewData>("/import/excel/preview-url", { url });
      setPreview(result);
    } catch (err: any) {
      setImportResult(errorResult(err.message || "Could not read that link."));
      setPendingUrl(null);
    }
    setPreviewing(false);
  };

  const handleConfirmImport = async () => {
    setImporting(true);
    setPreview(null);
    try {
      const result = pendingUrl
        ? await postApi<ImportResult>("/import/excel/url", { url: pendingUrl })
        : selectedFile
        ? await uploadFile<ImportResult>("/import/excel", selectedFile)
        : null;
      if (!result) {
        setImporting(false);
        return;
      }
      setImportResult(result);
      fetchApi<Summary>("/call-logs/summary?month=6&year=2026").then(setSummary);
      loadHistory();
    } catch (err: any) {
      setImportResult(errorResult(err.message));
    }
    setImporting(false);
    setSelectedFile(null);
    setPendingUrl(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const clearAll = () => {
    setImportResult(null);
    setSelectedFile(null);
    setPreview(null);
    setPendingUrl(null);
    setLinkUrl("");
  };

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  const displayData =
    teamView === "alpha" ? summary.byTeam.alpha
      : teamView === "cc" ? summary.byTeam.callCenter
      : summary.byIntern;

  const alphaTotal = summary.byTeam.alpha.reduce((s, i) => s + i.totalCalls, 0);
  const ccTotal = summary.byTeam.callCenter.reduce((s, i) => s + i.totalCalls, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & Import</h1>
        <p className="text-muted-foreground text-sm mt-1">Import Excel data with preview and view team summaries</p>
      </div>

      {/* Drag & Drop Upload */}
      <div className="bg-background border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Import Excel Data</h3>
          {!preview && !importResult && (
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {([["file", "Upload file"], ["link", "Import from link"]] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setImportMode(key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    importMode === key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Link input */}
        {!preview && !importResult && importMode === "link" && (
          <div className="border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <LinkIcon size={15} className="text-muted-foreground" />
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !previewing && handleLink()}
                placeholder="Paste a Google Sheet link or a direct .xlsx URL"
                className="flex-1 px-3.5 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              />
              <button
                onClick={handleLink}
                disabled={previewing || !linkUrl.trim()}
                className="flex items-center gap-2 px-4 py-2.5 bg-accent text-accent-foreground rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {previewing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Eye size={14} />
                )}
                Preview
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              For Google Sheets, set sharing to &quot;Anyone with the link&quot; — the system pulls the live
              data each time, so no download needed. Must contain &quot;Alpha&quot; and &quot;Call Center&quot; sheets.
            </p>
          </div>
        )}

        {!preview && !importResult && importMode === "file" && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !importing && !previewing && fileRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              dragActive
                ? "border-accent bg-accent/5 scale-[1.01]"
                : previewing
                ? "border-neutral-300 bg-muted/50 cursor-wait"
                : "border-border hover:border-neutral-400 hover:bg-muted/30"
            }`}
          >
            {previewing ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-neutral-300 border-t-accent rounded-full animate-spin" />
                <p className="text-sm font-medium">Analyzing {selectedFile?.name}...</p>
                <p className="text-xs text-muted-foreground">Reading sheets and preparing preview</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  dragActive ? "bg-accent text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {dragActive ? <Upload size={24} /> : <FileSpreadsheet size={24} />}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {dragActive ? "Drop your file here" : "Drag & drop your Excel file here"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or click to browse · Supports .xlsx/.xls with &quot;Alpha&quot; and &quot;Call Center&quot; sheets
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>
        )}

        {/* Preview Panel */}
        {preview && (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="bg-muted/50 px-5 py-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-3">
                <Eye size={18} className="text-accent" />
                <div>
                  <p className="text-sm font-semibold">Preview: {preview.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {(preview.fileSize / 1024).toFixed(1)} KB · {preview.sheetsFound.join(" + ")} sheets detected
                  </p>
                </div>
              </div>
              <button onClick={clearAll} className="p-1.5 hover:bg-black/5 rounded transition-colors">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Last import note */}
              {preview.lastImport && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Clock size={11} />
                  Last imported {timeAgo(preview.lastImport.importedAt)} ·{" "}
                  {preview.lastImport.fileName}
                  {preview.lastImport.dateFrom && (
                    <> · covered {preview.lastImport.dateFrom} → {preview.lastImport.dateTo}</>
                  )}
                </p>
              )}

              {/* Accurate import classification */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                  <p className="text-2xl font-bold text-emerald-700">{preview.counts.newRows}</p>
                  <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-wide">New rows</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-center">
                  <p className="text-2xl font-bold text-amber-700">{preview.counts.updatedRows}</p>
                  <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wide">Updated</p>
                </div>
                <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-center">
                  <p className="text-2xl font-bold text-neutral-500">{preview.counts.unchangedRows}</p>
                  <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wide">Unchanged</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                <AlertCircle size={14} className="text-blue-600 shrink-0" />
                <span className="text-blue-700">
                  {preview.counts.newRows === 0 && preview.counts.updatedRows === 0 ? (
                    <>Everything in this file is already imported — nothing will change.</>
                  ) : (
                    <>
                      <strong>{preview.counts.newRows}</strong> new and{" "}
                      <strong>{preview.counts.updatedRows}</strong> corrected rows will be applied;{" "}
                      {preview.counts.unchangedRows} unchanged rows skipped.
                      {preview.counts.newInternCount > 0 && (
                        <> {preview.counts.newInternCount} new intern(s) will be created.</>
                      )}
                    </>
                  )}
                </span>
              </div>

              {/* Per-date breakdown */}
              {preview.byDate.length > 0 && (
                <details className="group">
                  <summary className="text-xs font-medium text-muted-foreground cursor-pointer select-none flex items-center gap-1.5">
                    <Calendar size={12} /> Per-date breakdown ({preview.byDate.length} days)
                  </summary>
                  <div className="mt-2 max-h-56 overflow-y-auto border border-border rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                        <tr className="border-b border-border">
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                          <th className="text-center px-3 py-2 font-medium text-emerald-600">New</th>
                          <th className="text-center px-3 py-2 font-medium text-amber-600">Updated</th>
                          <th className="text-center px-3 py-2 font-medium text-neutral-400">Unchanged</th>
                          <th className="text-center px-3 py-2 font-medium text-muted-foreground">Interns</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.byDate.map((d) => (
                          <tr key={d.date} className="border-b border-border/50">
                            <td className="px-3 py-1.5 font-medium">{d.date}</td>
                            <td className="px-3 py-1.5 text-center text-emerald-700">{d.new || "—"}</td>
                            <td className="px-3 py-1.5 text-center text-amber-700">{d.updated || "—"}</td>
                            <td className="px-3 py-1.5 text-center text-neutral-400">{d.unchanged || "—"}</td>
                            <td className="px-3 py-1.5 text-center text-muted-foreground">{d.internsReporting}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}

              {/* Sheet Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {preview.sheets.map((sheet) => (
                  <div key={sheet.name} className={`p-4 rounded-lg border ${
                    sheet.team === "ALPHA" ? "bg-violet-50 border-violet-200" : "bg-blue-50 border-blue-200"
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        sheet.team === "ALPHA" ? "bg-violet-200 text-violet-700" : "bg-blue-200 text-blue-700"
                      }`}>
                        {sheet.name}
                      </span>
                      <span className="text-xs text-muted-foreground">{sheet.rows} rows</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-lg font-bold">{sheet.internCount}</p>
                        <p className="text-[10px] text-muted-foreground">Interns</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{sheet.stats.totalCalls.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">Calls</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{sheet.stats.totalInterested}</p>
                        <p className="text-[10px] text-muted-foreground">Interested</p>
                      </div>
                    </div>
                    {sheet.dateRange.from && (
                      <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                        <Calendar size={10} />
                        {sheet.dateRange.from} → {sheet.dateRange.to}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Sample Data */}
              {preview.sheets[0]?.sampleRows.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Sample rows (first 5):</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Name</th>
                          <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                          <th className="text-center px-3 py-2 font-medium text-muted-foreground">Made</th>
                          <th className="text-center px-3 py-2 font-medium text-muted-foreground">Received</th>
                          <th className="text-center px-3 py-2 font-medium text-muted-foreground">Interested</th>
                          <th className="text-center px-3 py-2 font-medium text-muted-foreground">Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.sheets[0].sampleRows.map((row, i) => (
                          <tr key={i} className="border-b border-border/50">
                            <td className="px-3 py-2 font-medium">{row.name}</td>
                            <td className="px-3 py-2 text-muted-foreground">{row.date}</td>
                            <td className="px-3 py-2 text-center">{row.callsMade}</td>
                            <td className="px-3 py-2 text-center">{row.callsReceived}</td>
                            <td className="px-3 py-2 text-center">{row.interested}</td>
                            <td className="px-3 py-2 text-center">{row.hours}h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Intern List */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Interns found:</p>
                <div className="flex flex-wrap gap-1.5">
                  {preview.sheets.flatMap((s) =>
                    s.uniqueInterns.map((name) => (
                      <span key={`${s.name}-${name}`} className={`text-[11px] px-2 py-1 rounded ${
                        s.team === "ALPHA" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {name}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                <button
                  onClick={clearAll}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={importing}
                  className="flex items-center gap-2 px-5 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
                >
                  {importing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  {importing ? "Importing..." : "Confirm Import"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Result */}
        {importResult && (
          <div className={`p-4 rounded-lg border ${
            importResult.errors.length > 0 && importResult.created === 0 && importResult.updated === 0
              ? "bg-red-50 border-red-200"
              : "bg-emerald-50 border-emerald-200"
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {importResult.errors.length > 0 && importResult.created === 0 && importResult.updated === 0 ? (
                  <AlertCircle size={18} className="text-red-600 mt-0.5" />
                ) : (
                  <CheckCircle2 size={18} className="text-emerald-600 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {importResult.errors.length > 0 && importResult.created === 0 && importResult.updated === 0
                      ? "Import Failed"
                      : "Import Complete"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {importResult.created} created · {importResult.updated} updated · {importResult.skipped} unchanged
                    {importResult.newInterns > 0 && ` · ${importResult.newInterns} new interns`}
                    {importResult.dateFrom && ` · ${importResult.dateFrom} → ${importResult.dateTo}`}
                  </p>
                  {importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-red-600 font-medium">{importResult.errors.length} warning(s):</p>
                      <ul className="text-xs text-red-600 mt-1 space-y-0.5">
                        {importResult.errors.slice(0, 5).map((err, i) => (
                          <li key={i}>· {err}</li>
                        ))}
                        {importResult.errors.length > 5 && (
                          <li className="text-muted-foreground">...and {importResult.errors.length - 5} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={clearAll} className="p-1 hover:bg-black/5 rounded transition-colors">
                <X size={14} className="text-muted-foreground" />
              </button>
            </div>
          </div>
        )}

        {/* Import History */}
        {history.length > 0 && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
              <History size={12} /> Import history
            </p>
            <div className="space-y-1.5">
              {history.slice(0, 5).map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-muted/40 border border-border"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileSpreadsheet size={13} className="text-muted-foreground shrink-0" />
                    <span className="font-medium truncate">{h.fileName}</span>
                    {h.dateFrom && (
                      <span className="text-muted-foreground hidden sm:inline">
                        {h.dateFrom} → {h.dateTo}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-emerald-600">+{h.createdCount}</span>
                    <span className="text-amber-600">~{h.updatedCount}</span>
                    <span className="text-muted-foreground">{timeAgo(h.importedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Team Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-background border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Total Calls</p>
          <p className="text-2xl font-bold">{summary.totalCalls.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{summary.totalLogs} submissions</p>
        </div>
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
          <p className="text-xs text-violet-600 font-medium">Alpha Team</p>
          <p className="text-2xl font-bold text-violet-700">{alphaTotal.toLocaleString()}</p>
          <p className="text-xs text-violet-500">{summary.byTeam.alpha.length} interns</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-medium">Call Center</p>
          <p className="text-2xl font-bold text-blue-700">{ccTotal.toLocaleString()}</p>
          <p className="text-xs text-blue-500">{summary.byTeam.callCenter.length} interns</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-xs text-emerald-600 font-medium">Interested Visits</p>
          <p className="text-2xl font-bold text-emerald-700">{summary.totalInterested}</p>
          <p className="text-xs text-emerald-500">{summary.totalTours} tours made</p>
        </div>
      </div>

      {/* Performance Table with Team Filter */}
      <div className="bg-background border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold">Monthly Performance — June 2026</h3>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {([["all", "All Teams"], ["alpha", "Alpha"], ["cc", "Call Center"]] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTeamView(key as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  teamView === key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Team</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Total Calls</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Received</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Interested</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Follow-Up</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Tours</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Days</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((item, i) => (
                <tr
                  key={item.intern.id}
                  onClick={() => router.push(`/dashboard/interns/${item.intern.id}`)}
                  className="border-b border-border/50 hover:bg-muted/30 cursor-pointer"
                >
                  <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium hover:underline">
                      {item.intern.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      item.intern.team === "ALPHA" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {item.intern.team === "ALPHA" ? "Alpha" : "CC"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold">{item.totalCalls.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">{item.totalReceived.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    {item.totalInterested > 0 ? (
                      <span className="inline-block px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded">{item.totalInterested}</span>
                    ) : "0"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.totalFollowUp > 0 ? (
                      <span className="inline-block px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">{item.totalFollowUp}</span>
                    ) : "0"}
                  </td>
                  <td className="px-4 py-3 text-center">{item.totalTours}</td>
                  <td className="px-4 py-3 text-center">{item.days}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {displayData.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">No data for this team</div>
          )}
        </div>
      </div>
    </div>
  );
}
