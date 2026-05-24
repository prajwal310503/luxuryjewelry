import { useState, useEffect, useCallback, Fragment } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import Pagination from '../components/Pagination';
import Tip from '../components/Tip';
import Select from '../../components/ui/Select';

const ALL_PERMISSIONS = [
  { key: 'orders',     label: 'Orders' },
  { key: 'quotes',     label: 'Quotes' },
  { key: 'products',   label: 'Products' },
  { key: 'categories', label: 'Categories' },
  { key: 'blog',       label: 'Blog' },
  { key: 'cms',        label: 'Home Page' },
];

function permSummary(perms) {
  if (!perms?.length) return 'No Access';
  if (perms.length === ALL_PERMISSIONS.length) return 'Full Access';
  return perms.map((k) => ALL_PERMISSIONS.find((p) => p.key === k)?.label || k).join(', ');
}

const ROLE_CFG = {
  admin:       { label: 'Admin',    bg: '#F3E8FF', color: '#7C3AED' },
  child_admin: { label: 'Staff',    bg: '#EFF6FF', color: '#2563EB' },
  retailer:    { label: 'Retailer', bg: '#FFFBEB', color: '#D97706' },
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const IcPlus    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const IcX       = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const IcCheck   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>;
const IcEdit    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const IcTrash   = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const IcBan     = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>;
const IcPlay    = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IcKey     = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>;
const IcSpinner = () => <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>;

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ on, onChange, loading }) {
  return (
    <button type="button" onClick={onChange} disabled={loading}
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${on ? 'bg-primary' : 'bg-gray-200'} ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${on ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

// ── Create User Modal ─────────────────────────────────────────────────────────
function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm]     = useState({ name: '', email: '', password: '', phone: '', role: 'retailer', permissions: [] });
  const [saving, setSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const togglePerm = (key) =>
    setForm((f) => ({ ...f, permissions: f.permissions.includes(key) ? f.permissions.filter((k) => k !== key) : [...f.permissions, key] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.phone && !/^[0-9]{10}$/.test(form.phone)) { toast.error('Phone must be exactly 10 digits'); return; }
    setSaving(true);
    try {
      await adminAPI.createUser(form);
      toast.success('User created');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create user');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-lg font-bold text-gray-900">Create User</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"><IcX /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-luxury mb-1">Full Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Full name" className="input-luxury w-full h-10 px-3 text-sm" />
          </div>
          <div>
            <label className="label-luxury mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="email@example.com" className="input-luxury w-full h-10 px-3 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-luxury mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required minLength={6}
                  placeholder="Min. 6 chars"
                  className="input-luxury w-full h-10 px-3 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="label-luxury mb-1">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="10 digits" className="input-luxury w-full h-10 px-3 text-sm" />
            </div>
          </div>
          <div>
            <label className="label-luxury mb-1">Role</label>
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, permissions: [] })} compact className="w-full">
              <option value="retailer">Retailer — browse &amp; request quotes</option>
              <option value="child_admin">Staff (Child Admin) — limited admin access</option>
              <option value="admin">Admin — full access</option>
            </Select>
          </div>
          {form.role === 'child_admin' && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 mb-3 uppercase tracking-wider">Access Permissions</p>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                {ALL_PERMISSIONS.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{label}</span>
                    <Toggle on={form.permissions.includes(key)} onChange={() => togglePerm(key)} />
                  </div>
                ))}
              </div>
              {form.permissions.length > 0 && <p className="text-xs text-blue-600 font-semibold mt-3">Access: {permSummary(form.permissions)}</p>}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-outline flex-1 h-10 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 h-10 text-sm flex items-center justify-center gap-2">
              {saving ? <IcSpinner /> : null}{saving ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Permission Editor (expandable row content) ─────────────────────────────────
function PermissionEditor({ user, onUpdated }) {
  const [perms, setPerms] = useState(user.permissions || []);
  const [saving, setSaving] = useState(null);

  const toggle = async (key) => {
    const next = perms.includes(key) ? perms.filter((k) => k !== key) : [...perms, key];
    setSaving(key);
    try {
      await adminAPI.updateUserPermissions(user._id, next);
      setPerms(next);
      onUpdated(user._id, next);
    } catch { toast.error('Failed to update permission'); }
    finally { setSaving(null); }
  };

  return (
    <div className="px-5 py-4 bg-blue-50/40 border-t border-blue-100">
      <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-3">Access Permissions for {user.name}</p>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-6 gap-y-3">
        {ALL_PERMISSIONS.map(({ key, label }) => (
          <div key={key} className="flex flex-col items-center gap-1.5">
            <span className="text-[11px] text-gray-500 font-medium">{label}</span>
            <div className="relative">
              {saving === key
                ? <IcSpinner />
                : <Toggle on={perms.includes(key)} onChange={() => toggle(key)} />}
            </div>
          </div>
        ))}
      </div>
      {perms.length > 0 && <p className="text-[11px] text-blue-600 font-semibold mt-3">Access: {permSummary(perms)}</p>}
    </div>
  );
}

// ── Row role-editor (inline select in actions cell) ────────────────────────────
function RoleEditor({ user, onSaved, onCancel }) {
  const [role, setRole]     = useState(user.role);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await adminAPI.changeUserRole(user._id, role);
      toast.success('Role updated');
      onSaved(role);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update role');
    } finally { setSaving(false); }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Select value={role} onChange={(e) => setRole(e.target.value)} compact className="w-36 text-xs">
        <option value="retailer">Retailer</option>
        <option value="child_admin">Staff</option>
        <option value="admin">Admin</option>
      </Select>
      <Tip label="Save">
        <button onClick={save} disabled={saving} className="w-7 h-7 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors disabled:opacity-50">
          {saving ? <IcSpinner /> : <IcCheck />}
        </button>
      </Tip>
      <Tip label="Cancel">
        <button onClick={onCancel} className="w-7 h-7 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors">
          <IcX />
        </button>
      </Tip>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const LIMIT = 20;

export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const roleFilter = searchParams.get('role') || '';
  const search     = searchParams.get('search') || '';
  const page       = parseInt(searchParams.get('page') || '1');

  const [users, setUsers]           = useState([]);
  const [meta, setMeta]             = useState({});
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded]     = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]     = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getUsers({ role: roleFilter, search, page, limit: LIMIT });
      setUsers(data.data || []);
      setMeta(data.meta || {});
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [roleFilter, search, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggle = async (user) => {
    setTogglingId(user._id);
    try {
      await adminAPI.toggleUser(user._id);
      setUsers((us) => us.map((u) => u._id === user._id ? { ...u, isActive: !u.isActive } : u));
    } catch { toast.error('Failed to update status'); }
    finally { setTogglingId(null); }
  };

  const handleRoleSaved = (userId, newRole) => {
    setUsers((us) => us.map((u) => u._id === userId ? { ...u, role: newRole, permissions: newRole !== 'child_admin' ? [] : u.permissions } : u));
    setEditingRole(null);
  };

  const handlePermUpdated = (userId, newPerms) => {
    setUsers((us) => us.map((u) => u._id === userId ? { ...u, permissions: newPerms } : u));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminAPI.deleteUser(deleteTarget._id);
      toast.success('User deleted');
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally { setDeleting(false); }
  };

  const setPage = (p) => setSearchParams({ role: roleFilter, search, page: p });

  return (
    <div className="space-y-5">
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={fetchUsers} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Users &amp; Roles</h1>
          <p className="text-sm text-gray-400 mt-0.5">{meta.total ?? 0} total users</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
          <IcPlus /> Create User
        </button>
      </div>

      {/* Role guide */}
      <div className="card-luxury p-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Role Guide</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-start gap-2.5 p-3 bg-purple-50 rounded-xl">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex-shrink-0">Admin</span>
            <p className="text-xs text-gray-500 leading-relaxed">Full access to all features — products, orders, users, settings</p>
          </div>
          <div className="flex items-start gap-2.5 p-3 bg-blue-50 rounded-xl">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex-shrink-0">Staff</span>
            <p className="text-xs text-gray-500 leading-relaxed">Limited access — expand row to toggle individual permissions</p>
          </div>
          <div className="flex items-start gap-2.5 p-3 bg-amber-50 rounded-xl">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">Retailer</span>
            <p className="text-xs text-gray-500 leading-relaxed">Can browse products, raise quote requests, and receive confirmed orders</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-luxury p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearchParams({ role: roleFilter, search: e.target.value, page: 1 })}
          className="input-luxury flex-1 min-w-48 h-10 py-2"
        />
        <Select value={roleFilter} onChange={(e) => setSearchParams({ role: e.target.value, search, page: 1 })} compact className="w-44">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="child_admin">Staff (Child Admin)</option>
          <option value="retailer">Retailer</option>
        </Select>
      </div>

      {/* Table */}
      <div className="card-luxury overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['User', 'Phone', 'Role', 'Access', 'Status', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 shimmer-circle flex-shrink-0" />
                        <div className="space-y-2">
                          <div className="shimmer-text h-3.5 w-28 rounded" />
                          <div className="shimmer-text h-2.5 w-36 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-24 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer-loading h-5 w-16 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-28 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer-loading h-5 w-14 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-20 rounded" /></td>
                    <td className="px-5 py-4"><div className="flex gap-1.5"><div className="shimmer-loading w-8 h-8 rounded-lg" /><div className="shimmer-loading w-8 h-8 rounded-lg" /><div className="shimmer-loading w-8 h-8 rounded-lg" /></div></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-300">No users found</td></tr>
              ) : users.map((user) => {
                const rc      = ROLE_CFG[user.role] || ROLE_CFG.retailer;
                const isOpen  = expanded === user._id;
                const isEditingRole = editingRole === user._id;

                return (
                  <Fragment key={user._id}>
                    <tr className={`hover:bg-gray-50/50 transition-colors ${isOpen ? 'bg-blue-50/20' : ''}`}>
                      {/* User */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg,#5a413f,#8a6a67)' }}>
                            {user.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{user.name}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-4 text-sm text-gray-600">{user.phone || '—'}</td>

                      {/* Role */}
                      <td className="px-5 py-4">
                        <span className="badge text-xs font-semibold" style={{ backgroundColor: rc.bg, color: rc.color }}>
                          {rc.label}
                        </span>
                      </td>

                      {/* Access */}
                      <td className="px-5 py-4">
                        {user.role === 'child_admin' ? (
                          <button
                            onClick={() => setExpanded(isOpen ? null : user._id)}
                            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <IcKey />
                            <span className="max-w-[140px] truncate">{permSummary(user.permissions)}</span>
                            <svg className={`w-3 h-3 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={`badge text-xs ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-4 text-xs text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString('en-IN')}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        {isEditingRole ? (
                          <RoleEditor
                            user={user}
                            onSaved={(newRole) => handleRoleSaved(user._id, newRole)}
                            onCancel={() => setEditingRole(null)}
                          />
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Tip label="Change Role">
                              <button
                                onClick={() => setEditingRole(user._id)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              >
                                <IcEdit />
                              </button>
                            </Tip>
                            <Tip label={user.isActive ? 'Deactivate' : 'Activate'}>
                              <button
                                onClick={() => handleToggle(user)}
                                disabled={togglingId === user._id}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 ${user.isActive ? 'bg-amber-50 text-amber-500 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                              >
                                {togglingId === user._id ? <IcSpinner /> : user.isActive ? <IcBan /> : <IcPlay />}
                              </button>
                            </Tip>
                            <Tip label="Delete">
                              <button
                                onClick={() => setDeleteTarget(user)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                              >
                                <IcTrash />
                              </button>
                            </Tip>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* Expandable permission editor for Staff */}
                    {isOpen && user.role === 'child_admin' && (
                      <tr>
                        <td colSpan={7} className="p-0">
                          <PermissionEditor user={user} onUpdated={handlePermUpdated} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination page={page} pages={meta.pages} total={meta.total} shown={users.length} onPage={setPage} />
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !deleting && setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-500">
              <IcTrash />
            </div>
            <div className="text-center">
              <h3 className="font-heading text-lg font-bold text-gray-900">Delete User</h3>
              <p className="text-sm text-gray-500 mt-1">
                Permanently delete <span className="font-semibold text-gray-700">{deleteTarget.name}</span>?
                This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="btn-outline flex-1 justify-center">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-60">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
