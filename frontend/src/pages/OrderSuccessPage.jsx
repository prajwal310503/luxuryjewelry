import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { orderAPI } from '../services/api';

export default function OrderSuccessPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    orderAPI.getById(id).then(({ data }) => setOrder(data.data)).catch(() => {});
  }, [id]);

  return (
    <>
      <Helmet><title>Order Confirmed | VK Jewellers</title></Helmet>
      <div className="container-luxury py-20 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }} className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
        <h1 className="font-heading text-4xl font-bold text-gray-900 mb-3">Order Confirmed!</h1>
        {order && <p className="text-gray-500 mb-2">Order #{order.orderNumber}</p>}
        <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto">Thank you for your purchase. You'll receive a confirmation email shortly.</p>
        <div className="flex gap-4 justify-center">
          <Link to="/orders" className="btn-primary">Track Order</Link>
          <Link to="/collections" className="btn-outline">Continue Shopping</Link>
        </div>
      </div>
    </>
  );
}
