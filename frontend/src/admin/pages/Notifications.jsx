import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import Select from '../../components/ui/Select';

export default function AdminNotifications() {
  const [form, setForm] = useState({
    title: '',
    message: '',
    link: '/',
    audience: 'customers',
    emailAlso: false,
  });
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getNotifications({ page: 1, limit: 20 });
      setHistory(data.data?.items || []);
    } catch {
      toast.error('Failed to load notification history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    setSending(true);
    try {
      const { data } = await adminAPI.sendNotification(form);
      toast.success(`Sent to ${data.data?.sentCount || 0} browser(s)`);
      setForm((f) => ({ ...f, title: '', message: '' }));
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">Browser Notifications</h1>
        <p className="text-sm text-gray-500 mt-1">
          Push alerts to users who allowed browser notifications. Optionally also email them.
        </p>
      </div>

      <form onSubmit={handleSend} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Title</label>
          <input
            className="mt-1.5 w-full h-11 px-3 rounded-xl border border-gray-200 text-sm"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="New collection is live"
            maxLength={120}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Message</label>
          <textarea
            className="mt-1.5 w-full min-h-[110px] px-3 py-2.5 rounded-xl border border-gray-200 text-sm"
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Short message users will see in their browser..."
            maxLength={500}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Link</label>
            <input
              className="mt-1.5 w-full h-11 px-3 rounded-xl border border-gray-200 text-sm"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="/"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Audience</label>
            <Select
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
              compact
              className="mt-1.5 w-full"
            >
              <option value="customers">Customers</option>
              <option value="vendors">Vendors</option>
              <option value="staff">Staff</option>
              <option value="all">Everyone</option>
            </Select>
          </div>
        </div>
        <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.emailAlso}
            onChange={(e) => setForm({ ...form, emailAlso: e.target.checked })}
            className="rounded border-gray-300"
          />
          Also send as email
        </label>
        <button
          type="submit"
          disabled={sending}
          className="h-11 px-6 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-60"
        >
          {sending ? 'Sending…' : 'Send Notification'}
        </button>
      </form>

      <div>
        <h2 className="text-sm font-bold text-gray-800 mb-3">Recent sends</h2>
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-400">No notifications sent yet.</p>
        ) : (
          <ul className="space-y-2">
            {history.map((n) => (
              <li key={n._id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm">
                <div className="flex justify-between gap-3">
                  <p className="font-semibold text-gray-900">{n.title}</p>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-600 mt-1 line-clamp-2">{n.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {n.audience} · {n.sentCount} push · {n.emailAlso ? 'email on' : 'push only'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
