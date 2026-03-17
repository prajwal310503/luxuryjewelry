import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';

export default function AdminCustomers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getUsers({ page, limit: 20, role: 'customer', search });
      setUsers(data.data || []);
      setMeta(data.meta || {});
    } catch (_) {} finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleToggle = async (id) => {
    try {
      await adminAPI.toggleUser(id);
      toast.success('Updated');
      fetch();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="space-y-5">
      <h1 className="font-heading text-2xl font-bold text-gray-900">Customers</h1>
      <div className="card-luxury p-4">
        <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearchParams({ search: e.target.value, page: 1 })} className="input-luxury h-10 py-2 max-w-sm" />
      </div>
      <div className="card-luxury overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>{['Customer','Phone','Orders','Verified','Status','Joined','Actions'].map((h) => <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array.from({length:8}).map((_,i) => <tr key={i}>{Array.from({length:7}).map((_,j) => <td key={j} className="px-5 py-4"><div className="h-4 shimmer-loading rounded" /></td>)}</tr>)
              : users.length === 0 ? <tr><td colSpan={7} className="text-center py-10 text-gray-300">No customers</td></tr>
              : users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{user.name?.[0]}</div>
                      <div><p className="text-sm font-medium text-gray-800">{user.name}</p><p className="text-xs text-gray-400">{user.email}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{user.phone || '—'}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{user.addresses?.length || 0} addresses</td>
                  <td className="px-5 py-4"><span className={`badge text-xs ${user.isEmailVerified ? 'badge-success' : 'badge-warning'}`}>{user.isEmailVerified ? 'Verified' : 'Unverified'}</span></td>
                  <td className="px-5 py-4"><span className={`badge text-xs ${user.isActive ? 'badge-success' : 'badge-danger'}`}>{user.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td className="px-5 py-4 text-xs text-gray-400">{new Date(user.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="px-5 py-4">
                    <button onClick={() => handleToggle(user._id)} className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${user.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
