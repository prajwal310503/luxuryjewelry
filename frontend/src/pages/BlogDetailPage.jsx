import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { blogAPI } from '../services/api';

export default function BlogDetailPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    blogAPI.getBySlug(slug)
      .then((r) => setPost(r.data.data))
      .catch((err) => { if (err.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="container-luxury py-16 animate-pulse space-y-6">
      <div className="h-6 bg-gray-200 rounded w-1/4" />
      <div className="h-10 bg-gray-200 rounded w-3/4" />
      <div className="rounded-2xl bg-gray-200 w-full" style={{ aspectRatio: '16/7' }} />
      {[1,2,3,4].map((i) => <div key={i} className="h-4 bg-gray-200 rounded" />)}
    </div>
  );

  if (notFound || !post) return (
    <div className="container-luxury py-24 text-center">
      <h2 className="font-heading text-2xl text-gray-700 mb-4">Post Not Found</h2>
      <Link to="/blog" className="btn-primary">Back to Blog</Link>
    </div>
  );

  const paragraphs = post.content ? post.content.split(/\n\n+/) : [];

  return (
    <>
      <Helmet>
        <title>{post.title} — Jewelry Blog</title>
        <meta name="description" content={post.excerpt || post.title} />
      </Helmet>

      <article className="bg-white">
        {/* Hero image */}
        {post.image && (
          <div className="w-full" style={{ aspectRatio: '16/7', maxHeight: '520px', overflow: 'hidden' }}>
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="container-luxury py-12 max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-gray-400 mb-6">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link to="/blog" className="hover:text-primary">Blog</Link>
            <span>/</span>
            <span className="text-primary font-medium">{post.title}</span>
          </nav>

          {/* Category + date */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold bg-primary/8 px-3 py-1 rounded-full border border-primary/20">
              {post.category}
            </span>
            {post.publishedAt && (
              <span className="text-xs text-gray-400">
                {new Date(post.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            )}
          </div>

          {/* Title */}
          <h1
            className="font-heading font-bold text-gray-900 leading-tight mb-4"
            style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', letterSpacing: '0.04em' }}
          >
            {post.title}
          </h1>

          {/* Excerpt */}
          {post.excerpt && (
            <p className="text-base text-gray-500 leading-relaxed mb-8 border-l-4 border-primary/30 pl-4 italic">
              {post.excerpt}
            </p>
          )}

          {/* Divider */}
          <div className="h-px bg-gray-100 mb-8" />

          {/* Content */}
          {paragraphs.length > 0 ? (
            <div className="space-y-5 text-gray-700 text-[15px] leading-relaxed">
              {paragraphs.map((para, i) => (
                <p key={i}>{para.trim()}</p>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic text-sm">No content available.</p>
          )}

          {/* Author */}
          {post.author && (
            <div className="mt-12 pt-6 border-t border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {post.author[0]}
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest">Written by</p>
                <p className="text-sm font-semibold text-gray-800">{post.author}</p>
              </div>
            </div>
          )}

          {/* Back link */}
          <div className="mt-10">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 uppercase tracking-widest border-b border-primary/30 pb-0.5 transition-all"
            >
              <svg className="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              BACK TO BLOG
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
