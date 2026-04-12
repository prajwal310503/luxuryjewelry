import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import Pagination from '../components/Pagination';

const IcBan  = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>;
const IcPlay = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const IconBtn = ({ onClick, disabled, title, color, children }) => (
  <button onClick={onClick} disabled={disabled} title={title}
    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${color}`}>
    {children}
  </button>
);

export default function AdminCustomers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getUsers({ page, limit: 20, role: 'customer', search });
      setUsers(data.data || []);
      setMeta(data.meta || {});
    } catch (_) {} finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggle = async (id) => {
    try {
      await adminAPI.toggleUser(id);
      toast.success('Updated');
      fetchUsers();
    } catch (err) { toast.error(err.message); }
  };

  const setPage = (p) => setSearchParams({ search, page: p });

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-bold text-gray-900">Customers</h1>

      <div className="card-luxury p-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearchParams({ search: e.target.value, page: 1 })}
          className="input-luxury h-10 py-2 max-w-sm"
        />
      </div>

      <div className="card-luxury overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Customer', 'Phone', 'Addresses', 'Verified', 'Status', 'Joined', 'Actions'].map((h) => (
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
                        <div className="w-9 h-9 shimmer-circle flex-shrink-0" />
                        <div className="space-y-2">
                          <div className="shimmer-text h-3.5 w-28 rounded" />
                          <div className="shimmer-text h-2.5 w-36 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-24 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-8 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer-loading h-5 w-16 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="shimmer-loading h-5 w-14 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-20 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer-loading w-8 h-8 rounded-lg" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-300">No customers found</td></tr>
              ) : users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        {user.name?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{user.phone || '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{user.addresses?.length || 0}</td>
                  <td className="px-5 py-4">
                    <span className={`badge text-xs ${user.isEmailVerified ? 'badge-success' : 'badge-warning'}`}>
                      {user.isEmailVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge text-xs ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-400">{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-5 py-4">
                    <IconBtn
                      onClick={() => handleToggle(user._id)}
                      title={user.isActive ? 'Deactivate' : 'Activate'}
                      color={user.isActive ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}
                    >
                      {user.isActive ? <IcBan /> : <IcPlay />}
                    </IconBtn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} pages={meta.pages} total={meta.total} shown={users.length} onPage={setPage} />
      </div>
    </div>
  );
}
