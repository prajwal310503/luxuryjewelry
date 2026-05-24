import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { productAPI } from '../../services/api';
import Pagination from '../components/Pagination';
import Tip from '../components/Tip';
import Select from '../../components/ui/Select';

// ── CSV template — all product fields ─────────────────────────
const CSV_COLUMNS = [
  // Required
  { key: 'title',              group: 'required',     label: 'title *' },
  { key: 'price',              group: 'required',     label: 'price *' },
  { key: 'category',           group: 'required',     label: 'category *' },
  // Core
  { key: 'sku',                group: 'core',         label: 'sku' },
  { key: 'comparePrice',       group: 'core',         label: 'comparePrice' },
  { key: 'costPrice',          group: 'core',         label: 'costPrice' },
  { key: 'discount',           group: 'core',         label: 'discount' },
  { key: 'stock',              group: 'core',         label: 'stock' },
  { key: 'lowStockThreshold',  group: 'core',         label: 'lowStockThreshold' },
  { key: 'shortDescription',   group: 'core',         label: 'shortDescription' },
  { key: 'description',        group: 'core',         label: 'description' },
  { key: 'weight',             group: 'core',         label: 'weight' },
  { key: 'status',             group: 'core',         label: 'status' },
  { key: 'freeShipping',       group: 'core',         label: 'freeShipping' },
  { key: 'shippingDays',       group: 'core',         label: 'shippingDays' },
  // Images
  { key: 'image1',             group: 'images',       label: 'image1' },
  { key: 'image2',             group: 'images',       label: 'image2' },
  { key: 'image3',             group: 'images',       label: 'image3' },
  { key: 'image4',             group: 'images',       label: 'image4' },
  { key: 'image5',             group: 'images',       label: 'image5' },
  // Flags
  { key: 'isFeatured',         group: 'flags',        label: 'isFeatured' },
  { key: 'isNewArrival',       group: 'flags',        label: 'isNewArrival' },
  { key: 'isBestSeller',       group: 'flags',        label: 'isBestSeller' },
  // Tags (comma-separated inside each cell)
  { key: 'segments',           group: 'tags',         label: 'segments' },
  { key: 'occasions',          group: 'tags',         label: 'occasions' },
  { key: 'collectionStyles',   group: 'tags',         label: 'collectionStyles' },
  { key: 'themes',             group: 'tags',         label: 'themes' },
  { key: 'productPersonas',    group: 'tags',         label: 'productPersonas' },
  { key: 'wearingTypes',       group: 'tags',         label: 'wearingTypes' },
  { key: 'giftTags',           group: 'tags',         label: 'giftTags' },
  // Dimensions
  { key: 'dimensionLength',    group: 'dimensions',   label: 'dimensionLength' },
  { key: 'dimensionWidth',     group: 'dimensions',   label: 'dimensionWidth' },
  { key: 'dimensionHeight',    group: 'dimensions',   label: 'dimensionHeight' },
  { key: 'dimensionUnit',      group: 'dimensions',   label: 'dimensionUnit' },
  // SEO
  { key: 'seoTitle',           group: 'seo',          label: 'seoTitle' },
  { key: 'seoDescription',     group: 'seo',          label: 'seoDescription' },
  { key: 'seoKeywords',        group: 'seo',          label: 'seoKeywords' },
  // Price breakup
  { key: 'metalType',          group: 'priceBreakup', label: 'metalType' },
  { key: 'grossWeight',        group: 'priceBreakup', label: 'grossWeight' },
  { key: 'netWeight',          group: 'priceBreakup', label: 'netWeight' },
  { key: 'metalRate',          group: 'priceBreakup', label: 'metalRate' },
  { key: 'metalAmount',        group: 'priceBreakup', label: 'metalAmount' },
  { key: 'diamondPieces',      group: 'priceBreakup', label: 'diamondPieces' },
  { key: 'diamondCarat',       group: 'priceBreakup', label: 'diamondCarat' },
  { key: 'diamondClarity',     group: 'priceBreakup', label: 'diamondClarity' },
  { key: 'diamondCut',         group: 'priceBreakup', label: 'diamondCut' },
  { key: 'diamondColor',       group: 'priceBreakup', label: 'diamondColor' },
  { key: 'diamondAmount',      group: 'priceBreakup', label: 'diamondAmount' },
  { key: 'makingCharges',      group: 'priceBreakup', label: 'makingCharges' },
  { key: 'gstPct',             group: 'priceBreakup', label: 'gstPct' },
  // Certification
  { key: 'certLab',            group: 'certification',label: 'certLab' },
  { key: 'certNumber',         group: 'certification',label: 'certNumber' },
  { key: 'certImage',          group: 'certification',label: 'certImage' },
];

