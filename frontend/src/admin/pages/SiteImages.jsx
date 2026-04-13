import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// All homepage images manageable from admin
const SITE_IMAGES = [
  {
    group: 'Lifestyle Sections',
    items: [
      {
        key: 'lifestyle-bridal',
        label: 'Bridal & Festive — Model Photo',
        hint: 'Portrait photo of model wearing bridal jewelry. Best: 900×1100px',
        aspect: '3/4',
        fallback: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=600&h=800&fit=crop&q=80&auto=format',
      },
      {
        key: 'lifestyle-everyday',
        label: 'Everyday Luxury — Model Photo',
        hint: 'Portrait photo of model wearing everyday jewelry. Best: 900×1100px',
        aspect: '3/4',
        fallback: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=800&fit=crop&q=80&auto=format',
      },
    ],
  },
  {
    group: 'Why Choose Us Boxes',
    items: [
      {
        key: 'promo-shipping',
        label: 'Fast & Secure Shipping',
        hint: 'Delivery / packaging scene. Best: 800×400px',
        aspect: '2/1',
        fallback: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&h=300&fit=crop&q=80&auto=format',
      },
      {
        key: 'promo-ring',
        label: 'Vault of Dreams',
        hint: 'Diamond ring / savings visual. Best: 800×400px',
        aspect: '2/1',
        fallback: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=300&fit=crop&q=80&auto=format',
      },
      {
        key: 'promo-consultation',
        label: 'Virtual Consultation',
        hint: 'Video call / consultation scene. Best: 800×400px',
        aspect: '2/1',
        fallback: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=300&fit=crop&q=80&auto=format',
      },
      {
        key: 'promo-bespoke',
        label: 'Bespoke Designs',
        hint: 'Jewelry sketching / design. Best: 800×400px',
        aspect: '2/1',
        fallback: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=300&fit=crop&q=80&auto=format',
      },
    ],
  },
];

function ImageSlot({ item, savedUrl, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const currentUrl = savedUrl || item.fallback;

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${API_BASE}/admin/upload/site-image?key=${encodeURIComponent(item.key)}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd }
      );
      const json = await res.json();
      if (res.ok && json?.data?.url) {
        onUploaded(item.key, json.data.url);
        toast.success(`${item.label} updated`);
      } else {
        toast.error(json?.message || 'Upload failed');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card-luxury p-4 flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-gray-800">{item.label}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{item.hint}</p>
        <p className="text-[10px] text-gray-300 mt-0.5">JPG · WEBP · PNG accepted</p>
      </div>

      {/* Preview */}
      <div
        className="relative group overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-luxury-cream cursor-pointer"
        style={{ aspectRatio: item.aspect }}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <svg className="w-7 h-7 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : (
          <>
            <img
              src={currentUrl}
              alt={item.label}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-xl">
                {savedUrl ? 'Replace Image' : 'Upload Your Image'}
              </span>
            </div>
            {savedUrl && (
              <span className="absolute top-2 right-2 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                UPLOADED
              </span>
            )}
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.webp,.png,image/*"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      <button
        onClick={() => inputRef.current?.click()}
        className="w-full py-2 text-xs font-semibold text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors"
      >
        {savedUrl ? 'Replace Image' : 'Upload Image'}
      </button>
    </div>
  );
}

export default function AdminSiteImages() {
  const [saved, setSaved] = useState({}); // key → Cloudinary URL

  useEffect(() => {
    fetch(`${API_BASE}/settings/site-images`)
      .then((r) => r.json())
      .then((j) => { if (j.success) setSaved(j.data || {}); })
      .catch(() => {});
  }, []);

  const handleUploaded = (key, url) => setSaved((prev) => ({ ...prev, [key]: url }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">Site Images</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Upload your own photos for the homepage lifestyle sections and promo boxes.
          Images are saved to Cloudinary and applied instantly.
        </p>
      </div>

      {SITE_IMAGES.map((group) => (
        <div key={group.group} className="space-y-4">
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-widest border-b border-gray-100 pb-2">
            {group.group}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {group.items.map((item) => (
              <ImageSlot
                key={item.key}
                item={item}
                savedUrl={saved[item.key]}
                onUploaded={handleUploaded}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
