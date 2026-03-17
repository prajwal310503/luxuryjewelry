import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { cmsAPI } from '../../services/api';

// ─── Icons ────────────────────────────────────────────────────────────────────
const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const ArrowUpIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
);
const ArrowDownIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);
const ChevronDown = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);
const SaveIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const GripIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeItem = () => ({ label: '', url: '', type: 'link', badge: '', badgeColor: '', children: [] });
const makeColumn = () => ({ heading: '', items: [] });
const makeSubItem = () => ({ label: '', url: '', icon: '' });
const makeChild = () => ({ columns: [], featuredImage: '', featuredTitle: '', featuredLink: '' });

const ICON_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'ring', label: 'Ring' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'gem', label: 'Gem' },
  { value: 'heart', label: 'Heart' },
  { value: 'star', label: 'Star' },
  { value: 'circle', label: 'Circle' },
  { value: 'gold', label: 'Gold' },
  { value: 'metal', label: 'Metal' },
  { value: 'tag', label: 'Price Tag' },
];

// ─── Sub-item Row ─────────────────────────────────────────────────────────────
const SubItemRow = ({ sub, onUpdate, onRemove }) => (
  <div className="flex items-center gap-2 py-1.5 pl-2 pr-1 rounded-lg bg-gray-50 border border-gray-100">
    <input
      type="text"
      value={sub.label}
      onChange={(e) => onUpdate('label', e.target.value)}
      placeholder="Label"
      className="flex-1 min-w-0 text-[12px] bg-transparent border-none outline-none text-gray-700 placeholder:text-gray-300"
    />
    <input
      type="text"
      value={sub.url}
      onChange={(e) => onUpdate('url', e.target.value)}
      placeholder="/url"
      className="w-32 text-[12px] bg-transparent border-none outline-none text-gray-500 placeholder:text-gray-300"
    />
    <select
      value={sub.icon || ''}
      onChange={(e) => onUpdate('icon', e.target.value)}
      className="text-[11px] bg-transparent border border-gray-200 rounded px-1.5 py-0.5 text-gray-500 outline-none"
    >
      {ICON_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    <button
      onClick={onRemove}
      className="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
    >
      <TrashIcon />
    </button>
  </div>
);

// ─── Column Editor ────────────────────────────────────────────────────────────
const ColumnEditor = ({ col, colIdx, onUpdate, onRemove, onAddSubItem, onRemoveSubItem, onUpdateSubItem }) => (
  <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
    <div className="flex items-center gap-3">
      <input
        type="text"
        value={col.heading}
        onChange={(e) => onUpdate('heading', e.target.value)}
        placeholder="Column heading (e.g. SHOP BY STYLE)"
        className="flex-1 input-luxury text-[12px] py-2"
      />
      <button
        onClick={onRemove}
        className="p-2 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 flex-shrink-0"
        title="Remove column"
      >
        <TrashIcon />
      </button>
    </div>

    {/* Sub-items */}
    <div className="space-y-1.5">
      {(col.items || []).map((sub, si) => (
        <SubItemRow
          key={si}
          sub={sub}
          onUpdate={(field, value) => onUpdateSubItem(si, field, value)}
          onRemove={() => onRemoveSubItem(si)}
        />
      ))}
    </div>

    <button
      onClick={onAddSubItem}
      className="flex items-center gap-1.5 text-[11.5px] text-primary hover:text-primary/80 transition-colors font-medium tracking-wide"
    >
      <PlusIcon />
      Add item
    </button>
  </div>
);

// ─── Mega Menu Editor ─────────────────────────────────────────────────────────
const MegaMenuEditor = ({ item, itemIdx, onUpdateChild }) => {
  const child = item.children?.[0] || makeChild();

  const updateChild = (updates) => onUpdateChild({ ...child, ...updates });

  const addColumn = () => updateChild({ columns: [...(child.columns || []), makeColumn()] });

  const removeColumn = (ci) =>
    updateChild({ columns: child.columns.filter((_, i) => i !== ci) });

  const updateColumn = (ci, field, value) =>
    updateChild({ columns: child.columns.map((col, i) => i === ci ? { ...col, [field]: value } : col) });

  const addSubItem = (ci) =>
    updateChild({
      columns: child.columns.map((col, i) =>
        i === ci ? { ...col, items: [...(col.items || []), makeSubItem()] } : col
      ),
    });

  const removeSubItem = (ci, si) =>
    updateChild({
      columns: child.columns.map((col, i) =>
        i === ci ? { ...col, items: col.items.filter((_, j) => j !== si) } : col
      ),
    });

  const updateSubItem = (ci, si, field, value) =>
    updateChild({
      columns: child.columns.map((col, i) =>
        i === ci
          ? { ...col, items: col.items.map((sub, j) => j === si ? { ...sub, [field]: value } : sub) }
          : col
      ),
    });

  return (
    <div className="mt-4 space-y-4 border-t border-dashed border-gray-200 pt-4">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Mega Menu Columns</p>

      {/* Columns grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {(child.columns || []).map((col, ci) => (
          <ColumnEditor
            key={ci}
            col={col}
            colIdx={ci}
            onUpdate={(field, value) => updateColumn(ci, field, value)}
            onRemove={() => removeColumn(ci)}
            onAddSubItem={() => addSubItem(ci)}
            onRemoveSubItem={(si) => removeSubItem(ci, si)}
            onUpdateSubItem={(si, field, value) => updateSubItem(ci, si, field, value)}
          />
        ))}
      </div>

      <button
        onClick={addColumn}
        className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-xl text-[12px] text-gray-400 hover:border-primary hover:text-primary transition-colors"
      >
        <PlusIcon />
        Add column
      </button>

      {/* Featured panel */}
      <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Featured Image Panel</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-3">
            <label className="label-luxury">Image URL</label>
            <input
              type="text"
              value={child.featuredImage || ''}
              onChange={(e) => updateChild({ featuredImage: e.target.value })}
              placeholder="https://res.cloudinary.com/... or leave empty to hide"
              className="input-luxury text-[12px]"
            />
          </div>
          <div>
            <label className="label-luxury">Featured Title</label>
            <input
              type="text"
              value={child.featuredTitle || ''}
              onChange={(e) => updateChild({ featuredTitle: e.target.value })}
              placeholder="e.g. Bridal Edit"
              className="input-luxury text-[12px]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label-luxury">Link URL</label>
            <input
              type="text"
              value={child.featuredLink || ''}
              onChange={(e) => updateChild({ featuredLink: e.target.value })}
              placeholder="/collections/bridal"
              className="input-luxury text-[12px]"
            />
          </div>
        </div>
        {child.featuredImage && (
          <div className="mt-2 relative w-24 h-32 rounded-xl overflow-hidden border border-gray-100">
            <img src={child.featuredImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Item Editor ──────────────────────────────────────────────────────────────
const ItemEditor = ({ item, idx, total, expanded, onToggle, onUpdate, onRemove, onMove, onUpdateChild }) => {
  const isMega = item.type === 'mega';

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50/60 border-b border-gray-100">
        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] flex items-center justify-center font-semibold flex-shrink-0">
          {idx + 1}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">
            {item.label || <span className="text-gray-300 font-normal">Untitled item</span>}
          </p>
          <p className="text-[10px] text-gray-400 truncate">{item.url || 'No URL set'}</p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <span className={`badge text-[10px] ${isMega ? 'badge-gold' : 'badge-primary'}`}>
            {item.type}
          </span>
          {item.badge && (
            <span className="px-1.5 py-0.5 text-[9px] bg-gray-900 text-white rounded uppercase font-bold">
              {item.badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            onClick={() => onMove(-1)}
            disabled={idx === 0}
            className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded"
            title="Move up"
          >
            <ArrowUpIcon />
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={idx === total - 1}
            className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed rounded"
            title="Move down"
          >
            <ArrowDownIcon />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded"
            title="Remove item"
          >
            <TrashIcon />
          </button>
          <button
            onClick={onToggle}
            className={`p-1.5 text-gray-400 hover:text-gray-700 transition-transform duration-200 rounded ${expanded ? 'rotate-180' : ''}`}
          >
            <ChevronDown />
          </button>
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-luxury">Label</label>
              <input
                type="text"
                value={item.label}
                onChange={(e) => onUpdate('label', e.target.value)}
                placeholder="Navigation label"
                className="input-luxury"
              />
            </div>
            <div>
              <label className="label-luxury">URL</label>
              <input
                type="text"
                value={item.url}
                onChange={(e) => onUpdate('url', e.target.value)}
                placeholder="/collections/rings"
                className="input-luxury"
              />
            </div>
            <div>
              <label className="label-luxury">Type</label>
              <select
                value={item.type}
                onChange={(e) => onUpdate('type', e.target.value)}
                className="input-luxury"
              >
                <option value="link">Link — simple nav link</option>
                <option value="mega">Mega — full-width dropdown with columns</option>
                <option value="dropdown">Dropdown — simple sub-links</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-luxury">Badge text</label>
                <input
                  type="text"
                  value={item.badge || ''}
                  onChange={(e) => onUpdate('badge', e.target.value)}
                  placeholder="NEW"
                  className="input-luxury"
                />
              </div>
              <div>
                <label className="label-luxury">Badge style</label>
                <select
                  value={item.badgeColor || ''}
                  onChange={(e) => onUpdate('badgeColor', e.target.value)}
                  className="input-luxury"
                >
                  <option value="">Dark (default)</option>
                  <option value="gold">Gold</option>
                  <option value="red">Red / Sale</option>
                  <option value="primary">Brand</option>
                </select>
              </div>
            </div>
          </div>

          {/* Mega menu editor */}
          {isMega && (
            <MegaMenuEditor
              item={item}
              itemIdx={idx}
              onUpdateChild={(childData) => onUpdateChild(childData)}
            />
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminMenus() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = () => {
    setLoading(true);
    cmsAPI.adminGetMenus()
      .then(({ data }) => {
        const m = data.data || [];
        setMenus(m);
        if (m.length) setSelectedMenu(JSON.parse(JSON.stringify(m[0])));
      })
      .catch(() => toast.error('Failed to load menus'))
      .finally(() => setLoading(false));
  };

  const selectMenu = (menu) => {
    setSelectedMenu(JSON.parse(JSON.stringify(menu)));
    setExpandedItems({});
  };

  const saveMenu = async () => {
    if (!selectedMenu) return;
    setSaving(true);
    try {
      await cmsAPI.upsertMenu(selectedMenu.location, {
        items: selectedMenu.items,
        name: selectedMenu.name,
        isActive: selectedMenu.isActive,
      });
      toast.success('Menu saved successfully');
      fetchMenus();
    } catch {
      toast.error('Failed to save menu');
    } finally {
      setSaving(false);
    }
  };

  // ─── Item operations ──────────────────────────────────────────────────────
  const addItem = () => {
    setSelectedMenu((m) => ({ ...m, items: [...(m.items || []), makeItem()] }));
    const newIdx = (selectedMenu?.items?.length || 0);
    setExpandedItems((e) => ({ ...e, [newIdx]: true }));
  };

  const removeItem = (idx) => {
    setSelectedMenu((m) => ({ ...m, items: m.items.filter((_, i) => i !== idx) }));
    setExpandedItems((e) => {
      const next = {};
      Object.keys(e).forEach((k) => {
        const ki = Number(k);
        if (ki < idx) next[ki] = e[k];
        else if (ki > idx) next[ki - 1] = e[k];
      });
      return next;
    });
  };

  const updateItem = (idx, field, value) => {
    setSelectedMenu((m) => ({
      ...m,
      items: m.items.map((item, i) => i === idx ? { ...item, [field]: value } : item),
    }));
  };

  const moveItem = (idx, dir) => {
    const items = [...(selectedMenu.items || [])];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= items.length) return;
    [items[idx], items[newIdx]] = [items[newIdx], items[idx]];
    setSelectedMenu((m) => ({ ...m, items }));
    setExpandedItems((e) => {
      const next = { ...e };
      const a = e[idx];
      const b = e[newIdx];
      if (b !== undefined) next[idx] = b; else delete next[idx];
      if (a !== undefined) next[newIdx] = a; else delete next[newIdx];
      return next;
    });
  };

  const updateChild = (itemIdx, childData) => {
    setSelectedMenu((m) => ({
      ...m,
      items: m.items.map((item, i) => i === itemIdx ? { ...item, children: [childData] } : item),
    }));
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="space-y-3">
      {[1, 2, 3].map((n) => <div key={n} className="h-16 shimmer-loading rounded-xl" />)}
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Navigation Menus</h1>
          <p className="text-sm text-gray-400 mt-0.5">Edit nav items, mega menu columns, and featured images</p>
        </div>
        {selectedMenu && (
          <button onClick={saveMenu} disabled={saving} className="btn-primary gap-2">
            <SaveIcon />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* No menus state */}
      {menus.length === 0 && (
        <div className="card-luxury p-12 text-center">
          <p className="text-gray-400 text-sm">No menus found.</p>
          <p className="text-gray-300 text-xs mt-1">Run the seeder to create default menus, then refresh.</p>
        </div>
      )}

      {/* ── Menu tabs ──────────────────────────────────────────────────── */}
      {menus.length > 0 && (
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {menus.map((menu) => (
            <button
              key={menu._id}
              onClick={() => selectMenu(menu)}
              className={`px-5 py-2 text-sm tracking-wide capitalize rounded-lg transition-all duration-150 ${
                selectedMenu?._id === menu._id
                  ? 'bg-white text-primary font-medium shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {menu.name || menu.location}
            </button>
          ))}
        </div>
      )}

      {/* ── Items editor ───────────────────────────────────────────────── */}
      {selectedMenu && (
        <div className="space-y-2.5">

          {/* Items list */}
          {(selectedMenu.items || []).map((item, idx) => (
            <ItemEditor
              key={idx}
              item={item}
              idx={idx}
              total={(selectedMenu.items || []).length}
              expanded={!!expandedItems[idx]}
              onToggle={() => setExpandedItems((e) => ({ ...e, [idx]: !e[idx] }))}
              onUpdate={(field, value) => updateItem(idx, field, value)}
              onRemove={() => removeItem(idx)}
              onMove={(dir) => moveItem(idx, dir)}
              onUpdateChild={(childData) => updateChild(idx, childData)}
            />
          ))}

          {/* Add item button */}
          <button
            onClick={addItem}
            className="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-primary hover:text-primary transition-colors"
          >
            <PlusIcon />
            Add Navigation Item
          </button>
        </div>
      )}

      {/* Help note */}
      {selectedMenu && (
        <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-[12px] text-amber-700 leading-relaxed">
          <strong>Tip:</strong> Set item type to <strong>Mega</strong> to show a full-width dropdown with columns on hover.
          Use <strong>Shop By Style / Shape / Material / Price</strong> as column headings to match the Royalbutterfly layout.
          Add a featured image URL from Cloudinary to show a featured product panel on the right.
        </div>
      )}
    </div>
  );
}
