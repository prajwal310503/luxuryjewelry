import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { blogAPI } from '../services/api';

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    blogAPI.getAll({ limit: 50 })
      .then((r) => setPosts(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Helmet>
        <title>Jewelry Blog — Luxury Jewelry</title>
        <meta name="description" content="Explore jewelry guides, trends, and education from our experts." />
      </Helmet>

      {/* Header */}
      <section className="py-14 bg-[#faf7f4] text-center border-b border-gray-100">
        <span className="block text-[10px] font-semibold tracking-widest uppercase text-primary/70 mb-3" style={{ letterSpacing: '0.3em' }}>
          Expert Insights
        </span>
        <h1
          className="font-heading font-bold text-gray-900 uppercase"
          style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', letterSpacing: '0.12em' }}
        >
          JEWELRY BLOG
        </h1>
        <p className="text-[13.5px] text-gray-500 mt-2.5 tracking-wide">
          Where Craft Inspires Conversation
        </p>
      </section>

      {/* Posts grid */}
      <section className="py-14 bg-white">
        <div className="container-luxury">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1,2,3,4,5,6,7,8].map((i) => (
                <div key={i} className="animate-pulse space-y-3">
                  <div className="rounded-xl bg-gray-200" style={{ aspectRatio: '3/4' }} />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-gray-400 text-sm">No posts published yet. Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {posts.map((post, i) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to={`/blog/${post.slug}`} className="group block">
                    <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '3/4' }}>
                      {post.image
                        ? <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full bg-gray-100 flex items-center justify-center p-4">
                            <p className="font-heading italic text-gray-500 text-center text-sm leading-snug">
                              {post.imageTitle || post.title}
                            </p>
                          </div>
                      }
                    </div>
                    <div className="mt-3 flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-1.5">{post.category}</p>
                        <h3 className="font-heading font-bold text-gray-900 text-[12px] sm:text-[13px] uppercase leading-snug line-clamp-2" style={{ letterSpacing: '0.04em' }}>
                          {post.title}
                        </h3>
                      </div>
                      <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:border-primary group-hover:text-primary transition-all">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