const CSV_GROUPS = [
  { id: 'required',     label: 'Required',       color: 'bg-red-100 text-red-700' },
  { id: 'core',         label: 'Core Fields',    color: 'bg-blue-100 text-blue-700' },
  { id: 'images',       label: 'Images (URLs)',  color: 'bg-purple-100 text-purple-700' },
  { id: 'flags',        label: 'Flags (true/false)', color: 'bg-amber-100 text-amber-700' },
  { id: 'tags',         label: 'Tags (comma-separated)', color: 'bg-green-100 text-green-700' },
  { id: 'dimensions',   label: 'Dimensions',     color: 'bg-teal-100 text-teal-700' },
  { id: 'seo',          label: 'SEO',            color: 'bg-indigo-100 text-indigo-700' },
  { id: 'priceBreakup', label: 'Price Breakup',  color: 'bg-orange-100 text-orange-700' },
  { id: 'certification',label: 'Certification',  color: 'bg-pink-100 text-pink-700' },
];

const CSV_HEADERS = CSV_COLUMNS.map((c) => c.key);

// Sample row — only fills meaningful fields, rest blank
const CSV_SAMPLE = {
  title: 'Diamond Solitaire Ring',
  price: '24999',
  category: 'Rings',
  sku: 'DSR-001',
  comparePrice: '28000',
  costPrice: '18000',
  discount: '0',
  stock: '10',
  lowStockThreshold: '3',
  shortDescription: 'Elegant solitaire diamond ring',
  description: '24kt diamond ring handcrafted in gold',
  weight: '5',
  status: 'approved',
  freeShipping: 'false',
  shippingDays: '7',
  image1: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800',
  image2: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
  isFeatured: 'false',
  isNewArrival: 'true',
  isBestSeller: 'false',
  segments: 'Women',
  occasions: 'Wedding,Anniversary',
  collectionStyles: 'Modern,Classic',
  themes: 'Love',
  productPersonas: 'Bride',
  wearingTypes: 'Ring',
  giftTags: 'Gift',
  dimensionLength: '15',
  dimensionWidth: '15',
  dimensionHeight: '5',
  dimensionUnit: 'mm',
  seoTitle: 'Diamond Solitaire Ring | VK Jewellers',
  seoDescription: 'Buy elegant 24kt diamond solitaire ring online',
  seoKeywords: 'diamond ring,solitaire ring,gold ring',
  metalType: '14KT Yellow Gold',
  grossWeight: '3.2',
  netWeight: '2.8',
  metalRate: '5500',
  metalAmount: '15400',
  diamondPieces: '1',
  diamondCarat: '0.5',
  diamondClarity: 'VVS-VS',
  diamondCut: 'Round',
  diamondColor: 'F',
  diamondAmount: '8500',
  makingCharges: '6800',
  gstPct: '3',
  certLab: 'IGI',
  certNumber: 'IGI123456',
  certImage: '',
};

