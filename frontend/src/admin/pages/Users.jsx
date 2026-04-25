import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import Pagination from '../components/Pagination';
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
  return perms.map((k) => ALL_PERMISSIONS.find((p) => p.key === k)?.label || k).join(' + ');
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ on, onChange, loading }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={loading}
      className={`relative w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 ${
        on ? 'bg-primary' : 'bg-gray-200'
      } ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
          on ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

const IcPlus = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);
const IcX = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const IcCheck = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const IcEdit = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

// ── Inline Permission Toggles ─────────────────────────────────────────────────
function PermissionToggles({ user, onUpdated }) {
  const [perms, setPerms]       = useState(user.permissions || []);
  const [saving, setSaving]     = useState(null); // key of perm being saved

  const toggle = async (key) => {
    const next = perms.includes(key) ? perms.filter((k) => k !== key) : [...perms, key];
    setSaving(key);
    try {
      await adminAPI.updateUserPermissions(user._id, next);
      setPerms(next);
      onUpdated(user._id, next);
    } catch {
      toast.error('Failed to update permission');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Access Permissions</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2.5">
        {ALL_PERMISSIONS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-600 font-medium">{label}</span>
            <Toggle
              on={perms.includes(key)}
              onChange={() => toggle(key)}
              loading={saving === key}
            />
          </div>
        ))}
      </div>
      {perms.length > 0 && (
        <p className="text-[10px] text-primary font-semibold mt-2.5">
          Access: {permSummary(perms)}
        </p>
      )}
    </div>
  );
}

// ── Create User Modal ─────────────────────────────────────────────────────────
function CreateUserModal({ onClose, onCreated }) {
  const [form, setForm]   = useState({ name: '', email: '', password: '', phone: '', role: 'retailer', permissions: [] });
  const [saving, setSaving] = useState(false);

  const togglePerm = (key) =>
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key) ? f.permissions.filter((k) => k !== key) : [...f.permissions, key],
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminAPI.createUser(form);
      toast.success('User created');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-lg font-bold text-gray-900">Create User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><IcX /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label-luxury mb-1">Full Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                required placeholder="Full name" className="input-luxury w-full h-10 px-3 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="label-luxury mb-1">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                required placeholder="email@example.com" className="input-luxury w-full h-10 px-3 text-sm" />
            </div>
            <div>
              <label className="label-luxury mb-1">Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                required minLength={6} placeholder="Min. 6 chars" className="input-luxury w-full h-10 px-3 text-sm" />
            </div>
            <div>
              <label className="label-luxury mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Optional" className="input-luxury w-full h-10 px-3 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="label-luxury mb-1">Role</label>
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value, permissions: [] })} compact className="w-full">
                <option value="retailer">Retailer — can browse &amp; request quotes</option>
                <option value="child_admin">Staff (Child Admin) — limited admin access</option>
                <option value="admin">Admin — full access</option>
              </Select>
            </div>
          </div>

          {form.role === 'child_admin' && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 mb-3 uppercase tracking-wider">Set Access Permissions</p>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                {ALL_PERMISSIONS.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{label}</span>
                    <Toggle on={form.permissions.includes(key)} onChange={() => togglePerm(key)} />
                  </div>
                ))}
              </div>
              {form.permissions.length > 0 && (
                <p className="text-xs text-blue-600 font-semibold mt-3">Access: {permSummary(form.permissions)}</p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-outline flex-1 h-10 text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 h-10 text-sm flex items-center justify-center gap-2">
              {saving ? <Spinner /> : null}
              {saving ? 'Creating…' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── User Card ─────────────────────────────────────────────────────────────────
function UserCard({ user: initialUser, onRefresh }) {
  const [user, setUser]         = useState(initialUser);
  const [editingRole, setEditingRole] = useState(false);
  const [newRole, setNewRole]   = useState(user.role);
  const [savingRole, setSavingRole] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [showPerms, setShowPerms] = useState(false);

  useEffect(() => { setUser(initialUser); }, [initialUser]);

  const ROLE_CONFIG = {
    admin:       { label: 'Admin',    bg: 'bg-purple-100', text: 'text-purple-700' },
    child_admin: { label: 'Staff',    bg: 'bg-blue-100',   text: 'text-blue-700' },
    retailer:    { label: 'Retailer', bg: 'bg-amber-100',  text: 'text-amber-700' },
  };
  const rc = ROLE_CONFIG[user.role] || ROLE_CONFIG.retailer;

  const saveRole = async () => {
    setSavingRole(true);
    try {
      await adminAPI.changeUserRole(user._id, newRole);
      toast.success('Role updated');
      setEditingRole(false);
      onRefresh();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update role');
    } finally {
      setSavingRole(false);
    }
  };

  const toggleStatus = async () => {
    setTogglingStatus(true);
    try {
      await adminAPI.toggleUser(user._id);
      setUser((u) => ({ ...u, isActive: !u.isActive }));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    } finally {
      setTogglingStatus(false);
    }
  };

  const handlePermUpdated = (id, newPerms) => {
    setUser((u) => ({ ...u, permissions: newPerms }));
  };

  return (
    <div className="card-luxury p-5">
      <div className="flex items-start gap-4 flex-wrap">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm"
          style={{ background: 'linear-gradient(135deg,#5a413f,#8a6a67)' }}
        >
          {user.name?.[0]?.toUpperCase() || '?'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm">{user.name}</p>

            {/* Role badge */}
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${rc.bg} ${rc.text}`}>
              {rc.label}
            </span>

            {/* Permission summary for child_admin */}
            {user.role === 'child_admin' && (
              <span className="text-[11px] text-blue-600 font-medium">
                · {permSummary(user.permissions)}
              </span>
            )}

            {/* Active dot */}
            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-[11px] text-gray-400">{user.isActive ? 'Active' : 'Inactive'}</span>
          </div>

          <p className="text-xs text-gray-400 mt-0.5">
            {user.email}
            {user.phone && <span className="ml-3">{user.phone}</span>}
            <span className="ml-3">Joined {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </p>

          {/* Permission toggles — always visible for child_admin */}
          {user.role === 'child_admin' && (
            <PermissionToggles user={user} onUpdated={handlePermUpdated} />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Change role */}
          {editingRole ? (
            <div className="flex items-center gap-1.5">
              <Select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                compact
                className="w-36 text-xs"
              >
                <option value="retailer">Retailer</option>
                <option value="child_admin">Staff (Child Admin)</option>
                <option value="admin">Admin</option>
              </Select>
              <button
                onClick={saveRole}
                disabled={savingRole}
                className="w-7 h-7 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors"
              >
                {savingRole ? <Spinner /> : <IcCheck />}
              </button>
              <button
                onClick={() => { setEditingRole(false); setNewRole(user.role); }}
                className="w-7 h-7 rounded-lg bg-gray-50 text-gray-400 hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <IcX />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingRole(true)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary border border-gray-200 hover:border-primary/40 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <IcEdit /> Change Role
            </button>
          )}

          {/* Active toggle */}
          <div className="flex items-center gap-1.5 ml-1">
            <span className="text-[11px] text-gray-400">{user.isActive ? 'Active' : 'Inactive'}</span>
            <Toggle on={user.isActive} onChange={toggleStatus} loading={togglingStatus} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const roleFilter = searchParams.get('role') || '';
  const search     = searchParams.get('search') || '';
  const page       = parseInt(searchParams.get('page') || '1');

  const [users, setUsers]           = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const LIMIT = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ role: roleFilter, search, page, limit: LIMIT });
      setUsers(res.data.data);
      setTotal(res.data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      {showCreate && (
        <CreateUserModal onClose={() => setShowCreate(false)} onCreated={fetchUsers} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Users &amp; Roles</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} total users</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
          <IcPlus /> Create User
        </button>
      </div>

      {/* Role legend */}
      <div className="card-luxury p-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Role Guide</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-start gap-2.5 p-3 bg-purple-50 rounded-xl">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex-shrink-0">Admin</span>
            <p className="text-xs text-gray-500 leading-relaxed">Full access to all features — products, orders, users, settings</p>
          </div>
          <div className="flex items-start gap-2.5 p-3 bg-blue-50 rounded-xl">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex-shrink-0">Staff</span>
            <p className="text-xs text-gray-500 leading-relaxed">Limited access — toggle individual permissions below each staff user</p>
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
        <Select
          value={roleFilter}
          onChange={(e) => setSearchParams({ role: e.target.value, search, page: 1 })}
          compact className="w-44"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="child_admin">Staff (Child Admin)</option>
          <option value="retailer">Retailer</option>
        </Select>
      </div>

      {/* User cards */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card-luxury p-5">
              <div className="flex items-center gap-4">
                <div className="shimmer-circle w-10 h-10 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="shimmer-text h-4 w-40 rounded" />
                  <div className="shimmer-text h-3 w-56 rounded" />
                </div>
              </div>
            </div>
          ))
        ) : users.length === 0 ? (
          <div className="card-luxury p-16 text-center text-gray-400 text-sm">No users found</div>
        ) : (
          users.map((u) => (
            <UserCard key={u._id} user={u} onRefresh={fetchUsers} />
          ))
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT}
        setPage={(p) => setSearchParams({ role: roleFilter, search, page: p })} />
    </div>
  );
}
