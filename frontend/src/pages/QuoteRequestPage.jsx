import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { quoteAPI } from '../services/api';

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

const emptyItem = () => ({ productName: '', sku: '', quantity: 1 });

export default function QuoteRequestPage() {
  const navigate = useNavigate();
  const [items, setItems]     = useState([emptyItem()]);
  const [message, setMessage] = useState('');
  const [saving, setSaving]   = useState(false);

  const updateItem = (idx, field, value) =>
    setItems(items.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));

  const addItem = () => setItems([...items, emptyItem()]);

  const removeItem = (idx) =>
    setItems(items.length > 1 ? items.filter((_, i) => i !== idx) : items);

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (const it of items) {
      if (!it.productName.trim()) { toast.error('Product name is required for each item'); return; }
      if (!it.quantity || parseInt(it.quantity) < 1) { toast.error('Quantity must be at least 1'); return; }
    }
    setSaving(true);
    try {
      await quoteAPI.create({
        items: items.map((it) => ({
          productName: it.productName.trim(),
          sku:         it.sku.trim(),
          quantity:    parseInt(it.quantity),
        })),
        message: message.trim(),
      });
      toast.success('Quote request submitted! We will get back to you shortly.');
      navigate('/my-quotes');
    } catch (err) {
      toast.error(err.message || 'Failed to submit quote request');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Heading */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-gray-900">Request a Quote</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            List the products you need with quantities. Our team will review and send you a price quote.
            Once confirmed, your order will be created automatically.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Items */}
          <div className="card-luxury p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Products Required</h2>

            {/* Column headers */}
            <div className="grid grid-cols-12 gap-2 mb-2">
              <span className="col-span-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Product Name</span>
              <span className="col-span-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">SKU / Code</span>
              <span className="col-span-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Quantity</span>
              <span className="col-span-1" />
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="grid grid-cols-12 gap-2 items-center"
                >
                  <input
                    type="text"
                    value={item.productName}
                    onChange={(e) => updateItem(idx, 'productName', e.target.value)}
                    placeholder="e.g. Gold Ring 22K"
                    required
                    className="input-luxury h-10 px-3 text-sm col-span-5"
                  />
                  <input
                    type="text"
                    value={item.sku}
                    onChange={(e) => updateItem(idx, 'sku', e.target.value)}
                    placeholder="Optional"
                    className="input-luxury h-10 px-3 text-sm col-span-3"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                    min={1}
                    required
                    className="input-luxury h-10 px-3 text-sm col-span-3"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    className="col-span-1 w-8 h-8 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-lg transition-colors mx-auto disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="mt-3 text-sm text-primary font-semibold flex items-center gap-2 hover:text-primary/80 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Another Product
            </button>
          </div>

          {/* Message */}
          <div className="card-luxury p-5">
            <h2 className="font-semibold text-gray-900 mb-3">Additional Notes</h2>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Describe any special requirements, preferred materials, delivery timeline, or other details..."
              className="input-luxury w-full px-3 py-2.5 text-sm resize-none"
            />
          </div>

          {/* Info banner */}
          <div className="flex gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-700 leading-relaxed">
              After submission, our team will review your request and send a price quote. Once the quote is confirmed, an order will be automatically created for you.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full h-12 bg-primary hover:bg-primary/90 active:scale-[0.99] text-white font-semibold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm shadow-primary/30"
          >
            {saving ? <Spinner /> : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
            {saving ? 'Submitting…' : 'Submit Quote Request'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
