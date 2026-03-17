import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { cmsAPI, productAPI } from '../../services/api';

// ─── Icon ─────────────────────────────────────────────────────────────────────
const Ic = ({ d }) => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);

// ─── Image Upload ──────────────────────────────────────────────────────────────
function ImageUpload({ value, onChange, label = 'Image' }) {
  const ref = useRef(null);
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await cmsAPI.uploadImage(fd);
      onChange(data.url || data.data?.url || '');
    } catch { toast.error('Upload failed'); }
    setUploading(false);
    e.target.value = '';
  };
  return (
    <div>
      <label className="label-luxury mb-1 block">{label}</label>
      <div className="flex items-center gap-3">
        {value && <img src={value} alt="" className="w-20 h-14 object-cover rounded-lg border border-gray-200 flex-shrink-0" />}
        <button type="button" onClick={() => ref.current?.click()} disabled={uploading} className="btn-outline text-xs px-4 py-2">
          {uploading ? 'Uploading…' : value ? 'Change' : 'Upload'}
        </button>
        {value && <button type="button" onClick={() => onChange('')} className="text-xs text-red-400 hover:text-red-600">Remove</button>}
      </div>
      <input ref={ref} type="file" accept="image/*,.gif" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ─── Section Groups ────────────────────────────────────────────────────────────
const GROUPS = [
  {
    id: 'header',
    label: 'Header',
    icon: 'M5 3h14a2 2 0 012 2v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z',
    sections: [
      { key: 'announcement_bar', page: 'global', label: 'Announcement Bar',    desc: 'Rotating messages in the pink bar at the very top of every page',              icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
    ],
  },
  {
    id: 'home',
    label: 'Home Page',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    sections: [
      { key: 'hero',              page: 'home',   label: 'Hero Slider',           desc: 'Full-width sliding banner: images, GIFs, YouTube or mp4 videos',            icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { key: 'trust_bar',         page: 'home',   label: 'Why Shop With Us',      desc: 'Trust badge row under the hero: 4 items with label and sub-text',           icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
      { key: 'category_grid',     page: 'home',   label: 'Category Grid',         desc: 'Heading text for the shop-by-jewelry-category section',                     icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
      { key: 'deals',             page: 'home',   label: 'Deal of the Week',      desc: 'Heading and subtitle for the deals & countdown section',                    icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 014-4z' },
      { key: 'why_choose',        page: 'home',   label: 'Why Choose Us',         desc: '2×2 promo grid — 4 cards with title, subtitle and background image',        icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
      { key: 'featured_products', page: 'home',   label: 'Featured Products',     desc: 'Eyebrow, heading and subtitle for the best-jewelry section',                icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
      { key: 'diamond_cuts',      page: 'home',   label: 'Diamond Cuts',          desc: 'Section heading for the diamond-shapes row',                               icon: 'M6 3h12l4 6-10 12L2 9l4-6z' },
      { key: 'services',          page: 'home',   label: 'Store Services',        desc: '4 service cards — title and description for each',                          icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
      { key: 'gifting',           page: 'home',   label: 'Gifting Section',       desc: 'Gift-by-budget cards and gift occasion slides',                             icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 10V11' },
      { key: 'newsletter',        page: 'home',   label: 'Newsletter Section',    desc: 'Heading, subtitle and 3 perk bullet points for the email signup section',   icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
      { key: 'faq',               page: 'home',   label: 'FAQ Section',           desc: 'Frequently asked questions — categories, questions and answers',            icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    ],
  },
  {
    id: 'footer',
    label: 'Footer',
    icon: 'M19 21H5a2 2 0 01-2-2v-3h18v3a2 2 0 01-2 2zM3 16V5a2 2 0 012-2h14a2 2 0 012 2v11',
    sections: [
      { key: 'footer_brand',   page: 'global', label: 'Brand & Contact',      desc: 'Brand name, tagline, about text, email, phone and copyright',               icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
      { key: 'footer_social',  page: 'global', label: 'Social Links',         desc: 'URLs for Instagram, Facebook, YouTube, Pinterest and LinkedIn',             icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
      { key: 'footer_links',   page: 'global', label: 'Footer Link Columns',  desc: 'Edit the 4 link columns in the footer — headings and individual links',    icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
      { key: 'footer_payment', page: 'global', label: 'Payment Methods',      desc: 'Payment method badges shown in the footer bottom bar',                      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    ],
  },
];

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULTS = {
  announcement_bar: { messages: ['Upto 50% Off on Making Charges', 'Free Shipping on orders above ₹5,000', 'Flat 20% Off on Diamonds', 'Certified Lab-Grown Diamonds — Guaranteed'] },
  trust_bar: {
    heading: 'WHY SHOP WITH US',
    subtitle: 'Trusted by 1000+ happy customers',
    items: [
      { icon: 'return',    label: '15 DAYS EASY RETURN',   sub: 'Keep it only if you love it.' },
      { icon: 'certified', label: 'CERTIFIED JEWELRY',      sub: 'Every detail is fully certified.' },
      { icon: 'exchange',  label: '100% LIFETIME EXCHANGE', sub: 'Your jewelry always holds value.' },
      { icon: 'shipping',  label: 'FREE & SAFE SHIPPING',   sub: 'From Store to your Doorstep.' },
    ],
  },
  category_grid:     { title: 'SHOP BY JEWELRY CATEGORY', subtitle: 'Jewelry for Every Moment' },
  deals: { title: 'DEAL OF THE WEEK', subtitle: 'Special Deals Only for You', products: [] },
  why_choose: {
    title: 'WHY CHOOSE OUR JEWELRY?',
    subtitle: 'Custom designs, Video consults, Fast delivery',
    items: [
      { title: 'FAST & SECURE SHIPPING',  subtitle: 'Your Excitement, Our Priority', link: '#', image: '' },
      { title: 'VAULT OF DREAMS',         subtitle: 'Complete 9, Unlock the Shine',  link: '#', image: '' },
      { title: 'VIRTUAL CONSULTATION',    subtitle: 'See it, Love it, Buy it',        link: '#', image: '' },
      { title: 'BESPOKE DESIGNS',         subtitle: 'Handcrafted to Perfection',      link: '#', image: '' },
    ],
  },
  featured_products: { eyebrow: 'Handpicked', title: 'SHOP BEST JEWELRY', subtitle: 'Crafted for your everyday lifestyle' },
  diamond_cuts: {
    title: 'EXPLORE OUR DIAMOND CUTS',
    subtitle: 'Where Geometry Elevates Style',
    cuts: [
      { name: 'Round', image: '' },
      { name: 'Princess', image: '' },
      { name: 'Cushion', image: '' },
      { name: 'Oval', image: '' },
      { name: 'Emerald', image: '' },
      { name: 'Pear', image: '' },
      { name: 'Marquise', image: '' },
      { name: 'Heart', image: '' },
    ],
  },
  services: {
    eyebrow: 'In-Store Experience',
    title: 'SERVICES AT OUR STORE',
    subtitle: 'Visit us to explore lab-grown diamonds and receive expert guidance',
    items: [
      { title: 'Old Gold Exchange',       desc: 'Upgrade your jewellery by exchanging old gold at the best market rates', icon: 'exchange' },
      { title: 'Vault of Dreams Savings', desc: 'Turn monthly savings into jewellery you love with our savings plan',    icon: 'savings' },
      { title: 'Free Jewellery Cleaning', desc: 'Professional cleaning that restores the brilliance and finish of your pieces', icon: 'cleaning' },
      { title: 'Diamond Carat Testing',   desc: 'Check carat weight using our in-store precision testing instruments',   icon: 'diamond' },
    ],
  },
  gifting: {
    heading: 'Gift what lasts beyond the vows.',
    budgets:   [{ label: '30K', slug: 'gift-below-rs-30k' }, { label: '50K', slug: 'gift-below-rs-50k' }, { label: '100K', slug: 'gift-below-rs-100k' }],
    occasions: [
      { title: 'GIFTS FOR WIFE',      slug: 'gifts-for-wife' },
      { title: 'ANNIVERSARY GIFTS',   slug: 'anniversary-gifts' },
      { title: 'BIRTHDAY GIFTS',      slug: 'birthday-gifts' },
      { title: 'ENGAGEMENT GIFTS',    slug: 'engagement-gifts' },
      { title: 'GIFTS FOR HER',       slug: 'gifts-for-her' },
    ],
  },
  newsletter: {
    eyebrow: 'Stay Updated',
    heading: 'Subscribe to Our Emails',
    subtitle: 'Be the first to know about exclusive offers, new arrivals, and insider access to our latest collections.',
    cardHeading: 'Join the Inner Circle',
    perks: [
      { label: 'Early Access to New Collections' },
      { label: "Members-Only Deals & Offers" },
      { label: 'Style Tips & Jewelry Guides' },
    ],
  },
  faq: {
    heading: 'Browse by Category',
    subtitle: 'Select a topic to view related questions',
    categories: [
      { label: 'Orders & Delivery', items: [
        { q: 'How long does delivery take?', a: 'Standard delivery takes 5–7 business days.' },
        { q: 'Can I track my order?', a: 'Yes. Once shipped, you will receive an SMS and email with a tracking link.' },
      ]},
      { label: 'Products & Materials', items: [
        { q: 'Are your diamonds lab-grown or natural?', a: 'We offer both. Each product listing specifies the diamond type and certification.' },
        { q: 'What purity of gold do you use?', a: 'We use 18KT, 22KT, and 9KT gold, hallmarked as per BIS standards.' },
      ]},
      { label: 'Returns & Exchange', items: [
        { q: 'What is your return policy?', a: 'We offer a 15-day hassle-free return for all unused, unworn products in original packaging.' },
        { q: 'How do I initiate a return?', a: 'Log in, go to My Orders, and click Return / Exchange. We arrange free pickup within 48 hours.' },
      ]},
      { label: 'Payments & Offers', items: [
        { q: 'What payment methods do you accept?', a: 'We accept all cards, UPI, net banking, wallets, and EMI options.' },
        { q: 'Is it safe to pay online?', a: 'Yes. All transactions use 256-bit SSL encryption. We never store card details.' },
      ]},
      { label: 'Store & Experience', items: [
        { q: 'Where are your stores located?', a: 'We have experience centres across major cities. Use the Store Nearby button in the header.' },
        { q: 'Do I need an appointment to visit?', a: 'Walk-ins are always welcome. Booking an appointment ensures dedicated advisor time.' },
      ]},
    ],
  },
  footer_brand:   { brandName: 'Luxury Jewelry', tagline: 'Luxury. Joy. Comfort.', about: 'Premium lab-grown diamond and gold jewelry for every occasion.', email: 'care@luxuryjewelry.com', phone: '+91 9004436052', copyright: '© 2026 Luxury Jewelry. All Rights Reserved.' },
  footer_social:  { instagram: '#', facebook: '#', youtube: '#', pinterest: '#', linkedin: '#' },
  footer_links: {
    columns: [
      { heading: 'About Royalbutterfly', links: [{ label: 'About Our Company', to: '/about' }, { label: 'Terms & Conditions', to: '/terms' }, { label: 'Privacy Policy', to: '/privacy' }, { label: 'Shipping Policy', to: '/shipping' }] },
      { heading: 'Jewelry Guide', links: [{ label: 'Diamond Education', to: '/guides/diamonds' }, { label: 'Metal Education', to: '/guides/metals' }, { label: 'Size Guide', to: '/guides/size' }, { label: 'Jewelry Care Tips', to: '/guides/care' }] },
      { heading: 'Why Choose Us', links: [{ label: '15 Days Return', to: '/policies/return' }, { label: 'Lifetime Exchange', to: '/policies/exchange' }, { label: 'Old Gold Exchange', to: '/old-gold' }, { label: "FAQ's", to: '/faq' }] },
      { heading: 'Sell With Us', links: [{ label: 'Become a Vendor', to: '/register?role=vendor' }, { label: 'Vendor Guidelines', to: '/vendor-guidelines' }, { label: 'Commission Structure', to: '/commissions' }] },
    ],
  },
  footer_payment: { methods: ['Visa', 'Mastercard', 'UPI', 'Razorpay', 'GPay', 'Paytm'] },
};

// ─── Section Editors ───────────────────────────────────────────────────────────

function AnnouncementBarEditor({ form, set }) {
  const msgs = form.messages?.length ? form.messages : DEFAULTS.announcement_bar.messages;
  const setMsg = (i, v) => set('messages', msgs.map((m, j) => j === i ? v : m));
  const add    = () => set('messages', [...msgs, '']);
  const remove = (i) => msgs.length > 1 && set('messages', msgs.filter((_, j) => j !== i));
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 leading-relaxed">These messages rotate in the colored bar at the very top of every page.</p>
      {msgs.map((m, i) => (
        <div key={i} className="flex gap-2">
          <input className="input-luxury flex-1" value={m} onChange={(e) => setMsg(i, e.target.value)} placeholder={`Announcement ${i + 1}`} />
          {msgs.length > 1 && (
            <button onClick={() => remove(i)} className="p-2 text-red-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 flex-shrink-0">
              <Ic d="M6 18L18 6M6 6l12 12" />
            </button>
          )}
        </div>
      ))}
      {msgs.length < 8 && (
        <button onClick={add} className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-500 hover:border-primary hover:text-primary transition-colors">
          + Add Message
        </button>
      )}
    </div>
  );
}

function HeroEditor({ banners, onBannersChange }) {
  const EMPTY = { mediaType: 'image', image: '', videoUrl: '', link: '' };
  const [newSlide, setNewSlide]     = useState(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const addSlide = async () => {
    if (newSlide.mediaType === 'image' && !newSlide.image) return toast.error('Please upload an image first');
    if (newSlide.mediaType === 'video' && !newSlide.videoUrl) return toast.error('Please enter a video URL');
    setSaving(true);
    try {
      await cmsAPI.createBanner({
        title:     `Slide ${banners.length + 1}`,
        mediaType: newSlide.mediaType,
        image:     newSlide.image,
        videoUrl:  newSlide.videoUrl,
        ctaLink:   newSlide.link,
        position:  'hero',
        isActive:  true,
      });
      toast.success('Slide added!');
      setNewSlide(EMPTY);
      onBannersChange();
    } catch { toast.error('Failed to add slide'); }
    setSaving(false);
  };

  const deleteSlide = async (id) => {
    if (!window.confirm('Delete this slide?')) return;
    setDeletingId(id);
    try { await cmsAPI.deleteBanner(id); toast.success('Deleted'); onBannersChange(); }
    catch { toast.error('Failed'); }
    setDeletingId(null);
  };

  return (
    <div className="space-y-5">
      <p className="text-xs text-gray-500 leading-relaxed">Add images, GIFs, or video URLs. Each becomes a slide in the full-width banner at the top of your home page.</p>

      {/* Existing Slides List */}
      <div>
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Current Slides ({banners.length})
        </p>
        {banners.length === 0 ? (
          <div className="text-center py-8 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-sm">
            No slides yet — add your first slide below
          </div>
        ) : (
          <div className="space-y-2">
            {banners.map((b, i) => (
              <div key={b._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-[11px] font-bold text-gray-400 w-5 text-center flex-shrink-0">{i + 1}</span>
                {b.image
                  ? <img src={b.image} alt="" className="w-24 h-14 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                  : <div className="w-24 h-14 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 text-[10px] flex-shrink-0">Video</div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-700">{b.mediaType === 'video' ? 'Video slide' : 'Image slide'}</p>
                  {(b.ctaLink || b.link) && <p className="text-[10px] text-gray-400 truncate mt-0.5">Link: {b.ctaLink || b.link}</p>}
                </div>
                <button onClick={() => deleteSlide(b._id)} disabled={deletingId === b._id}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                  <Ic d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Slide Form — always visible */}
      <div className="border-2 border-dashed border-primary/30 rounded-xl p-4 bg-primary/5 space-y-4">
        <p className="text-sm font-semibold text-gray-800">+ Add New Slide</p>

        <div className="flex gap-2">
          {['image', 'video'].map((t) => (
            <button key={t} type="button"
              onClick={() => setNewSlide((s) => ({ ...s, mediaType: t, image: '', videoUrl: '' }))}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${newSlide.mediaType === t ? 'bg-primary text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {t === 'image' ? 'Image / GIF' : 'Video URL'}
            </button>
          ))}
        </div>

        {newSlide.mediaType === 'image' ? (
          <ImageUpload value={newSlide.image} onChange={(url) => setNewSlide((s) => ({ ...s, image: url }))} label="Banner Image or GIF" />
        ) : (
          <div>
            <label className="label-luxury mb-1 block">Video URL (YouTube embed or direct .mp4)</label>
            <input className="input-luxury" value={newSlide.videoUrl}
              onChange={(e) => setNewSlide((s) => ({ ...s, videoUrl: e.target.value }))}
              placeholder="https://youtube.com/embed/... or https://example.com/video.mp4" />
          </div>
        )}

        <div>
          <label className="label-luxury mb-1 block">Click Link (optional)</label>
          <input className="input-luxury" value={newSlide.link}
            onChange={(e) => setNewSlide((s) => ({ ...s, link: e.target.value }))}
            placeholder="/collections/rings  — leave blank if no link" />
        </div>

        <button onClick={addSlide} disabled={saving} className="w-full btn-primary py-2.5 text-sm font-semibold">
          {saving ? 'Adding…' : 'Add Slide'}
        </button>
      </div>
    </div>
  );
}

function DealsEditor({ form, set }) {
  const selected = form.products || [];
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [search, setSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const loadCatalog = async () => {
    if (catalog.length > 0) { setShowPicker(true); return; }
    setLoadingCatalog(true);
    try {
      const { data } = await productAPI.adminGetAll({ status: 'approved', limit: 100 });
      setCatalog(data.data || []);
      setShowPicker(true);
    } catch { toast.error('Failed to load products'); }
    finally { setLoadingCatalog(false); }
  };

  const isSelected = (id) => selected.some((p) => p._id === id);

  const toggleProduct = (prod) => {
    if (isSelected(prod._id)) {
      set('products', selected.filter((p) => p._id !== prod._id));
    } else if (selected.length < 8) {
      const primaryImg = prod.images?.find((i) => i.isPrimary) || prod.images?.[0];
      set('products', [...selected, {
        _id: prod._id,
        image: primaryImg?.url || '',
        name: prod.title,
        price: prod.price,
        originalPrice: prod.comparePrice || '',
        badge: prod.discount > 0 ? `${prod.discount}% OFF` : '',
        link: `/products/${prod.slug || prod._id}`,
      }]);
    } else {
      toast.error('Maximum 8 deal products');
    }
  };

  const removeProduct = (id) => set('products', selected.filter((p) => p._id !== id));

  const filtered = catalog.filter((p) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label-luxury mb-1 block">Section Heading</label>
          <input className="input-luxury" value={form.title || ''} onChange={(e) => set('title', e.target.value)} placeholder="DEAL OF THE WEEK" /></div>
        <div><label className="label-luxury mb-1 block">Subtitle</label>
          <input className="input-luxury" value={form.subtitle || ''} onChange={(e) => set('subtitle', e.target.value)} placeholder="Special Deals Only for You" /></div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Deal Products {selected.length > 0 ? `(${selected.length} / 8)` : ''}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Leave empty to auto-show products tagged "Deal of Week".
          </p>
        </div>
        {selected.length < 8 && (
          <button
            onClick={loadCatalog}
            disabled={loadingCatalog}
            className="px-3 py-1.5 text-xs rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-1.5"
          >
            <Ic d="M12 4v16m8-8H4" />
            {loadingCatalog ? 'Loading...' : 'Pick from Catalog'}
          </button>
        )}
      </div>

      {/* Product Picker Modal */}
      {showPicker && (
        <div className="border border-primary/20 rounded-xl bg-white overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b border-primary/10">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Select Products ({selected.length}/8 selected)</p>
            <button onClick={() => setShowPicker(false)} className="text-gray-400 hover:text-gray-600">
              <Ic d="M6 18L18 6M6 6l12 12" />
            </button>
          </div>
          <div className="p-3 border-b border-gray-100">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="input-luxury py-1.5 text-sm"
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-3 grid grid-cols-2 gap-2">
            {filtered.length === 0 ? (
              <p className="col-span-2 text-center text-xs text-gray-400 py-6">No approved products found</p>
            ) : filtered.map((prod) => {
              const primaryImg = prod.images?.find((i) => i.isPrimary) || prod.images?.[0];
              const picked = isSelected(prod._id);
              return (
                <button
                  key={prod._id}
                  onClick={() => toggleProduct(prod)}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                    picked ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-primary/40 hover:bg-gray-50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-md overflow-hidden bg-luxury-cream flex-shrink-0">
                    {primaryImg ? <img src={primaryImg.url} alt="" className="w-full h-full object-cover" /> : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Ic d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{prod.title}</p>
                    <p className="text-xs text-primary font-semibold">₹{prod.price?.toLocaleString('en-IN')}</p>
                  </div>
                  {picked && (
                    <svg className="w-4 h-4 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  )}
                </button>
              );
            })}
          </div>
          <div className="px-4 py-3 border-t border-gray-100 flex justify-end">
            <button onClick={() => setShowPicker(false)} className="px-4 py-1.5 text-xs rounded-lg bg-primary text-white">
              Done ({selected.length} selected)
            </button>
          </div>
        </div>
      )}

      {/* Selected products list */}
      {selected.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium">Selected Deal Products:</p>
          {selected.map((p, i) => (
            <div key={p._id || i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-luxury-cream flex-shrink-0">
                {p.image ? <img src={p.image} alt="" className="w-full h-full object-cover" /> : (
                  <div className="w-full h-full bg-gray-200 rounded-lg" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-primary font-bold">₹{parseFloat(p.price || 0).toLocaleString('en-IN')}</span>
                  {p.originalPrice && <span className="text-xs text-gray-400 line-through">₹{parseFloat(p.originalPrice).toLocaleString('en-IN')}</span>}
                  {p.badge && <span className="text-2xs bg-gold/20 text-gold px-1.5 py-0.5 rounded-full font-medium">{p.badge}</span>}
                </div>
              </div>
              <button onClick={() => removeProduct(p._id || i)} className="p-1 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 flex-shrink-0">
                <Ic d="M6 18L18 6M6 6l12 12" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DiamondCutsEditor({ form, set }) {
  const cuts = form.cuts || [];

  const updateCut = (i, field, value) => {
    const updated = cuts.map((c, j) => j === i ? { ...c, [field]: value } : c);
    set('cuts', updated);
  };

  const addCut = () => set('cuts', [...cuts, { name: '', image: '' }]);

  const removeCut = (i) => set('cuts', cuts.filter((_, j) => j !== i));

  return (
    <div className="space-y-5">
      <div><label className="label-luxury mb-1 block">Heading</label>
        <input className="input-luxury" value={form.title || ''} onChange={(e) => set('title', e.target.value)} placeholder="e.g. EXPLORE OUR DIAMOND CUTS" /></div>
      <div><label className="label-luxury mb-1 block">Subtitle</label>
        <input className="input-luxury" value={form.subtitle || ''} onChange={(e) => set('subtitle', e.target.value)} placeholder="e.g. Where Geometry Elevates Style" /></div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="label-luxury">Cut Items</label>
          <button type="button" onClick={addCut} className="text-xs text-primary hover:underline">+ Add Cut</button>
        </div>
        <div className="space-y-3">
          {cuts.map((cut, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <ImageUpload
                value={cut.image}
                onChange={(url) => updateCut(i, 'image', url)}
                label=""
              />
              <div className="flex-1">
                <input
                  className="input-luxury text-sm"
                  value={cut.name}
                  onChange={(e) => updateCut(i, 'name', e.target.value)}
                  placeholder="Cut name (e.g. Round, Princess)"
                />
              </div>
              <button type="button" onClick={() => removeCut(i)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                <Ic d="M6 18L18 6M6 6l12 12" />
              </button>
            </div>
          ))}
          {cuts.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">No cuts added yet. Click "+ Add Cut" to start.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SimpleEditor({ form, set, showEyebrow }) {
  return (
    <div className="space-y-4">
      {showEyebrow && (
        <div><label className="label-luxury mb-1 block">Eyebrow Text</label>
          <input className="input-luxury" value={form.eyebrow || ''} onChange={(e) => set('eyebrow', e.target.value)} placeholder="e.g. Handpicked" /></div>
      )}
      <div><label className="label-luxury mb-1 block">Heading</label>
        <input className="input-luxury" value={form.title || ''} onChange={(e) => set('title', e.target.value)} placeholder="Section heading" /></div>
      <div><label className="label-luxury mb-1 block">Subtitle</label>
        <input className="input-luxury" value={form.subtitle || ''} onChange={(e) => set('subtitle', e.target.value)} placeholder="Section subtitle" /></div>
    </div>
  );
}

function TrustBarEditor({ form, set }) {
  const items = form.items?.length ? form.items : DEFAULTS.trust_bar.items;
  const setItem = (i, f, v) => set('items', items.map((it, j) => j === i ? { ...it, [f]: v } : it));
  return (
    <div className="space-y-4">
      <div><label className="label-luxury mb-1 block">Section Heading</label>
        <input className="input-luxury" value={form.heading || ''} onChange={(e) => set('heading', e.target.value)} placeholder="WHY SHOP WITH US" /></div>
      <div><label className="label-luxury mb-1 block">Subtitle</label>
        <input className="input-luxury" value={form.subtitle || ''} onChange={(e) => set('subtitle', e.target.value)} /></div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">Trust Items (4)</p>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
            <p className="text-xs font-semibold text-gray-400">Item {i + 1}</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label-luxury mb-1 block">Label</label>
                <input className="input-luxury" value={item.label} onChange={(e) => setItem(i, 'label', e.target.value)} /></div>
              <div><label className="label-luxury mb-1 block">Sub-text</label>
                <input className="input-luxury" value={item.sub} onChange={(e) => setItem(i, 'sub', e.target.value)} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WhyChooseEditor({ form, set }) {
  const items = form.items?.length ? form.items : DEFAULTS.why_choose.items;
  const setItem = (i, f, v) => set('items', items.map((it, j) => j === i ? { ...it, [f]: v } : it));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label-luxury mb-1 block">Heading</label>
          <input className="input-luxury" value={form.title || ''} onChange={(e) => set('title', e.target.value)} /></div>
        <div><label className="label-luxury mb-1 block">Subtitle</label>
          <input className="input-luxury" value={form.subtitle || ''} onChange={(e) => set('subtitle', e.target.value)} /></div>
      </div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">Promo Cards (2×2 grid)</p>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
            <p className="text-xs font-semibold text-gray-400">Card {i + 1}</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label-luxury mb-1 block">Title</label>
                <input className="input-luxury" value={item.title} onChange={(e) => setItem(i, 'title', e.target.value)} /></div>
              <div><label className="label-luxury mb-1 block">Subtitle</label>
                <input className="input-luxury" value={item.subtitle} onChange={(e) => setItem(i, 'subtitle', e.target.value)} /></div>
            </div>
            <div><label className="label-luxury mb-1 block">Link URL</label>
              <input className="input-luxury" value={item.link || ''} onChange={(e) => setItem(i, 'link', e.target.value)} placeholder="/collections/rings" /></div>
            <ImageUpload value={item.image || ''} onChange={(url) => setItem(i, 'image', url)} label="Background Image" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ServicesEditor({ form, set }) {
  const items = form.items?.length ? form.items : DEFAULTS.services.items;
  const setItem = (i, f, v) => set('items', items.map((it, j) => j === i ? { ...it, [f]: v } : it));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label-luxury mb-1 block">Eyebrow</label>
          <input className="input-luxury" value={form.eyebrow || ''} onChange={(e) => set('eyebrow', e.target.value)} /></div>
        <div><label className="label-luxury mb-1 block">Heading</label>
          <input className="input-luxury" value={form.title || ''} onChange={(e) => set('title', e.target.value)} /></div>
      </div>
      <div><label className="label-luxury mb-1 block">Subtitle</label>
        <input className="input-luxury" value={form.subtitle || ''} onChange={(e) => set('subtitle', e.target.value)} /></div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">Service Cards (4)</p>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
            <p className="text-xs font-semibold text-gray-400">Service {i + 1}</p>
            <div><label className="label-luxury mb-1 block">Title</label>
              <input className="input-luxury" value={item.title} onChange={(e) => setItem(i, 'title', e.target.value)} /></div>
            <div><label className="label-luxury mb-1 block">Description</label>
              <textarea className="input-luxury resize-none" rows={2} value={item.desc} onChange={(e) => setItem(i, 'desc', e.target.value)} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GiftingEditor({ form, set }) {
  const budgets   = form.budgets?.length   ? form.budgets   : DEFAULTS.gifting.budgets;
  const occasions = form.occasions?.length ? form.occasions : DEFAULTS.gifting.occasions;
  const setBudget   = (i, f, v) => set('budgets',   budgets.map((b, j) =>   j === i ? { ...b, [f]: v } : b));
  const setOccasion = (i, f, v) => set('occasions', occasions.map((o, j) => j === i ? { ...o, [f]: v } : o));
  const addOcc = () => set('occasions', [...occasions, { title: '', slug: '' }]);
  const removeOcc = (i) => occasions.length > 1 && set('occasions', occasions.filter((_, j) => j !== i));
  return (
    <div className="space-y-4">
      <div><label className="label-luxury mb-1 block">Main Heading Text</label>
        <input className="input-luxury" value={form.heading || ''} onChange={(e) => set('heading', e.target.value)} placeholder="Gift what lasts beyond the vows." /></div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">Budget Cards (3)</p>
      <div className="space-y-2">
        {budgets.map((b, i) => (
          <div key={i} className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div><label className="label-luxury mb-1 block">Label (e.g. 30K)</label>
              <input className="input-luxury" value={b.label} onChange={(e) => setBudget(i, 'label', e.target.value)} /></div>
            <div><label className="label-luxury mb-1 block">Category Slug</label>
              <input className="input-luxury" value={b.slug} onChange={(e) => setBudget(i, 'slug', e.target.value)} /></div>
          </div>
        ))}
      </div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">Occasion Slides</p>
      <div className="space-y-2">
        {occasions.map((o, i) => (
          <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 items-end">
            <div className="flex-1"><label className="label-luxury mb-1 block">Title</label>
              <input className="input-luxury" value={o.title} onChange={(e) => setOccasion(i, 'title', e.target.value)} /></div>
            <div className="flex-1"><label className="label-luxury mb-1 block">Slug</label>
              <input className="input-luxury" value={o.slug} onChange={(e) => setOccasion(i, 'slug', e.target.value)} /></div>
            <button onClick={() => removeOcc(i)} className="p-2 mb-0.5 text-red-400 hover:text-red-600 flex-shrink-0"><Ic d="M6 18L18 6M6 6l12 12" /></button>
          </div>
        ))}
      </div>
      <button onClick={addOcc} className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-500 hover:border-primary hover:text-primary transition-colors">+ Add Occasion</button>
    </div>
  );
}

function NewsletterEditor({ form, set }) {
  const perks = form.perks?.length ? form.perks : DEFAULTS.newsletter.perks;
  const setPerk = (i, v) => set('perks', perks.map((p, j) => j === i ? { ...p, label: v } : p));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label-luxury mb-1 block">Eyebrow</label>
          <input className="input-luxury" value={form.eyebrow || ''} onChange={(e) => set('eyebrow', e.target.value)} placeholder="Stay Updated" /></div>
        <div><label className="label-luxury mb-1 block">Card Heading</label>
          <input className="input-luxury" value={form.cardHeading || ''} onChange={(e) => set('cardHeading', e.target.value)} placeholder="Join the Inner Circle" /></div>
      </div>
      <div><label className="label-luxury mb-1 block">Main Heading</label>
        <input className="input-luxury" value={form.heading || ''} onChange={(e) => set('heading', e.target.value)} /></div>
      <div><label className="label-luxury mb-1 block">Subtitle</label>
        <textarea className="input-luxury resize-none" rows={2} value={form.subtitle || ''} onChange={(e) => set('subtitle', e.target.value)} /></div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">Perk Bullet Points</p>
      <div className="space-y-2">
        {perks.map((p, i) => (
          <div key={i}><label className="label-luxury mb-1 block">Perk {i + 1}</label>
            <input className="input-luxury" value={p.label} onChange={(e) => setPerk(i, e.target.value)} /></div>
        ))}
      </div>
    </div>
  );
}

function FAQEditor({ form, set }) {
  const categories = form.categories?.length ? form.categories : DEFAULTS.faq.categories;
  const [expandedCat, setExpandedCat] = useState(null);
  const setCatLabel = (ci, v) => set('categories', categories.map((c, i) => i === ci ? { ...c, label: v } : c));
  const setItem = (ci, qi, f, v) => set('categories', categories.map((c, i) => i !== ci ? c : { ...c, items: c.items.map((it, j) => j === qi ? { ...it, [f]: v } : it) }));
  const addItem  = (ci) => set('categories', categories.map((c, i) => i === ci ? { ...c, items: [...c.items, { q: '', a: '' }] } : c));
  const removeItem = (ci, qi) => set('categories', categories.map((c, i) => i === ci ? { ...c, items: c.items.filter((_, j) => j !== qi) } : c));
  const addCat   = () => set('categories', [...categories, { label: 'New Category', items: [{ q: '', a: '' }] }]);
  const removeCat = (ci) => categories.length > 1 && set('categories', categories.filter((_, i) => i !== ci));
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label-luxury mb-1 block">Section Heading</label>
          <input className="input-luxury" value={form.heading || ''} onChange={(e) => set('heading', e.target.value)} /></div>
        <div><label className="label-luxury mb-1 block">Subtitle</label>
          <input className="input-luxury" value={form.subtitle || ''} onChange={(e) => set('subtitle', e.target.value)} /></div>
      </div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-1">FAQ Categories</p>
      <div className="space-y-2">
        {categories.map((cat, ci) => (
          <div key={ci} className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 p-3 bg-gray-50">
              <input className="input-luxury flex-1 text-sm py-1.5" value={cat.label} onChange={(e) => setCatLabel(ci, e.target.value)} />
              <button onClick={() => setExpandedCat(expandedCat === ci ? null : ci)} className="text-xs text-primary font-medium px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors flex-shrink-0">
                {expandedCat === ci ? 'Collapse' : `Edit ${cat.items.length} Q&As`}
              </button>
              {categories.length > 1 && (
                <button onClick={() => removeCat(ci)} className="p-1.5 text-red-400 hover:text-red-600 flex-shrink-0"><Ic d="M6 18L18 6M6 6l12 12" /></button>
              )}
            </div>
            {expandedCat === ci && (
              <div className="p-4 space-y-3">
                {cat.items.map((item, qi) => (
                  <div key={qi} className="p-3 bg-white rounded-xl border border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400">Q{qi + 1}</span>
                      {cat.items.length > 1 && (
                        <button onClick={() => removeItem(ci, qi)} className="text-red-400 hover:text-red-600"><Ic d="M6 18L18 6M6 6l12 12" /></button>
                      )}
                    </div>
                    <div><label className="label-luxury mb-1 block">Question</label>
                      <input className="input-luxury" value={item.q} onChange={(e) => setItem(ci, qi, 'q', e.target.value)} /></div>
                    <div><label className="label-luxury mb-1 block">Answer</label>
                      <textarea className="input-luxury resize-none" rows={2} value={item.a} onChange={(e) => setItem(ci, qi, 'a', e.target.value)} /></div>
                  </div>
                ))}
                <button onClick={() => addItem(ci)} className="w-full py-2 rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-500 hover:border-primary hover:text-primary transition-colors">+ Add Question</button>
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={addCat} className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-500 hover:border-primary hover:text-primary transition-colors">+ Add Category</button>
    </div>
  );
}

function FooterBrandEditor({ form, set }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label-luxury mb-1 block">Brand Name</label>
          <input className="input-luxury" value={form.brandName || ''} onChange={(e) => set('brandName', e.target.value)} placeholder="Luxury Jewelry" /></div>
        <div><label className="label-luxury mb-1 block">Tagline</label>
          <input className="input-luxury" value={form.tagline || ''} onChange={(e) => set('tagline', e.target.value)} placeholder="Luxury. Joy. Comfort." /></div>
      </div>
      <div><label className="label-luxury mb-1 block">About Text</label>
        <textarea className="input-luxury resize-none" rows={3} value={form.about || ''} onChange={(e) => set('about', e.target.value)} placeholder="Premium lab-grown diamond and gold jewelry..." /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label-luxury mb-1 block">Email</label>
          <input className="input-luxury" value={form.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="care@brand.com" /></div>
        <div><label className="label-luxury mb-1 block">Phone</label>
          <input className="input-luxury" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder="+91 9000000000" /></div>
      </div>
      <div><label className="label-luxury mb-1 block">Copyright Text</label>
        <input className="input-luxury" value={form.copyright || ''} onChange={(e) => set('copyright', e.target.value)} placeholder="© 2026 Luxury Jewelry. All Rights Reserved." /></div>
    </div>
  );
}

function FooterSocialEditor({ form, set }) {
  const socials = [
    { key: 'instagram', label: 'Instagram' }, { key: 'facebook', label: 'Facebook' },
    { key: 'youtube',   label: 'YouTube'   }, { key: 'pinterest', label: 'Pinterest' },
    { key: 'linkedin',  label: 'LinkedIn'  },
  ];
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Enter the full URL for each social profile. Leave blank to hide the icon.</p>
      {socials.map(({ key, label }) => (
        <div key={key}><label className="label-luxury mb-1 block">{label} URL</label>
          <input className="input-luxury" value={form[key] || ''} onChange={(e) => set(key, e.target.value)} placeholder={`https://www.${key}.com/yourpage`} /></div>
      ))}
    </div>
  );
}

function FooterLinksEditor({ form, set }) {
  const columns = form.columns?.length ? form.columns : DEFAULTS.footer_links.columns;
  const setCol  = (ci, f, v) => set('columns', columns.map((c, i) => i === ci ? { ...c, [f]: v } : c));
  const setLink = (ci, li, f, v) => set('columns', columns.map((c, i) => i !== ci ? c : { ...c, links: c.links.map((l, j) => j === li ? { ...l, [f]: v } : l) }));
  const addLink = (ci) => set('columns', columns.map((c, i) => i === ci ? { ...c, links: [...c.links, { label: '', to: '' }] } : c));
  const removeLink = (ci, li) => set('columns', columns.map((c, i) => i !== ci ? c : { ...c, links: c.links.filter((_, j) => j !== li) }));
  return (
    <div className="space-y-5">
      {columns.map((col, ci) => (
        <div key={ci} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="mb-3"><label className="label-luxury mb-1 block">Column Heading</label>
            <input className="input-luxury" value={col.heading} onChange={(e) => setCol(ci, 'heading', e.target.value)} /></div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Links</p>
          <div className="space-y-2">
            {col.links.map((link, li) => (
              <div key={li} className="flex gap-2">
                <input className="input-luxury flex-1" value={link.label} onChange={(e) => setLink(ci, li, 'label', e.target.value)} placeholder="Link text" />
                <input className="input-luxury flex-1" value={link.to} onChange={(e) => setLink(ci, li, 'to', e.target.value)} placeholder="/path" />
                {col.links.length > 1 && (
                  <button onClick={() => removeLink(ci, li)} className="p-2 text-red-400 hover:text-red-600 flex-shrink-0"><Ic d="M6 18L18 6M6 6l12 12" /></button>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => addLink(ci)} className="mt-2 btn-outline text-xs px-3 py-1.5">+ Add Link</button>
        </div>
      ))}
    </div>
  );
}

function FooterPaymentEditor({ form, set }) {
  const methods = form.methods?.length ? form.methods : DEFAULTS.footer_payment.methods;
  const setMethod = (i, v) => set('methods', methods.map((m, j) => j === i ? v : m));
  const addMethod = () => set('methods', [...methods, '']);
  const removeMethod = (i) => methods.length > 1 && set('methods', methods.filter((_, j) => j !== i));
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Payment method badge labels shown at the bottom of the footer.</p>
      <div className="space-y-2">
        {methods.map((m, i) => (
          <div key={i} className="flex gap-2">
            <input className="input-luxury flex-1" value={m} onChange={(e) => setMethod(i, e.target.value)} placeholder="e.g. Visa, UPI, Razorpay" />
            {methods.length > 1 && (
              <button onClick={() => removeMethod(i)} className="p-2 text-red-400 hover:text-red-600 flex-shrink-0"><Ic d="M6 18L18 6M6 6l12 12" /></button>
            )}
          </div>
        ))}
      </div>
      <button onClick={addMethod} className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-xs text-gray-500 hover:border-primary hover:text-primary transition-colors">+ Add Method</button>
    </div>
  );
}

// ─── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ sectionKey, sectionPage, data, banners, onClose, onSave, onBannersChange, saving }) {
  const allSections = GROUPS.flatMap((g) => g.sections);
  const meta  = allSections.find((s) => s.key === sectionKey);
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(data || {})));
  const set = (f, v) => setForm((prev) => ({ ...prev, [f]: v }));
  const isHero = sectionKey === 'hero';

  const renderEditor = () => {
    switch (sectionKey) {
      case 'announcement_bar':  return <AnnouncementBarEditor form={form} set={set} />;
      case 'hero':              return <HeroEditor banners={banners} onBannersChange={onBannersChange} />;
      case 'deals':             return <DealsEditor form={form} set={set} />;
      case 'trust_bar':         return <TrustBarEditor form={form} set={set} />;
      case 'why_choose':        return <WhyChooseEditor form={form} set={set} />;
      case 'services':          return <ServicesEditor form={form} set={set} />;
      case 'gifting':           return <GiftingEditor form={form} set={set} />;
      case 'newsletter':        return <NewsletterEditor form={form} set={set} />;
      case 'faq':               return <FAQEditor form={form} set={set} />;
      case 'diamond_cuts':      return <DiamondCutsEditor form={form} set={set} />;
      case 'footer_brand':      return <FooterBrandEditor form={form} set={set} />;
      case 'footer_social':     return <FooterSocialEditor form={form} set={set} />;
      case 'footer_links':      return <FooterLinksEditor form={form} set={set} />;
      case 'footer_payment':    return <FooterPaymentEditor form={form} set={set} />;
      default:                  return <SimpleEditor form={form} set={set} showEyebrow={sectionKey === 'featured_products'} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-heading font-bold text-gray-900">{meta?.label}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{meta?.desc}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors ml-4 flex-shrink-0">
            <Ic d="M6 18L18 6M6 6l12 12" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{renderEditor()}</div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="btn-outline px-5 py-2 text-sm">{isHero ? 'Done' : 'Cancel'}</button>
          {!isHero && (
            <button onClick={() => onSave(sectionKey, sectionPage, form)} disabled={saving} className="btn-primary px-5 py-2 text-sm">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePageEditor() {
  const [sections, setSections] = useState({});
  const [banners,  setBanners]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(null);
  const [editData, setEditData] = useState(null);
  const [editPage, setEditPage] = useState(null);
  const [saving,   setSaving]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [homeRes, globalRes, banRes] = await Promise.all([
        cmsAPI.adminGetSections('home'),
        cmsAPI.adminGetSections('global'),
        cmsAPI.adminGetBanners(),
      ]);
      const byType = {};
      [...(homeRes.data.data || []), ...(globalRes.data.data || [])].forEach((s) => {
        byType[s.sectionType] = { _id: s._id, content: s.content, isActive: s.isActive, page: s.page };
      });
      setSections(byType);
      setBanners((banRes.data.data || []).filter((b) => !b.position || b.position === 'hero'));
    } catch { toast.error('Failed to load'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEdit = (key, page) => {
    const existing = sections[key];
    const content  = existing ? JSON.parse(JSON.stringify(existing.content)) : JSON.parse(JSON.stringify(DEFAULTS[key] || {}));
    setEditing(key); setEditData(content); setEditPage(page);
  };

  const closeEdit = () => { setEditing(null); setEditData(null); setEditPage(null); };

  const saveSection = async (key, page, data) => {
    setSaving(true);
    try {
      const existing = sections[key];
      if (existing?._id) {
        await cmsAPI.updateSection(existing._id, { content: data, isActive: true });
      } else {
        await cmsAPI.createSection({ page, sectionType: key, content: data, isActive: true, sortOrder: 0 });
      }
      toast.success('Saved');
      await load();
      closeEdit();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Save failed';
      toast.error(msg);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-xl font-heading font-bold text-gray-900">Site Content Editor</h1>
        <p className="text-sm text-gray-400 mt-1">Edit all content, images, text and links for your entire website</p>
      </div>

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((g) => (
            <div key={g}>
              <div className="h-6 w-32 rounded shimmer-loading mb-3" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-xl shimmer-loading" />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {GROUPS.map((group) => (
            <div key={group.id}>
              {/* Group header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={group.icon} />
                  </svg>
                </div>
                <h2 className="font-heading font-bold text-gray-800 text-base">{group.label}</h2>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Section cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {group.sections.map(({ key, page, label, desc, icon }) => {
                  const existing = key === 'hero' ? null : sections[key];
                  const heroCount = banners.length;
                  const isCustom  = key === 'hero' ? heroCount > 0 : !!existing;

                  return (
                    <div key={key} className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(90,65,63,0.07)' }}>
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.6}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 text-sm">{label}</p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${isCustom ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                            {key === 'hero' ? `${heroCount} slide${heroCount !== 1 ? 's' : ''}` : isCustom ? 'Saved' : 'Default'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
                      </div>
                      <button onClick={() => openEdit(key, page)} className="flex-shrink-0 btn-primary text-xs px-4 py-2">Edit</button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditModal
          sectionKey={editing}
          sectionPage={editPage}
          data={editData}
          banners={banners}
          onClose={closeEdit}
          onSave={saveSection}
          onBannersChange={load}
          saving={saving}
        />
      )}
    </div>
  );
}
