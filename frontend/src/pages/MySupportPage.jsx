import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { supportAPI } from '../services/api';
import {
  IconBox, IconGem, IconCard, IconTruck, IconRefresh, IconChat, IconDocument, IconWarning,
} from '../components/ui/Icons';

const REASONS = [
  { value: 'order-review',    label: 'Order Review',      Icon: IconBox },
  { value: 'product-inquiry', label: 'Product Inquiry',   Icon: IconGem },
  { value: 'payment-issue',   label: 'Payment Issue',     Icon: IconCard },
  { value: 'shipping',        label: 'Shipping',          Icon: IconTruck },
  { value: 'return-exchange', label: 'Return / Exchange', Icon: IconRefresh },
  { value: 'general',         label: 'General Query',     Icon: IconChat },
  { value: 'other',           label: 'Other',             Icon: IconDocument },
];

const STATUS_STYLES = {
  open:        'bg-blue-50 text-blue-700 border-blue-200',
  'in-progress': 'bg-amber-50 text-amber-700 border-amber-200',
  resolved:    'bg-green-50 text-green-700 border-green-200',
  closed:      'bg-gray-100 text-gray-500 border-gray-200',
};

export default function MySupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const fileRef = useRef();

  const [form, setForm] = useState({ subject: '', body: '', reason: 'general', image: null });

  const load = async () => {
    try {
      const { data } = await supportAPI.getMyTickets();
      const list = data.data || [];
      setTickets(list);
      if (activeTicket) {
        const updated = list.find((t) => t._id === activeTicket._id);
        if (updated) setActiveTicket(updated);
      }
    } catch { toast.error('Failed to load tickets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.body.trim()) return toast.error('Subject and message are required');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('subject', form.subject);
      fd.append('body', form.body);
      fd.append('reason', form.reason);
      if (form.image) fd.append('image', form.image);
      await supportAPI.create(fd);
      toast.success('Support request submitted!');
      setForm({ subject: '', body: '', reason: 'general', image: null });
      setShowForm(false);
      load();
    } catch { toast.error('Failed to submit request'); }
    finally { setSubmitting(false); }
  };

  const handleReply = async (ticketId) => {
    if (!replyText.trim()) return toast.error('Please type a reply');
    setReplying(true);
    try {
      const { data } = await supportAPI.reply(ticketId, { message: replyText.trim() });
      const updated = data.data;
      setTickets((prev) => prev.map((t) => (t._id === ticketId ? updated : t)));
      setActiveTicket(updated);
      setReplyText('');
      toast.success('Reply sent');
    } catch (err) {
      toast.error(err.message || 'Failed to send reply');
    } finally {
      setReplying(false);
    }
  };

  const openTicket = (t) => {
    const next = activeTicket?._id === t._id ? null : t;
    setActiveTicket(next);
    setReplyText('');
  };

  return (
    <>
      <Helmet><title>Support | LUXURY JEWELRY</title></Helmet>

      <div className="container-luxury py-10 max-w-3xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          <span className="text-gray-700 font-medium">Support</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-2xl font-semibold text-gray-900">Support Requests</h1>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-4 py-2">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              New Request
            </button>
          )}
        </div>

        {/* New request form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="card-luxury p-6 mb-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-heading text-lg font-semibold">New Support Request</h2>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label-luxury">Reason *</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {REASONS.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setForm({ ...form, reason: r.value })}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all ${
                          form.reason === r.value
                            ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-primary/40 hover:text-primary'
                        }`}
                      >
                        <r.Icon className="w-4 h-4" />
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label-luxury">Subject *</label>
                  <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Brief description of your issue" className="input-luxury" />
                </div>
                <div>
                  <label className="label-luxury">Message *</label>
                  <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
                    rows={5} placeholder="Describe your issue in detail..." className="input-luxury resize-none" />
                </div>
                <div>
                  <label className="label-luxury">Attach Image (optional)</label>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary/40 transition-colors"
                  >
                    {form.image ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 truncate">{form.image.name}</span>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setForm({ ...form, image: null }); }}
                          className="text-red-400 hover:text-red-600 text-xs ml-2">Remove</button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Click to attach a screenshot or document</p>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => setForm({ ...form, image: e.target.files[0] || null })} />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1 justify-center">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center disabled:opacity-60">
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ticket list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="card-luxury p-5 animate-pulse h-24" />)}
          </div>
        ) : tickets.length === 0 ? (
          <div className="card-luxury p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            <p className="text-gray-500 mb-4">No support requests yet</p>
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm px-5 py-2.5">Create your first request</button>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <motion.div key={t._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="card-luxury p-5 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openTicket(t)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">{t.subject}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[t.status]}`}>
                        {t.status.replace('-', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{REASONS.find((r) => r.value === t.reason)?.label} &bull; {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    {t.replies?.length > 0 && (
                      <p className="text-xs text-primary mt-1 font-medium">{t.replies.length} {t.replies.length === 1 ? 'reply' : 'replies'}</p>
                    )}
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${activeTicket?._id === t._id ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>

                <AnimatePresence>
                  {activeTicket?._id === t._id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                        {/* Original message */}
                        <div className="bg-luxury-cream rounded-xl p-4">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Your Message</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{t.body}</p>
                          {t.image && (
                            <a href={t.image} target="_blank" rel="noreferrer" className="mt-2 block">
                              <img src={t.image} alt="attachment" className="max-h-40 rounded-lg border border-gray-200 object-contain" />
                            </a>
                          )}
                        </div>

                        {/* Replies */}
                        {t.replies?.map((r, i) => (
                          <div key={i} className={`rounded-xl p-4 ${r.by === 'admin' ? 'bg-primary/5 border border-primary/10' : 'bg-luxury-cream'}`}>
                            <p className={`text-xs font-semibold mb-1 ${r.by === 'admin' ? 'text-primary' : 'text-gray-500'}`}>
                              {r.by === 'admin' ? 'LUXURY JEWELRY Support' : 'You'} &bull; {new Date(r.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.message}</p>
                          </div>
                        ))}

                        {/* Customer reply form */}
                        {t.status !== 'closed' && (
                          <div
                            className="pt-2 space-y-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <textarea
                              value={activeTicket?._id === t._id ? replyText : ''}
                              onChange={(e) => setReplyText(e.target.value)}
                              rows={3}
                              placeholder="Write a reply…"
                              className="input-luxury resize-none text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => handleReply(t._id)}
                              disabled={replying || !replyText.trim()}
                              className="btn-primary text-sm px-5 py-2.5 disabled:opacity-60"
                            >
                              {replying ? 'Sending…' : 'Send Reply'}
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
