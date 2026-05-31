import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { supportAPI } from '../../services/api';

const REASONS = {
  'order-review': 'Order Review', 'product-inquiry': 'Product Inquiry',
  'payment-issue': 'Payment Issue', 'shipping': 'Shipping',
  'return-exchange': 'Return / Exchange', 'general': 'General Query', 'other': 'Other',
};
const STATUS_STYLES = {
  open: 'bg-blue-50 text-blue-700 border-blue-200',
  'in-progress': 'bg-amber-50 text-amber-700 border-amber-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
  closed: 'bg-gray-100 text-gray-500 border-gray-200',
};
const STATUSES = ['open', 'in-progress', 'resolved', 'closed'];

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [activeTicket, setActiveTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await supportAPI.adminGetAll({ status: filterStatus || undefined });
      setTickets(data.data || []);
    } catch { toast.error('Failed to load tickets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const openTicket = async (t) => {
    const { data } = await supportAPI.adminGetById(t._id);
    setActiveTicket(data.data);
    setReply('');
    setNewStatus(data.data.status);
  };

  const handleReply = async () => {
    if (!reply.trim() && !newStatus) return;
    setSending(true);
    try {
      const { data } = await supportAPI.adminReply(activeTicket._id, { message: reply, status: newStatus });
      setActiveTicket(data.data);
      setReply('');
      toast.success('Reply sent');
      load();
    } catch { toast.error('Failed to send reply'); }
    finally { setSending(false); }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Support Requests</h1>
        <div className="flex gap-2 flex-wrap">
          {['', ...STATUSES].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${filterStatus === s ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
              {s ? s.replace('-', ' ').toUpperCase() : 'ALL'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket list */}
        <div className="space-y-3">
          {loading ? (
            [1, 2, 3].map((i) => <div key={i} className="card-luxury p-4 animate-pulse h-20" />)
          ) : tickets.length === 0 ? (
            <div className="card-luxury p-10 text-center text-gray-400 text-sm">No tickets found</div>
          ) : tickets.map((t) => (
            <motion.div key={t._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={() => openTicket(t)}
              className={`card-luxury p-4 cursor-pointer hover:shadow-md transition-all ${activeTicket?._id === t._id ? 'ring-2 ring-primary' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{t.subject}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.user?.name} &bull; {t.user?.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{REASONS[t.reason]} &bull; {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${STATUS_STYLES[t.status]}`}>
                  {t.status.replace('-', ' ').toUpperCase()}
                </span>
              </div>
              {t.replies?.length > 0 && (
                <p className="text-xs text-primary mt-2 font-medium">{t.replies.length} {t.replies.length === 1 ? 'reply' : 'replies'}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Ticket detail + reply */}
        <div>
          {!activeTicket ? (
            <div className="card-luxury p-10 text-center text-gray-400 text-sm h-64 flex items-center justify-center">
              Select a ticket to view and reply
            </div>
          ) : (
            <div className="card-luxury p-5 space-y-4 sticky top-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{activeTicket.subject}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{activeTicket.user?.name} &bull; {activeTicket.user?.email} &bull; {activeTicket.user?.phone}</p>
                  <p className="text-xs text-gray-400">{REASONS[activeTicket.reason]} &bull; {new Date(activeTicket.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <button onClick={() => setActiveTicket(null)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                {/* Original */}
                <div className="bg-luxury-cream rounded-xl p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Customer</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{activeTicket.body}</p>
                  {activeTicket.image && (
                    <a href={activeTicket.image} target="_blank" rel="noreferrer">
                      <img src={activeTicket.image} alt="attachment" className="mt-2 max-h-32 rounded-lg border border-gray-200 object-contain" />
                    </a>
                  )}
                </div>
                {/* Replies */}
                {activeTicket.replies?.map((r, i) => (
                  <div key={i} className={`rounded-xl p-3 ${r.by === 'admin' ? 'bg-primary/5 border border-primary/10' : 'bg-luxury-cream'}`}>
                    <p className="text-[10px] font-bold mb-1 text-gray-400 uppercase">{r.by === 'admin' ? 'Admin' : 'Customer'}</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply form */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <textarea value={reply} onChange={(e) => setReply(e.target.value)}
                  rows={3} placeholder="Type your reply..." className="input-luxury resize-none text-sm" />
                <div className="flex gap-3">
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="input-luxury text-sm flex-1">
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace('-', ' ').charAt(0).toUpperCase() + s.replace('-', ' ').slice(1)}</option>)}
                  </select>
                  <button onClick={handleReply} disabled={sending || (!reply.trim() && newStatus === activeTicket.status)}
                    className="btn-primary px-5 text-sm disabled:opacity-60">
                    {sending ? 'Sending...' : 'Send Reply'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
