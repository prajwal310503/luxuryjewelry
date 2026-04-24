import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cmsAPI } from '../../services/api';

// ─── Social Icons ──────────────────────────────────────────────────────────────
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
  brandName: 'VK Jewellers',
  tagline: 'Luxury. Joy. Comfort.',
  about: 'Premium lab-grown diamond and gold jewelry for every occasion.',
  email: 'care@vkjewellers.com',
  phone: '+91 9004436052',
  copyright: '© 2026 VK Jewellers. All Rights Reserved.',
};
const DEFAULT_SOCIAL  = { instagram: '#', facebook: '#', youtube: '#', pinterest: '#', linkedin: '#' };
const DEFAULT_COLUMNS = [
  { heading: 'About VK Jewellers',  links: [{ label: 'About Our Company', to: '/about' }, { label: 'Terms & Conditions', to: '/terms' }, { label: 'Privacy Policy', to: '/privacy' }, { label: 'Shipping Policy', to: '/shipping' }] },
  { heading: 'Jewelry Guide', links: [{ label: 'Diamond Education', to: '/guides/diamonds' }, { label: 'Metal Education', to: '/guides/metals' }, { label: 'Size Guide', to: '/guides/size' }, { label: 'Jewelry Care Tips', to: '/guides/care' }] },
  { heading: 'Why Choose Us', links: [{ label: '15 Days Return', to: '/policies/return' }, { label: 'Lifetime Exchange', to: '/policies/exchange' }, { label: 'Old Gold Exchange', to: '/old-gold' }, { label: "FAQ's", to: '/faq' }] },
  { heading: 'Sell With Us',  links: [{ label: 'Become a Vendor', to: '/register?role=vendor' }, { label: 'Vendor Guidelines', to: '/vendor-guidelines' }, { label: 'Commission Structure', to: '/commissions' }] },
];
const DEFAULT_PAYMENT = ['Visa', 'Mastercard', 'UPI', 'Razorpay', 'GPay', 'Paytm'];

export default function Footer() {
  const [brand,   setBrand]   = useState(DEFAULT_BRAND);
  const [social,  setSocial]  = useState(DEFAULT_SOCIAL);
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [payment, setPayment] = useState(DEFAULT_PAYMENT);

  useEffect(() => {
    cmsAPI.getPageSections('global').then((res) => {
      const sections = res.data.data || [];
      const byType = {};
      sections.forEach((s) => { byType[s.sectionType] = s.content; });
      if (byType.footer_brand?.brandName) setBrand({ ...DEFAULT_BRAND, ...byType.footer_brand });
      if (byType.footer_social)           setSocial({ ...DEFAULT_SOCIAL, ...byType.footer_social });
      if (byType.footer_links?.columns?.length) setColumns(byType.footer_links.columns);
      if (byType.footer_payment?.methods?.length) setPayment(byType.footer_payment.methods);
    }).catch(() => {});
  }, []);

  const activeSocials = Object.entries(social).filter(([, url]) => url && url !== '#');

  return (
    <footer className="bg-gray-900 text-gray-400">
      {/* Main Footer */}
      <div className="container-luxury py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">

          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="block mb-4">
              <div className="font-heading text-2xl font-bold text-white tracking-tight">
                <span className="block text-xs font-body font-medium text-gray-400 tracking-[0.3em] uppercase leading-tight">
                  {brand.tagline?.split('.')[0] || 'Luxury'}
                </span>
                <span>{brand.brandName?.split(' ')[0] || 'Jewelry'}</span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed mb-3 text-gray-500">{brand.tagline}</p>
            <p className="text-sm leading-relaxed mb-6 text-gray-500">{brand.about}</p>
            {brand.email && <p className="text-sm text-gray-500">{brand.email}</p>}
            {brand.phone && <p className="text-sm text-gray-500">{brand.phone}</p>}

            {/* Social links */}
            {activeSocials.length > 0 && (
              <div className="flex gap-3 mt-4">
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

          {/* Link Columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-5">{col.heading}</h4>
              <ul className="space-y-3">
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

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 py-6">
        <div className="container-luxury flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">{brand.copyright}</p>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {payment.map((method) => (
              <span key={method} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-400 font-medium">
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
