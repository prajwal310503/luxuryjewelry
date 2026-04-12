import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { attributeAPI } from '../../services/api';
import Select from '../../components/ui/Select';

const GROUPS = ['material', 'diamond', 'gemstone', 'size', 'merchandising', 'other'];
const TYPES = ['select', 'multiselect', 'color', 'size', 'boolean', 'text', 'number'];
const DISPLAY_TYPES = ['dropdown', 'checkbox', 'radio', 'swatch', 'button'];

export default function AdminAttributes() {
  const [attributes, setAttributes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAttrModal, setShowAttrModal] = useState(false);
  const [showValueModal, setShowValueModal] = useState(false);
  const [attrForm, setAttrForm] = useState({ name: '', type: 'select', displayType: 'dropdown', group: 'other', isFilterable: true, isVariant: false });
  const [valueForm, setValueForm] = useState({ value: '', colorCode: '', sortOrder: 0 });
  const [saving, setSaving] = useState(false);
  const [editValue, setEditValue] = useState(null);

  const fetchAttrs = async () => {
    setLoading(true);
    try {
      const { data } = await attributeAPI.getAll();
      setAttributes(data.data || []);
      if (selected) {
        const updated = (data.data || []).find((a) => a._id === selected._id);
        setSelected(updated || null);
      }
    } catch (_) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchAttrs(); }, []);

  const handleCreateAttr = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await attributeAPI.create(attrForm);
      toast.success('Attribute created');
      setShowAttrModal(false);
      fetchAttrs();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleDeleteAttr = async (id) => {
    if (!confirm('Delete this attribute and all its values?')) return;
    try {
      await attributeAPI.delete(id);
      toast.success('Deleted');
      if (selected?._id === id) setSelected(null);
      fetchAttrs();
    } catch (err) { toast.error(err.message); }
  };

  const handleSaveValue = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editValue) {
        await attributeAPI.updateValue(selected._id, editValue._id, valueForm);
        toast.success('Value updated');
      } else {
        await attributeAPI.createValue(selected._id, valueForm);
        toast.success('Value added');
      }
      setShowValueModal(false);
      setEditValue(null);
      setValueForm({ value: '', colorCode: '', sortOrder: 0 });
      fetchAttrs();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleDeleteValue = async (valId) => {
    if (!confirm('Delete this value?')) return;
    try {
      await attributeAPI.deleteValue(selected._id, valId);
      toast.success('Value deleted');
      fetchAttrs();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Attributes</h1>
        <button onClick={() => { setAttrForm({ name: '', type: 'select', displayType: 'dropdown', group: 'other', isFilterable: true, isVariant: false }); setShowAttrModal(true); }} className="btn-primary text-sm py-2.5">+ Add Attribute</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attributes List */}
        <div className="card-luxury overflow-hidden">
          <div className="p-4 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-700">All Attributes</p>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              Array.from({length:8}).map((_,i) => <div key={i} className="h-12 shimmer-loading m-3 rounded" />)
            ) : attributes.map((attr) => (
              <div
                key={attr._id}
                onClick={() => setSelected(attr)}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${selected?._id === attr._id ? 'bg-primary/5 border-l-2 border-primary' : 'hover:bg-gray-50'}`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">{attr.name}</p>
                  <p className="text-xs text-gray-400">{attr.group} · {attr.type} · {attr.values?.length || 0} values</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteAttr(attr._id); }} className="text-gray-300 hover:text-red-500 p-1 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Values Panel */}
        <div className="lg:col-span-2 card-luxury overflow-hidden">
          {!selected ? (
            <div className="flex items-center justify-center h-64 text-gray-300">
              <div className="text-center">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                <p className="text-sm">Select an attribute to manage its values</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800">{selected.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{selected.group} · {selected.displayType}</p>
                </div>
                <button
                  onClick={() => { setEditValue(null); setValueForm({ value: '', colorCode: '', sortOrder: selected.values?.length || 0 }); setShowValueModal(true); }}
                  className="btn-primary text-xs py-2 px-3"
                >
                  + Add Value
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {(selected.values || []).length === 0 ? (
                  <div className="py-10 text-center text-gray-300 text-sm">No values yet. Add some!</div>
                ) : (selected.values || []).map((val) => (
                  <div key={val._id} className="flex items-center gap-4 px-4 py-3">
                    {val.colorCode && (
                      <div className="w-6 h-6 rounded-full border border-gray-200 flex-shrink-0" style={{ backgroundColor: val.colorCode }} />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{val.value}</p>
                      <p className="text-xs text-gray-400">/{val.slug} · order: {val.sortOrder}</p>
                    </div>
                    <span className={`badge text-xs ${val.isActive ? 'badge-success' : 'badge-danger'}`}>{val.isActive ? 'Active' : 'Inactive'}</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => { setEditValue(val); setValueForm({ value: val.value, colorCode: val.colorCode || '', sortOrder: val.sortOrder }); setShowValueModal(true); }}
                        className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                      >Edit</button>
                      <button onClick={() => handleDeleteValue(val._id)} className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100">Del</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Attribute Modal */}
      {showAttrModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowAttrModal(false)}>
          <div className="bg-white rounded-2xl shadow-luxury-lg w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading text-lg font-bold">New Attribute</h3>
              <button onClick={() => setShowAttrModal(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form onSubmit={handleCreateAttr} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label><input required type="text" value={attrForm.name} onChange={(e) => setAttrForm({ ...attrForm, name: e.target.value })} className="input-luxury" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label><Select value={attrForm.type} onChange={(e) => setAttrForm({ ...attrForm, type: e.target.value })}>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Display Type</label><Select value={attrForm.displayType} onChange={(e) => setAttrForm({ ...attrForm, displayType: e.target.value })}>{DISPLAY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Group</label><Select value={attrForm.group} onChange={(e) => setAttrForm({ ...attrForm, group: e.target.value })}>{GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}</Select></div>
              <div className="flex gap-5">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={attrForm.isFilterable} onChange={(e) => setAttrForm({ ...attrForm, isFilterable: e.target.checked })} className="accent-primary" /><span className="text-sm">Filterable</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={attrForm.isVariant} onChange={(e) => setAttrForm({ ...attrForm, isVariant: e.target.checked })} className="accent-primary" /><span className="text-sm">Is Variant</span></label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAttrModal(false)} className="btn-outline flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Saving...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Value Modal */}
      {showValueModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowValueModal(false)}>
          <div className="bg-white rounded-2xl shadow-luxury-lg w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-heading text-lg font-bold">{editValue ? 'Edit Value' : 'Add Value'}</h3>
              <button onClick={() => setShowValueModal(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form onSubmit={handleSaveValue} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Value *</label><input required type="text" value={valueForm.value} onChange={(e) => setValueForm({ ...valueForm, value: e.target.value })} className="input-luxury" /></div>
              {selected?.displayType === 'swatch' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Color Code</label>
                  <div className="flex gap-3">
                    <input type="color" value={valueForm.colorCode || '#000000'} onChange={(e) => setValueForm({ ...valueForm, colorCode: e.target.value })} className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                    <input type="text" value={valueForm.colorCode} onChange={(e) => setValueForm({ ...valueForm, colorCode: e.target.value })} placeholder="#000000" className="input-luxury flex-1" />
                  </div>
                </div>
              )}
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Sort Order</label><input type="number" value={valueForm.sortOrder} onChange={(e) => setValueForm({ ...valueForm, sortOrder: e.target.value })} className="input-luxury" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowValueModal(false)} className="btn-outline flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
