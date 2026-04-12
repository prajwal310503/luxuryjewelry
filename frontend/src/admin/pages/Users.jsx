import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import Pagination from '../components/Pagination';
import Select from '../../components/ui/Select';

const ROLE_BADGE = {
  admin:    'badge bg-purple-100 text-purple-700',
  vendor:   'badge bg-blue-100 text-blue-700',
  customer: 'badge bg-gray-100 text-gray-600',
};

const IcEdit = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);
const IcCheck = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const IcX = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

function IconBtn({ onClick, title, color = 'gray', children }) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600 hover:bg-blue-100',
    green:  'bg-green-50 text-green-600 hover:bg-green-100',
    red:    'bg-red-50 text-red-500 hover:bg-red-100',
    gray:   'bg-gray-50 text-gray-500 hover:bg-gray-100',
    purple: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
  };
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${colors[color]}`}
    >
      {children}
    </button>
  );
}

export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const roleFilter = searchParams.get('role') || '';
  const search     = searchParams.get('search') || '';
  const page       = parseInt(searchParams.get('page') || '1');

  const [users, setUsers]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(null);   // { id, role }
  const [saving, setSaving]     = useState(false);

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

  const handleRoleChange = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await adminAPI.changeUserRole(editing.id, editing.role);
      toast.success('Role updated');
      setEditing(null);
      fetchUsers();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await adminAPI.toggleUser(id);
      toast.success('Status updated');
      fetchUsers();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const setPage = (p) => setSearchParams({ role: roleFilter, search, page: p });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} total users</p>
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
          compact
          className="w-44"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="vendor">Vendor</option>
          <option value="customer">Customer</option>
        </Select>
      </div>

      {/* Table */}
      <div className="card-luxury overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['User', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Change Role', 'Active'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="shimmer-circle w-9 h-9 flex-shrink-0" />
                        <div className="shimmer-text h-3.5 w-28 rounded" />
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="shimmer-text h-3 w-36 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer-text h-3 w-24 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer-loading h-5 w-16 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="shimmer-loading h-5 w-14 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="shimmer-text h-3 w-20 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer-loading w-32 h-8 rounded-lg" /></td>
                    <td className="px-5 py-4"><div className="shimmer-loading w-8 h-8 rounded-lg" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center text-gray-400 text-sm">No users found</td>
                </tr>
              ) : (
                users.map((u) => {
                  const isEditing = editing?.id === u._id;
                  return (
                    <tr key={u._id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Name + avatar */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-semibold"
                            style={{ background: 'linear-gradient(135deg,#5a413f,#8a6a67)' }}
                          >
                            {u.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="text-sm font-medium text-gray-800 whitespace-nowrap">{u.name}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-4 text-sm text-gray-500">{u.email}</td>

                      {/* Phone */}
                      <td className="px-5 py-4 text-sm text-gray-400">{u.phone || '—'}</td>

                      {/* Role badge */}
                      <td className="px-5 py-4">
                        <span className={ROLE_BADGE[u.role] || ROLE_BADGE.customer}>{u.role}</span>
                      </td>

                      {/* Active status */}
                      <td className="px-5 py-4">
                        <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Change role inline */}
                      <td className="px-5 py-4">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <Select
                              value={editing.role}
                              onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                              compact
                              className="w-28"
                            >
                              <option value="admin">Admin</option>
                              <option value="vendor">Vendor</option>
                              <option value="customer">Customer</option>
                            </Select>
                            <IconBtn onClick={handleRoleChange} title="Save" color="green">
                              {saving ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                              ) : <IcCheck />}
                            </IconBtn>
                            <IconBtn onClick={() => setEditing(null)} title="Cancel" color="gray">
                              <IcX />
                            </IconBtn>
                          </div>
                        ) : (
                          <IconBtn
                            onClick={() => setEditing({ id: u._id, role: u.role })}
                            title="Change role"
                            color="purple"
                          >
                            <IcEdit />
                          </IconBtn>
                        )}
                      </td>

                      {/* Toggle active */}
                      <td className="px-5 py-4">
                        <IconBtn
                          onClick={() => handleToggleStatus(u._id)}
                          title={u.isActive ? 'Deactivate' : 'Activate'}
                          color={u.isActive ? 'red' : 'green'}
                        >
                          {u.isActive ? <IcX /> : <IcCheck />}
                        </IconBtn>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} setPage={setPage} />
    </div>
  );
}
