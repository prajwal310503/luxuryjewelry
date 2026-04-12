import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import Pagination from '../components/Pagination';
import Select from '../../components/ui/Select';

const IcCheck = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const IcX     = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;

const IconBtn = ({ onClick, disabled, title, color, children }) => (
  <button onClick={onClick} disabled={disabled} title={title}
    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors disabled:opacity-40 ${color}`}>
    {children}
  </button>
);

const Stars = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <svg key={s} className={`w-3 h-3 ${s <= rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

export default function AdminReviews() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);

  const filter = searchParams.get('approved') ?? 'false';
  const page = parseInt(searchParams.get('page')) || 1;

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getReviews({ approved: filter, limit: 20, page });
      setReviews(data.data || []);
      setMeta(data.meta || {});
    } catch (_) {} finally { setLoading(false); }
  }, [filter, page]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleStatus = async (id, isApproved) => {
    try {
      await adminAPI.updateReviewStatus(id, { isApproved });
      toast.success(`Review ${isApproved ? 'approved' : 'rejected'}`);
      fetchReviews();
    } catch (err) { toast.error(err.message); }
  };

  const setPage = (p) => setSearchParams({ approved: filter, page: p });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Reviews</h1>
        <Select
          value={filter}
          onChange={(e) => setSearchParams({ approved: e.target.value, page: 1 })}
          compact
          className="w-44"
        >
          <option value="false">Pending</option>
          <option value="true">Approved</option>
          <option value="">All</option>
        </Select>
      </div>

      <div className="card-luxury overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Product', 'Customer', 'Rating', 'Review', 'Verified', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg shimmer-img flex-shrink-0" />
                        <div className="shimmer-text h-3 w-24 rounded" />
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="shimmer-text h-3.5 w-24 rounded" /></td>
                    <td className="px-5 py-4"><div className="shimmer-loading h-3 w-16 rounded" /></td>
                    <td className="px-5 py-4">
                      <div className="space-y-2">
                        <div className="shimmer-text h-3 w-32 rounded" />
                        <div className="shimmer-text h-3 w-48 rounded" />
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="shimmer-loading h-5 w-16 rounded-full" /></td>
                    <td className="px-5 py-4"><div className="shimmer-loading w-8 h-8 rounded-lg" /></td>
                  </tr>
                ))
              ) : reviews.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-300">No reviews found</td></tr>
              ) : reviews.map((review) => (
                <tr key={review._id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {review.product?.images?.[0]?.url && (
                        <img src={review.product.images[0].url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <p className="text-xs font-medium text-gray-800 max-w-32 truncate">{review.product?.title}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-700">{review.user?.name}</td>
                  <td className="px-5 py-4"><Stars rating={review.rating} /></td>
                  <td className="px-5 py-4 text-xs text-gray-600 max-w-xs">
                    {review.title && <p className="font-medium text-gray-800 mb-0.5">{review.title}</p>}
                    <p className="line-clamp-2">{review.comment}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge text-xs ${review.isVerifiedPurchase ? 'badge-success' : 'bg-gray-100 text-gray-400'}`}>
                      {review.isVerifiedPurchase ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {!review.isApproved && (
                        <IconBtn onClick={() => handleStatus(review._id, true)} title="Approve" color="bg-green-50 text-green-600 hover:bg-green-100">
                          <IcCheck />
                        </IconBtn>
                      )}
                      {review.isApproved && (
                        <IconBtn onClick={() => handleStatus(review._id, false)} title="Reject" color="bg-red-50 text-red-500 hover:bg-red-100">
                          <IcX />
                        </IconBtn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={page} pages={meta.pages} total={meta.total} shown={reviews.length} onPage={setPage} />
      </div>
    </div>
  );
}
