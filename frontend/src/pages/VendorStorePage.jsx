import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { productAPI } from '../services/api';
import ProductCard from '../components/product/ProductCard';

export default function VendorStorePage() {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productAPI.getAll({ vendor: slug, limit: 20 }).then(({ data }) => setProducts(data.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  return (
    <>
      <Helmet><title>Vendor Store | VK Jewellers</title></Helmet>
      <div className="bg-luxury-gradient py-10">
        <div className="container-luxury">
          <h1 className="font-heading text-3xl font-bold">Vendor Store</h1>
        </div>
      </div>
      <div className="container-luxury py-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">{Array.from({length:8}).map((_,i) => <div key={i} className="aspect-square shimmer-loading rounded-xl" />)}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </div>
    </>
  );
}
