import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { productAPI } from '../services/api';
import ProductCard from '../components/product/ProductCard';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    productAPI.getAll({ search: query, limit: 20 }).then(({ data }) => {
      setProducts(data.data || []);
      setTotal(data.meta?.total || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [query]);

  return (
    <>
      <Helmet><title>Search: {query} | Luxury Jewelry</title></Helmet>
      <div className="container-luxury py-10">
        <h1 className="font-heading text-2xl font-bold mb-2">Search Results for "{query}"</h1>
        <p className="text-gray-400 text-sm mb-8">{total} products found</p>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {Array.from({length: 10}).map((_, i) => <div key={i} className="aspect-square shimmer-loading rounded-xl" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No products found for "{query}"</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </div>
    </>
  );
}