function csvEscape(v) {
  const s = String(v == null ? '' : v);
  return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadTemplate() {
  const header = CSV_HEADERS.join(',');
  const sample = CSV_HEADERS.map((k) => csvEscape(CSV_SAMPLE[k] || '')).join(',');
  const csv = [header, sample].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'vk_products_template.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ── Bulk Upload Modal ──────────────────────────────────────────
function BulkUploadModal({ onClose, onSuccess }) {
  const fileRef    = useRef(null);
  const logRef     = useRef(null);
  const [file,     setFile]     = useState(null);
  const [dragging, setDragging] = useState(false);
  const [phase,    setPhase]    = useState('idle'); // idle | processing | done | error
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [rows,     setRows]     = useState([]);     // live row results
  const [summary,  setSummary]  = useState(null);   // { successCount, failCount, total }

  // Auto-scroll the live log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [rows]);

  const handleFile = (f) => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['csv','xlsx','xls'].includes(ext)) { toast.error('Only CSV or Excel files are allowed'); return; }
    setFile(f);
    setPhase('idle');
    setRows([]);
    setSummary(null);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); };

  const handleUpload = async () => {
    if (!file) return;
    setPhase('processing');
    setProgress({ done: 0, total: 0 });
    setRows([]);
    setSummary(null);

    try {
      const token   = localStorage.getItem('token');
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const fd      = new FormData();
      fd.append('file', file);

      const response = await fetch(`${apiBase}/admin/products/bulk-upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      // Non-SSE error (400/401/500 before stream started)
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json?.message || `Server error ${response.status}`);
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete last line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let event;
          try { event = JSON.parse(line.slice(6)); } catch { continue; }

          if (event.type === 'start') {
            setProgress({ done: 0, total: event.total });
          } else if (event.type === 'row') {
            setProgress({ done: event.done, total: event.total });
            setRows((prev) => [...prev, event.row]);
          } else if (event.type === 'done') {
            setSummary({ successCount: event.successCount, failCount: event.failCount, total: event.total });
            setPhase('done');
            if (event.successCount > 0) {
              toast.success(`${event.successCount} product${event.successCount > 1 ? 's' : ''} created`);
              onSuccess();
            } else {
              toast.error('No products were created — check failed rows');
            }
          } else if (event.type === 'error') {
            throw new Error(event.message);
          }
        }
      }
    } catch (err) {
      setPhase('error');
      toast.error(err?.message || 'Upload failed');
    }
  };

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const successRows = rows.filter((r) => r.status === 'success');
  const failRows    = rows.filter((r) => r.status === 'error');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={phase === 'processing' ? undefined : onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-heading text-lg font-bold text-gray-900">Bulk Upload Products</h2>
            <p className="text-xs text-gray-400 mt-0.5">Upload a CSV or Excel file to create multiple products at once</p>
          </div>
          <button onClick={onClose} disabled={phase === 'processing'} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* ── PROCESSING PHASE ── */}
          {phase === 'processing' && (
            <div className="space-y-4">
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Processing rows…
                  </span>
                  <span className="text-gray-500 tabular-nums">
                    {progress.done} / {progress.total || '?'} &nbsp;·&nbsp; {pct}%
                  </span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#C9A84C,#5a413f)' }}
                  />
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="text-green-600 font-semibold">{successRows.length} created</span>
                  <span className="text-red-500 font-semibold">{failRows.length} failed</span>
                </div>
              </div>

              {/* Live log */}
              <div
                ref={logRef}
                className="border border-gray-100 rounded-xl bg-gray-50 max-h-52 overflow-y-auto divide-y divide-gray-100"
              >
                {rows.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6">Waiting for first row…</p>
                )}
                {rows.map((r, idx) => (
                  <div key={idx} className="flex items-start gap-3 px-4 py-2.5">
                    {r.status === 'success' ? (
                      <span className="w-5 h-5 mt-0.5 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </span>
                    ) : (
                      <span className="w-5 h-5 mt-0.5 flex-shrink-0 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">Row {r.rowNum}</span>
                        <span className="text-xs text-gray-700 font-medium truncate">{r.title}</span>
                      </div>
                      {r.status === 'error' && (
                        <p className="text-[11px] text-red-500 mt-0.5 leading-snug break-words">
                          {/^Duplicate/i.test(r.error)
                            ? <><span className="inline-block bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded text-[10px] mr-1">Duplicate</span>{r.error.replace(/^Duplicate\s*/i, '')}</>
                            : r.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── DONE PHASE ── */}
          {phase === 'done' && summary && (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center bg-gray-50 rounded-xl py-4">
                  <p className="text-2xl font-bold text-gray-800">{summary.total}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Total Rows</p>
                </div>
                <div className="text-center bg-green-50 rounded-xl py-4">
                  <p className="text-2xl font-bold text-green-600">{summary.successCount}</p>
                  <p className="text-xs text-green-500 mt-0.5">Created</p>
                </div>
                <div className="text-center bg-red-50 rounded-xl py-4">
                  <p className="text-2xl font-bold text-red-500">{summary.failCount}</p>
                  <p className="text-xs text-red-400 mt-0.5">Failed</p>
                </div>
              </div>

              {/* Full log */}
              <div className="border border-gray-100 rounded-xl bg-gray-50 max-h-56 overflow-y-auto divide-y divide-gray-100">
                {rows.map((r, idx) => (
                  <div key={idx} className="flex items-start gap-3 px-4 py-2.5">
                    {r.status === 'success' ? (
                      <span className="w-5 h-5 mt-0.5 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </span>
                    ) : (
                      <span className="w-5 h-5 mt-0.5 flex-shrink-0 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">Row {r.rowNum}</span>
                        <span className="text-xs text-gray-700 font-medium truncate flex-1">{r.title}</span>
                        {r.status === 'success' && <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded flex-shrink-0">Created</span>}
                      </div>
                      {r.status === 'error' && (
                        <p className="text-[11px] text-red-500 mt-0.5 leading-snug break-words">
                          {/^Duplicate/i.test(r.error)
                            ? <><span className="inline-block bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded text-[10px] mr-1">Duplicate</span>{r.error.replace(/^Duplicate\s*/i, '')}</>
                            : r.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── IDLE PHASE ── */}
          {(phase === 'idle' || phase === 'error') && (
            <>
              {/* Download template */}
              <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-blue-800">Download Sample Template</p>
                  <p className="text-xs text-blue-500 mt-0.5">Fill in the CSV and upload below — all 53 columns included</p>
                </div>
                <button onClick={downloadTemplate} className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download CSV
                </button>
              </div>

              {/* Column reference — grouped */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Column Reference</p>
                {CSV_GROUPS.map((group) => {
                  const cols = CSV_COLUMNS.filter((c) => c.group === group.id);
                  return (
                    <div key={group.id}>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{group.label}</p>
                      <div className="flex flex-wrap gap-1">
                        {cols.map((col) => (
                          <span key={col.key} className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${group.color}`}>
                            {col.key}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <p className="text-[11px] text-gray-400 pt-1 border-t border-gray-200">
                  <span className="text-red-500 font-semibold">*</span> Required &nbsp;·&nbsp;
                  <strong>category</strong>: exact name or slug &nbsp;·&nbsp;
                  <strong>images</strong>: full https:// URL &nbsp;·&nbsp;
                  <strong>tags</strong>: comma-separated &nbsp;·&nbsp;
                  <strong>flags</strong>: true / false
                </p>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragging ? 'border-primary bg-primary/5' : file ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              >
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                {file ? (
                  <>
                    <svg className="w-10 h-10 text-green-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p className="font-semibold text-sm text-gray-800">{file.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB &nbsp;·&nbsp; Click to change</p>
                  </>
                ) : (
                  <>
                    <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <p className="font-semibold text-sm text-gray-600">Drag & drop your file here</p>
                    <p className="text-xs text-gray-400 mt-1">or click to browse &nbsp;·&nbsp; CSV, XLSX, XLS &nbsp;·&nbsp; Max 5 MB</p>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <button onClick={onClose} disabled={phase === 'processing'} className="btn-outline text-sm px-4 py-2 disabled:opacity-30">
            {phase === 'done' ? 'Close' : 'Cancel'}
          </button>
          {phase !== 'done' && phase !== 'processing' && (
            <button
              onClick={handleUpload}
              disabled={!file}
              className="btn-primary text-sm px-6 py-2 disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              Upload &amp; Create Products
            </button>
          )}
          {phase === 'done' && summary?.failCount > 0 && (
            <button
              onClick={() => { setPhase('idle'); setFile(null); setRows([]); setSummary(null); }}
              className="btn-outline text-sm px-4 py-2"
            >
              Upload Another File
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const STATUS_BADGE = {
  approved: 'badge-success',
  pending: 'badge-warning',
  rejected: 'badge-danger',
  draft: 'badge bg-gray-100 text-gray-600',
  archived: 'badge bg-gray-100 text-gray-400',
};

// ── SVG icons ──────────────────────────────────────────────
const IcEdit    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const IcTrash   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const IcCheck   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const IcX       = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const IcArchive = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12" /></svg>;
const IcRefresh = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;

const IconBtn = ({ onClick, disabled, title, color, children }) => (
  <Tip label={title}>
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${color}`}
    >
      {children}
    </button>
  </Tip>
);

export default function AdminProducts() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [bulkModal, setBulkModal] = useState(false);
  const [flagCounts, setFlagCounts] = useState({ featured: 0, bestseller: 0, newarrival: 0, lifestyle1: 0, lifestyle2: 0 });

  // ── Bulk selection ─────────────────────────────────────────
  const [selected, setSelected] = useState(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(null); // 'delete' | 'archive' | null
  const [bulkProcessing, setBulkProcessing] = useState(false);

  const FLAG_LIMITS = { featured: 12, bestseller: 8, newarrival: 999, lifestyle1: 4, lifestyle2: 4 };

  const fetchFlagCounts = useCallback(async () => {
    try {
      const [f, b, n, l1, l2] = await Promise.all([
        productAPI.getAll({ isFeatured: true,   limit: 1 }),
        productAPI.getAll({ isBestSeller: true,  limit: 1 }),
        productAPI.getAll({ isNewArrival: true,  limit: 1 }),
        productAPI.getAll({ isLifestyle1: true,  limit: 1 }),
        productAPI.getAll({ isLifestyle2: true,  limit: 1 }),
      ]);
      setFlagCounts({
        featured:   f.data.meta?.total  || 0,
        bestseller: b.data.meta?.total  || 0,
        newarrival: n.data.meta?.total  || 0,
        lifestyle1: l1.data.meta?.total || 0,
        lifestyle2: l2.data.meta?.total || 0,
      });
    } catch (_) {}
  }, []);

  const statusFilter = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const { data } = await productAPI.adminGetAll(params);
      setProducts(data.data || []);
      setMeta(data.meta || {});
    } catch (_) {}
    finally { setLoading(false); }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchProducts(); fetchFlagCounts(); }, [fetchProducts, fetchFlagCounts]);
  useEffect(() => { setSelected(new Set()); }, [products]);

  const allSelected  = products.length > 0 && products.every((p) => selected.has(p._id));
  const someSelected = !allSelected && products.some((p) => selected.has(p._id));

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(products.map((p) => p._id)));
  const toggleOne = (id) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleBulkDelete = async () => {
    setBulkProcessing(true);
    try {
      const ids = [...selected];
      await productAPI.adminBulkDelete(ids);
      toast.success(`${ids.length} product${ids.length > 1 ? 's' : ''} deleted`);
      setSelected(new Set()); setBulkConfirm(null); fetchProducts();
    } catch (err) { toast.error(err?.message || 'Bulk delete failed'); }
    finally { setBulkProcessing(false); }
  };

  const handleBulkArchive = async () => {
    setBulkProcessing(true);
    try {
      const ids = [...selected];
      await productAPI.adminBulkArchive(ids);
      toast.success(`${ids.length} product${ids.length > 1 ? 's' : ''} archived`);
      setSelected(new Set()); setBulkConfirm(null); fetchProducts();
    } catch (err) { toast.error(err?.message || 'Bulk archive failed'); }
    finally { setBulkProcessing(false); }
  };

  const handleStatusUpdate = async (id, status, rejectionReason) => {
    setUpdating(id);
    try {
      await productAPI.adminUpdateStatus(id, { status, rejectionReason });
      toast.success(`Product ${status}`);
      fetchProducts();
    } catch (error) {
      toast.error(error.message || 'Failed');
    } finally { setUpdating(null); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setUpdating(deleteConfirm._id);
    try {
      await productAPI.adminDelete(deleteConfirm._id);
      toast.success('Product deleted permanently');
      setDeleteConfirm(null);
      fetchProducts();
    } catch (error) {
      toast.error(error.message || 'Delete failed');
    } finally { setUpdating(null); }
  };

  const handleToggle = async (id, type) => {
    setUpdating(id + type);
    try {
      if (type === 'featured')    await productAPI.adminToggleFeatured(id);
      if (type === 'bestseller')  await productAPI.adminToggleBestSeller(id);
      if (type === 'newarrival')  await productAPI.adminToggleNewArrival(id);
      if (type === 'lifestyle1')  await productAPI.adminToggleLifestyle1(id);
      if (type === 'lifestyle2')  await productAPI.adminToggleLifestyle2(id);
      toast.success('Updated');
      fetchProducts();
      fetchFlagCounts();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed');
    } finally { setUpdating(null); }
  };

  const Toggle = ({ active, onClick, disabled, label, color, flagKey }) => {
    const count = flagCounts[flagKey] ?? 0;
    const limit = FLAG_LIMITS[flagKey] ?? 999;
    const atLimit = count >= limit && !active;
    const isDisabled = disabled || atLimit;
    return (
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={onClick}
          disabled={isDisabled}
          title={atLimit ? `Limit reached (${count}/${limit}) — turn one off first` : label}
          className={`relative w-9 h-5 rounded-full transition-all duration-200
            ${active ? color : atLimit ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-200'}
            disabled:opacity-50`}
        >
          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${active ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
        <span className={`text-[9px] uppercase tracking-wider ${atLimit && !active ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>
          {label} {limit < 999 ? `${count}/${limit}` : ''}
        </span>
      </div>
    );
  };

  const setPage = (p) => setSearchParams({ status: statusFilter, search, page: p });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => navigate('/admin/products/images')} className="btn-outline text-sm flex items-center gap-2 py-2 px-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="hidden sm:inline">Manage Images</span>
            <span className="sm:hidden">Images</span>
          </button>
          <button onClick={() => setBulkModal(true)} className="btn-outline text-sm flex items-center gap-2 py-2 px-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            <span className="hidden sm:inline">Bulk Upload</span>
            <span className="sm:hidden">Bulk</span>
          </button>
          <button onClick={() => navigate('/admin/products/add')} className="btn-primary text-sm flex items-center gap-2 py-2 px-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card-luxury p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearchParams({ status: statusFilter, search: e.target.value, page: 1 })}
          className="input-luxury flex-1 min-w-48 h-10 py-2"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setSearchParams({ status: e.target.value, search, page: 1 })}
          compact
          className="w-40"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </Select>
      </div>

      {/* Bulk action bar — visible when rows are selected */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="card-luxury px-4 py-3 flex items-center gap-3 bg-primary/5 border border-primary/20"
          >
            <span className="text-sm font-semibold text-primary flex-shrink-0">
              {selected.size} selected
            </span>
            <div className="h-4 w-px bg-primary/20" />
            <button
              onClick={() => setBulkConfirm('archive')}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <IcArchive />
              Archive
            </button>
            <button
              onClick={() => setBulkConfirm('delete')}
              className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              <IcTrash />
              Delete
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
            >
              <IcX />
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="card-luxury overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {/* Select-all checkbox */}
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded cursor-pointer"
                    style={{ accentColor: '#5a413f' }}
                  />
                </th>
                {['Product', 'Category', 'Price', 'Stock', 'Status', 'Home Page Flags', 'Lifestyle Panels', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-4 py-4 w-10"><div className="w-4 h-4 rounded shimmer-loading" /></td>
                    {/* Product */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg shimmer-img flex-shrink-0" />
                        <div className="space-y-2 flex-1">
                          <div className="shimmer-text h-3.5 w-36 rounded" />
                          <div className="shimmer-text h-2.5 w-20 rounded" />
                        </div>
                      </div>
                    </td>
                    {/* Vendor */}
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-24 rounded" /></td>
                    {/* Price */}
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-16 rounded" /></td>
                    {/* Stock */}
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-8 rounded" /></td>
                    {/* Status */}
                    <td className="px-5 py-4"><div className="shimmer-loading h-5 w-16 rounded-full" /></td>
                    {/* Flags */}
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        {[0,1,2].map((j) => <div key={j} className="shimmer-loading w-9 h-5 rounded-full" />)}
                      </div>
                    </td>
                    {/* Lifestyle */}
                    <td className="px-5 py-4">
                      <div className="flex gap-3">
                        {[0,1].map((j) => <div key={j} className="shimmer-loading w-9 h-5 rounded-full" />)}
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5">
                        <div className="shimmer-loading w-8 h-8 rounded-lg" />
                        <div className="shimmer-loading w-8 h-8 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-300">No products found</td></tr>
              ) : products.map((product) => (
                <tr key={product._id} className={`hover:bg-gray-50/50 transition-colors ${selected.has(product._id) ? 'bg-primary/5' : ''}`}>
                  {/* Checkbox */}
                  <td className="px-4 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={selected.has(product._id)}
                      onChange={() => toggleOne(product._id)}
                      className="w-4 h-4 rounded cursor-pointer"
                      style={{ accentColor: '#5a413f' }}
                    />
                  </td>
                  {/* Product */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-luxury-cream overflow-hidden flex-shrink-0">
                        {product.images?.[0]?.url && <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{product.title}</p>
                        <p className="text-xs text-gray-400">{product.sku || '—'}</p>
                      </div>
                    </div>
                  </td>
                  {/* Category */}
                  <td className="px-5 py-4 text-sm text-gray-600">{product.category?.name || '—'}</td>
                  {/* Price */}
                  <td className="px-5 py-4 text-sm font-semibold text-gray-800">₹{product.price?.toLocaleString('en-IN')}</td>
                  {/* Stock */}
                  <td className="px-5 py-4">
                    <span className={`text-sm font-medium ${product.stock < 5 ? 'text-red-500' : 'text-gray-700'}`}>
                      {product.stock}
                    </span>
                  </td>
                  {/* Status */}
                  <td className="px-5 py-4">
                    <span className={`badge text-xs capitalize ${STATUS_BADGE[product.status] || 'badge-primary'}`}>
                      {product.status}
                    </span>
                  </td>
                  {/* Home Page Flags */}
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <Toggle active={product.isFeatured}   onClick={() => handleToggle(product._id, 'featured')}   disabled={!!updating} label="Featured"  color="bg-[#C9A84C]" flagKey="featured" />
                      <Toggle active={product.isBestSeller} onClick={() => handleToggle(product._id, 'bestseller')} disabled={!!updating} label="Deal"      color="bg-[#B76E79]" flagKey="bestseller" />
                      <Toggle active={product.isNewArrival} onClick={() => handleToggle(product._id, 'newarrival')} disabled={!!updating} label="New"       color="bg-[#5a413f]" flagKey="newarrival" />
                    </div>
                  </td>
                  {/* Lifestyle Panels */}
                  <td className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <Toggle active={product.isLifestyle1} onClick={() => handleToggle(product._id, 'lifestyle1')} disabled={!!updating} label="Bridal"    color="bg-[#C9A84C]" flagKey="lifestyle1" />
                      <Toggle active={product.isLifestyle2} onClick={() => handleToggle(product._id, 'lifestyle2')} disabled={!!updating} label="Everyday"  color="bg-[#B76E79]" flagKey="lifestyle2" />
                    </div>
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <IconBtn onClick={() => navigate(`/admin/products/edit/${product._id}`)} title="Edit" color="bg-blue-50 text-blue-600 hover:bg-blue-100">
                        <IcEdit />
                      </IconBtn>
                      <IconBtn onClick={() => setDeleteConfirm(product)} disabled={!!updating} title="Delete" color="bg-red-50 text-red-500 hover:bg-red-100">
                        <IcTrash />
                      </IconBtn>
                      {product.status === 'pending' && (
                        <>
                          <IconBtn onClick={() => handleStatusUpdate(product._id, 'approved')} disabled={updating === product._id} title="Approve" color="bg-green-50 text-green-600 hover:bg-green-100">
                            <IcCheck />
                          </IconBtn>
                          <IconBtn
                            onClick={() => { const r = prompt('Rejection reason:'); if (r) handleStatusUpdate(product._id, 'rejected', r); }}
                            disabled={updating === product._id}
                            title="Reject"
                            color="bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            <IcX />
                          </IconBtn>
                        </>
                      )}
                      {product.status === 'approved' && (
                        <IconBtn onClick={() => handleStatusUpdate(product._id, 'archived')} disabled={updating === product._id} title="Archive" color="bg-gray-100 text-gray-500 hover:bg-gray-200">
                          <IcArchive />
                        </IconBtn>
                      )}
                      {(product.status === 'rejected' || product.status === 'archived') && (
                        <IconBtn onClick={() => handleStatusUpdate(product._id, 'approved')} disabled={updating === product._id} title="Re-approve" color="bg-green-50 text-green-600 hover:bg-green-100">
                          <IcRefresh />
                        </IconBtn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} pages={meta.pages} total={meta.total} shown={products.length} onPage={setPage} />
      </div>

      {/* Bulk Action Confirm Modal */}
      {bulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm"
          >
            {bulkConfirm === 'delete' ? (
              <>
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </div>
                <h3 className="text-center font-heading font-bold text-gray-900 text-lg mb-2">Delete {selected.size} Products?</h3>
                <p className="text-center text-xs text-red-500 mb-6">This permanently removes all selected products and cannot be undone.</p>
                <div className="flex gap-3">
                  <button onClick={() => setBulkConfirm(null)} disabled={bulkProcessing} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40">Cancel</button>
                  <button onClick={handleBulkDelete} disabled={bulkProcessing} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-50">
                    {bulkProcessing ? 'Deleting…' : `Delete ${selected.size}`}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12" /></svg>
                </div>
                <h3 className="text-center font-heading font-bold text-gray-900 text-lg mb-2">Archive {selected.size} Products?</h3>
                <p className="text-center text-sm text-gray-500 mb-1">Products will be hidden from the store.</p>
                <p className="text-center text-xs text-gray-400 mb-6">You can re-approve them later from the Archived filter.</p>
                <div className="flex gap-3">
                  <button onClick={() => setBulkConfirm(null)} disabled={bulkProcessing} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40">Cancel</button>
                  <button onClick={handleBulkArchive} disabled={bulkProcessing} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-900 text-white text-sm font-bold transition-colors disabled:opacity-50">
                    {bulkProcessing ? 'Archiving…' : `Archive ${selected.size}`}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm"
          >
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-center font-heading font-bold text-gray-900 text-lg mb-2">Delete Product?</h3>
            <p className="text-center text-sm text-gray-500 mb-1">
              <span className="font-semibold text-gray-800">{deleteConfirm.title}</span>
            </p>
            <p className="text-center text-xs text-red-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={updating === deleteConfirm._id} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-50">
                {updating === deleteConfirm._id ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      <AnimatePresence>
        {bulkModal && (
          <BulkUploadModal
            onClose={() => setBulkModal(false)}
            onSuccess={() => { fetchProducts(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
