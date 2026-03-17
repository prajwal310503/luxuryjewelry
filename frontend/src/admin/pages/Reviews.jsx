import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('false');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getReviews({ approved: filter, limit: 20 });
      setReviews(data.data || []);
    } catch (_) {} finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleStatus = async (id, isApproved) => {
    try {
      await adminAPI.updateReviewStatus(id, { isApproved });
      toast.success(`Review ${isApproved ? 'approved' : 'rejected'}`);
      fetch();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Reviews</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-luxury h-10 py-2 w-44">
          <option value="false">Pending</option>
          <option value="true">Approved</option>
          <option value="">All</option>
        </select>
      </div>
      <div className="card-luxury overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>{['Product','Customer','Rating','Review','Verified','Actions'].map((h) => <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array.from({length:6}).map((_,i) => <tr key={i}>{Array.from({length:6}).map((_,j) => <td key={j} className="px-5 py-4"><div className="h-4 shimmer-loading rounded" /></td>)}</tr>)
              : reviews.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-gray-300">No reviews</td></tr>
              : reviews.map((review) => (
                <tr key={review._id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {review.product?.images?.[0]?.url && <img src={review.product.images[0].url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                      <p className="text-xs font-medium text-gray-800 max-w-32 truncate">{review.product?.title}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-700">{review.user?.name}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map((s) => <svg key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-600 max-w-xs">
                    {review.title && <p className="font-medium text-gray-800 mb-0.5">{review.title}</p>}
                    <p className="line-clamp-2">{review.comment}</p>
                  </td>
                  <td className="px-5 py-4"><span className={`badge text-xs ${review.isVerifiedPurchase ? 'badge-success' : 'bg-gray-100 text-gray-400'}`}>{review.isVerifiedPurchase ? 'Verified' : 'Unverified'}</span></td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      {!review.isApproved && <button onClick={() => handleStatus(review._id, true)} className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200">Approve</button>}
                      {review.isApproved && <button onClick={() => handleStatus(review._id, false)} className="text-xs px-2.5 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200">Reject</button>}
                    </div>
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
