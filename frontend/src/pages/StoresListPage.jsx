import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { storeAPI } from '../services/api';

export default function StoresListPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storeAPI.getStores()
      .then((r) => setStores(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Helmet>
        <title>Store Locations — VK Jewellers</title>
        <meta name="description" content="Find a vk jewellers store near you. Visit us for an in-person experience." />
      </Helmet>

      {/* Header */}
      <section className="py-14 bg-[#faf7f4] text-center border-b border-gray-100">
        <span className="block text-[10px] font-semibold tracking-widest uppercase text-primary/70 mb-3" style={{ letterSpacing: '0.3em' }}>
          In-Store Experience
        </span>
        <h1
          className="font-heading font-bold text-gray-900 uppercase"
          style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', letterSpacing: '0.12em' }}
        >
          VISIT OUR STORES
        </h1>
        <p className="text-[13.5px] text-gray-500 mt-2.5 tracking-wide">
          Discover our curated jewelry collections in person
        </p>
      </section>

      {/* Stores grid */}
      <section className="py-14 bg-white">
        <div className="container-luxury">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map((i) => (
                <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
                  <div className="w-full bg-gray-200" style={{ aspectRatio: '16/9' }} />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-2/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-9 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-gray-400 text-sm">No stores listed yet. Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store, i) => (
                <motion.div
                  key={store._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="group border border-gray-100 hover:border-primary/20 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    {store.image ? (
                      <img
                        src={store.image}
                        alt={store.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="w-full h-full flex items-end p-5"
                      style={{
                        display: store.image ? 'none' : 'flex',
                        background: 'linear-gradient(135deg,#1c1209 0%,#3a2010 100%)',
                      }}
                    >
                      <span className="text-white/40 text-xs font-semibold uppercase tracking-widest">{store.name}</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                    {/* Open badge */}
                    <div className="absolute top-3 left-3">
                      <span className="flex items-center gap-1.5 bg-green-600/90 text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        OPEN NOW
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <h2 className="font-heading font-bold text-gray-900 text-sm uppercase tracking-wide" style={{ letterSpacing: '0.06em' }}>
                      {store.name}
                    </h2>
                    {store.city && (
                      <p className="text-xs text-gray-400 mt-1 tracking-widest uppercase" style={{ letterSpacing: '0.12em' }}>
                        {store.city}
                      </p>
                    )}
                    {store.address && (
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed line-clamp-2">{store.address}</p>
                    )}
                    {store.hoursDisplay && (
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                          <circle cx="12" cy="12" r="9"/><path strokeLinecap="round" d="M12 7v5l3 3"/>
                        </svg>
                        {store.hoursDisplay}
                      </p>
                    )}

                    {/* Services pills */}
                    {store.services?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {store.services.slice(0, 3).map((s, si) => (
                          <span key={si} className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
                            {s.title}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* CTA */}
                    <Link
                      to={`/stores/${store.slug}`}
                      className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-primary text-white text-[11px] font-semibold uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-colors"
                      style={{ letterSpacing: '0.12em' }}
                    >
                      SHOP NOW
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
