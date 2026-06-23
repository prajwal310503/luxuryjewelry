import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function QuoteSuccessPage() {
  return (
    <>
      <Helmet><title>Quote Submitted | LUXURY JEWELRY</title></Helmet>
      <div className="container-luxury py-24 text-center">

        {/* Animated icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'linear-gradient(135deg,#fef3c7,#fde68a)' }}
        >
          <svg className="w-12 h-12 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="font-heading text-4xl font-bold text-gray-900 mb-3">Quote Requested!</h1>
          <p className="text-gray-500 mb-2 text-lg">Your request has been submitted successfully.</p>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-4 leading-relaxed">
            Our team will review your items and get back to you with the best price.
            Once we confirm your quote, you can proceed to payment.
          </p>

          {/* Status steps */}
          <div className="flex items-center justify-center gap-2 mb-8 mt-6">
            {[
              { label: 'Quote Submitted', done: true },
              { label: 'Admin Review',    done: false },
              { label: 'Quote Confirmed', done: false },
              { label: 'Payment',         done: false },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 text-xs font-medium ${step.done ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-green-500' : 'bg-gray-200'}`}>
                    {step.done ? (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-gray-400 text-[10px] font-bold">{i + 1}</span>
                    )}
                  </div>
                  <span className="hidden sm:block">{step.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className="w-8 h-px bg-gray-200" />
                )}
              </div>
            ))}
          </div>

          {/* Info note */}
          <div className="max-w-sm mx-auto bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 text-sm text-amber-800 text-left flex gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No payment required now. We'll contact you once your quote is confirmed and ready for payment.</p>
          </div>

          <div className="flex gap-4 justify-center">
            <Link to="/my-quotes" className="btn-primary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Track My Quote
            </Link>
            <Link to="/collections" className="btn-outline">Continue Shopping</Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
