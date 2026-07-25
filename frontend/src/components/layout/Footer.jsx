import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cmsAPI } from '../../services/api';
import vkLogo from '../../assets/vklogo.png';

const SOCIAL_ICONS = {
  instagram: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
  facebook: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  youtube: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
    </svg>
  ),
  pinterest: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  ),
  linkedin: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
};

const DEFAULT_BRAND = {
  brandName: 'LUXURY JEWELRY',
  legalName: 'SHRI VENKATESHWARA ENTERPRISES',
  tagline: 'Luxury. Joy. Comfort.',
  about: 'Premium lab-grown diamond and gold jewelry for every occasion.',
  email: 'care@luxuryjewelry.com',
  phone: '+91 9004436052',
  gst: '27AFCPR0683K1Z4',
  address: 'Gala No-D 24, R S No 657, Y P Powar Nagar,\nKolhapur Udyam Co Op Society,\nKolhapur – 416008, Maharashtra',
  copyright: '© 2026 LUXURY JEWELRY. All Rights Reserved.',
};

const DEFAULT_SOCIAL = { instagram: '#', facebook: '#', youtube: '#', pinterest: '#', linkedin: '#' };

/** Only real app routes — no dead /guides or /policies links */
const DEFAULT_COLUMNS = [
  {
    heading: 'Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Contact & Support', to: '/support' },
      { label: "FAQ's", to: '/faq' },
    ],
  },
  {
    heading: 'Policies',
    links: [
      { label: 'Terms & Conditions', to: '/terms' },
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Shipping Policy', to: '/shipping' },
    ],
  },
  {
    heading: 'Sell With Us',
    links: [
      { label: 'Become a Seller', to: '/become-a-seller' },
      { label: 'Vendor Registration', to: '/vendor/register' },
    ],
  },
];

const DEFAULT_PAYMENT = ['Visa', 'Mastercard', 'UPI', 'Razorpay', 'GPay', 'Paytm'];

/** Drop CMS columns that only contain dead paths */
const LIVE_PATH_RE = /^\/(about|faq|terms|privacy|shipping|support|become-a-seller|vendor\/register|orders|account|collections)/;

function sanitizeColumns(cols) {
  if (!Array.isArray(cols) || !cols.length) return DEFAULT_COLUMNS;
  const cleaned = cols
    .map((col) => ({
      ...col,
      links: (col.links || []).filter((l) => l?.to && LIVE_PATH_RE.test(String(l.to).split('?')[0])),
    }))
    .filter((col) => col.links?.length);
  return cleaned.length ? cleaned : DEFAULT_COLUMNS;
}

export default function Footer() {
  const [brand, setBrand] = useState(DEFAULT_BRAND);
  const [social, setSocial] = useState(DEFAULT_SOCIAL);
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [payment, setPayment] = useState(DEFAULT_PAYMENT);

  useEffect(() => {
    cmsAPI.getPageSections('global').then((res) => {
      const sections = res.data.data || [];
      const byType = {};
      sections.forEach((s) => { byType[s.sectionType] = s.content; });
      if (byType.footer_brand?.brandName) setBrand({ ...DEFAULT_BRAND, ...byType.footer_brand });
      if (byType.footer_social) setSocial({ ...DEFAULT_SOCIAL, ...byType.footer_social });
      if (byType.footer_links?.columns?.length) setColumns(sanitizeColumns(byType.footer_links.columns));
      if (byType.footer_payment?.methods?.length) setPayment(byType.footer_payment.methods);
    }).catch(() => {});
  }, []);

  const activeSocials = Object.entries(social).filter(([, url]) => url && url !== '#');

  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="container-luxury py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="space-y-4 text-center sm:text-left flex flex-col items-center sm:items-start">
            <Link to="/" className="inline-block">
              <img src={vkLogo} alt="LUXURY JEWELRY" className="h-16 sm:h-20 w-auto object-contain mx-auto sm:mx-0" />
            </Link>

            <div>
              <p className="text-white text-xs font-semibold uppercase tracking-widest mb-0.5">{brand.legalName}</p>
              <p className="text-sm text-gray-500">{brand.tagline}</p>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed max-w-xs mx-auto sm:mx-0">{brand.about}</p>
            </div>

            {brand.address && (
              <div className="max-w-xs">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Registered Address</p>
                <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">{brand.address}</p>
              </div>
            )}

            <div className="space-y-1.5">
              {brand.email && (
                <a href={`mailto:${brand.email}`} className="flex items-center justify-center sm:justify-start gap-2 text-xs text-gray-500 hover:text-gold transition-colors">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {brand.email}
                </a>
              )}
              {brand.phone && (
                <a href={`tel:${brand.phone}`} className="flex items-center justify-center sm:justify-start gap-2 text-xs text-gray-500 hover:text-gold transition-colors">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {brand.phone}
                </a>
              )}
            </div>

            {brand.gst && (
              <div className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-gray-800 rounded-lg border border-gray-700">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">GST</span>
                <span className="text-xs font-mono text-gray-300 tracking-wider">{brand.gst}</span>
              </div>
            )}

            {activeSocials.length > 0 && (
              <div className="flex gap-3 justify-center sm:justify-start">
                {activeSocials.map(([key, url]) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all duration-200"
                  >
                    <span className="sr-only">{key}</span>
                    {SOCIAL_ICONS[key] || <span className="w-4 h-4 rounded-full bg-gray-400" />}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.heading} className="text-center sm:text-left">
              <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">{col.heading}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-gray-500 hover:text-gold transition-colors duration-150">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-800 py-5">
        <div className="container-luxury">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="text-center md:text-left">
              <p className="text-xs text-gray-600">{brand.copyright}</p>
              {brand.legalName && (
                <p className="text-[11px] text-gray-700 mt-0.5">
                  {brand.legalName}
                  {brand.gst && (
                    <span className="ml-2">· GSTIN: <span className="font-mono tracking-wider">{brand.gst}</span></span>
                  )}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {payment.map((method) => (
                <span key={method} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400 font-medium">
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
