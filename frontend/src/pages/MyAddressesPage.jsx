import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';

const EMPTY = { fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India' };
const REQUIRED = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode'];

export default function MyAddressesPage() {
  const { user } = useAuthStore();
  const ADDR_KEY = `vk_saved_addresses_${user?._id || 'guest'}`;

  const [addresses, setAddresses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editIdx, setEditIdx] = useState(null); // null = new, number = editing
  const [form, setForm] = useState({ ...EMPTY });
  const [errors, setErrors] = useState({});
  const [deleteIdx, setDeleteIdx] = useState(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(ADDR_KEY) || '[]');
      setAddresses(stored);
    } catch { setAddresses([]); }
  }, []);

  const persist = (updated) => {
    setAddresses(updated);
    localStorage.setItem(ADDR_KEY, JSON.stringify(updated));
  };

  const openAdd = () => {
    setForm({ ...EMPTY });
    setErrors({});
    setEditIdx(null);
    setModalOpen(true);
  };

  const openEdit = (idx) => {
    setForm({ ...addresses[idx] });
    setErrors({});
    setEditIdx(idx);
    setModalOpen(true);
  };

  const validate = () => {
    const errs = {};
    REQUIRED.forEach((f) => { if (!form[f]?.trim()) errs[f] = 'Required'; });
    if (form.phone && !/^\d{10}$/.test(form.phone.trim())) errs.phone = 'Enter 10-digit number';
    if (form.pincode && !/^\d{6}$/.test(form.pincode.trim())) errs.pincode = 'Enter 6-digit pincode';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    let updated;
    if (editIdx === null) {
      // new address goes to front (becomes default)
      updated = [form, ...addresses].slice(0, 4);
    } else {
      updated = addresses.map((a, i) => (i === editIdx ? form : a));
    }
    persist(updated);
    setModalOpen(false);
    toast.success(editIdx === null ? 'Address added' : 'Address updated');
  };

  const handleDelete = (idx) => {
    const updated = addresses.filter((_, i) => i !== idx);
    persist(updated);
    setDeleteIdx(null);
    toast.success('Address removed');
  };

  const setAsDefault = (idx) => {
    if (idx === 0) return;
    const updated = [addresses[idx], ...addresses.filter((_, i) => i !== idx)];
    persist(updated);
    toast.success('Default address updated');
  };

  const set = (f, v) => { setForm((p) => ({ ...p, [f]: v })); if (errors[f]) setErrors((p) => ({ ...p, [f]: '' })); };

  return (
    <>
      <Helmet><title>My Addresses | VK Jewellers</title></Helmet>

      <div className="container-luxury py-10 max-w-2xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          <span className="text-gray-700 font-medium">My Addresses</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading text-2xl font-semibold text-gray-900">My Addresses</h1>
          {addresses.length < 4 && (
            <button onClick={openAdd} className="btn-primary text-sm px-4 py-2">
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
              Add Address
            </button>
          )}
        </div>

        {addresses.length === 0 ? (
          <div className="card-luxury p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <p className="text-gray-500 mb-4">No saved addresses yet</p>
            <button onClick={openAdd} className="btn-primary text-sm px-5 py-2.5">Add your first address</button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`card-luxury p-5 border-2 transition-all ${idx === 0 ? 'border-primary' : 'border-transparent'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-800">{addr.fullName}</p>
                      {idx === 0 && (
                        <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">DEFAULT</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{addr.phone}</p>
                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                      {addr.addressLine1}{addr.addressLine2 && `, ${addr.addressLine2}`}<br />
                      {addr.city}, {addr.state} – {addr.pincode}, {addr.country}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {idx !== 0 && (
                      <button onClick={() => setAsDefault(idx)}
                        className="text-xs text-primary border border-primary/30 rounded-lg px-2.5 py-1.5 hover:bg-primary/5 transition-colors font-medium">
                        Set Default
                      </button>
                    )}
                    <button onClick={() => openEdit(idx)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:border-primary hover:text-primary transition-colors text-gray-500">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                    <button onClick={() => setDeleteIdx(idx)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:border-red-400 hover:text-red-500 transition-colors text-gray-500">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {addresses.length >= 4 && (
              <p className="text-xs text-gray-400 text-center py-2">Maximum 4 addresses allowed. Delete one to add another.</p>
            )}
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading text-lg font-semibold">{editIdx === null ? 'Add New Address' : 'Edit Address'}</h3>
                <button onClick={() => setModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { f: 'fullName',    label: 'Full Name',              span: 1, req: true },
                  { f: 'phone',       label: 'Phone Number',           span: 1, req: true },
                  { f: 'addressLine1',label: 'Address Line 1',         span: 2, req: true },
                  { f: 'addressLine2',label: 'Address Line 2 (Optional)', span: 2, req: false },
                  { f: 'city',        label: 'City',                   span: 1, req: true },
                  { f: 'state',       label: 'State',                  span: 1, req: true },
                  { f: 'pincode',     label: 'Pincode',                span: 1, req: true },
                  { f: 'country',     label: 'Country',                span: 1, req: false },
                ].map(({ f, label, span, req }) => (
                  <div key={f} className={span === 2 ? 'sm:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {label}{req && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <input
                      type="text"
                      value={form[f]}
                      onChange={(e) => set(f, e.target.value)}
                      placeholder={label}
                      className={`input-luxury ${errors[f] ? 'border-red-400 focus:border-red-500' : ''}`}
                    />
                    {errors[f] && <p className="text-xs text-red-500 mt-1">{errors[f]}</p>}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setModalOpen(false)} className="btn-outline flex-1 justify-center">Cancel</button>
                <button onClick={handleSave} className="btn-primary flex-1 justify-center">
                  {editIdx === null ? 'Save Address' : 'Update Address'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete confirm ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteIdx(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-heading text-lg font-semibold mb-2">Remove Address?</h3>
              <p className="text-sm text-gray-500 mb-6">This address will be permanently removed from your saved addresses.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteIdx(null)} className="btn-outline flex-1 justify-center">Cancel</button>
                <button onClick={() => handleDelete(deleteIdx)}
                  className="flex-1 justify-center flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">
                  Remove
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
