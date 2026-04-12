import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// All homepage images that can be replaced from admin
// filename = the file saved in /uploads/ on the backend
const SITE_IMAGES = [
  {
    group: 'Lifestyle Sections',
    items: [
      {
        key: 'lifestyle-bridal',
        filename: 'lifestyle-bridal.jpg',
        label: 'Bridal & Festive — Model Photo',
        hint: 'Portrait photo of model wearing bridal jewelry. Best: 900×1100px',
        aspect: '3/4',
      },
      {
        key: 'lifestyle-everyday',
        filename: 'lifestyle-everyday.jpg',
        label: 'Everyday Luxury — Model Photo',
        hint: 'Portrait photo of model wearing everyday jewelry. Best: 900×1100px',
        aspect: '3/4',
      },
    ],
  },
  {
    group: 'Why Choose Us Boxes',
    items: [
      {
        key: 'promo-shipping',
        filename: 'promo-shipping.jpg',
        label: 'Fast & Secure Shipping',
        hint: 'Delivery / packaging scene. Best: 800×400px',
        aspect: '2/1',
      },
      {
        key: 'promo-ring',
        filename: 'promo-ring.jpg',
        label: 'Vault of Dreams',
        hint: 'Diamond ring / savings visual. Best: 800×400px',
        aspect: '2/1',
      },
      {
        key: 'promo-consultation',
        filename: 'promo-consultation.jpg',
        label: 'Virtual Consultation',
        hint: 'Video call / consultation scene. Best: 800×400px',
        aspect: '2/1',
      },
      {
        key: 'promo-bespoke',
        filename: 'promo-bespoke.jpg',
        label: 'Bespoke Designs',
        hint: 'Jewelry sketching / design. Best: 800×400px',
        aspect: '2/1',
      },
    ],
  },
];

const BACKEND = 'http://localhost:8000';

function ImageSlot({ item }) {
  const EXTS = ['jpg', 'jpeg', 'webp', 'png', 'svg'];
  const baseUrl = `${BACKEND}/uploads/${item.filename.replace(/\.[^.]+$/, '')}`;
  const [preview, setPreview] = useState(null); // null = not loaded yet
  const [extIdx, setExtIdx] = useState(0);
  const [noImage, setNoImage] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  // Try each extension in order to find existing image
  const tryUrl = preview || `${baseUrl}.${EXTS[extIdx]}?t=${Date.now()}`;
  const handleImgError = () => {
    if (extIdx < EXTS.length - 1) setExtIdx((i) => i + 1);
    else setNoImage(true);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const token = localStorage.getItem('token');
      // Use fetch so FormData Content-Type+boundary is set correctly by the browser
      const res = await fetch(
        `/api/admin/upload/site-image?filename=${encodeURIComponent(item.filename)}`,
        { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd }
      );
      const json = await res.json();
      const savedUrl = json?.data?.url;
      if (savedUrl) {
        setPreview(`${savedUrl}?t=${Date.now()}`);
        setNoImage(false);
      }
      if (res.ok) toast.success(`${item.label} updated`);
      else toast.error(json?.message || 'Upload failed');
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
        <p className="text-[10px] text-gray-300 mt-0.5">JPG · WEBP · PNG · SVG accepted</p>
      </div>

      {/* Drop zone */}
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
        ) : !noImage ? (
          <>
            <img
              src={tryUrl}
              alt={item.label}
              className="w-full h-full object-contain p-1"
              onError={handleImgError}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-xl">
                Replace Image
              </span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300 hover:text-primary transition-colors">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-[11px] font-semibold text-gray-400 text-center px-2">
              Click to upload
            </span>
            <span className="text-[9px] text-gray-300">JPG · WEBP · PNG · SVG</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.webp,.png,.svg,image/*"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      <button
        onClick={() => inputRef.current?.click()}
        className="w-full py-2 text-xs font-semibold text-primary border border-primary/30 rounded-xl hover:bg-primary/5 transition-colors"
      >
        {noImage ? 'Upload Image' : 'Replace Image'}
      </button>
    </div>
  );
}

export default function AdminSiteImages() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">Site Images</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Upload your own photos for the homepage lifestyle sections and promo boxes.
        </p>
      </div>

      {SITE_IMAGES.map((group) => (
        <div key={group.group} className="space-y-4">
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-widest border-b border-gray-100 pb-2">
            {group.group}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {group.items.map((item) => (
              <ImageSlot key={item.key} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
