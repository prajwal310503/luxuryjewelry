import { Helmet } from 'react-helmet-async';

const PAGES = {
  about: {
    title: 'About Us',
    content: `VK Jewellers is a multi-vendor jewellery marketplace connecting India's finest jewellery shops with customers nationwide. We curate certified gold, diamond, and gemstone pieces from trusted artisans and established brands.

Our platform combines traditional craftsmanship with modern convenience — browse hundreds of shops, compare designs, and checkout securely from one place.`,
  },
  contact: {
    title: 'Contact Us',
    content: null,
    showForm: true,
    email: 'care@vkjewellers.com',
    phone: '+91 9004436052',
    address: 'Mumbai, Maharashtra, India',
    mapEmbed: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.697348078887!2d72.8776559!3d19.0759837!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c6306644edc1%3A0x5da249ed825e6e79!2sMumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin',
  },
  privacy: {
    title: 'Privacy Policy',
    content: `We collect information you provide when registering, placing orders, or contacting us. This includes name, email, phone, and shipping address.

We use your data to process orders, improve our services, and send transactional communications. We do not sell your personal information to third parties.

Payment data is processed securely through Razorpay. We retain order history as required for legal and accounting purposes.`,
  },
  terms: {
    title: 'Terms & Conditions',
    content: `By using VK Jewellers marketplace you agree to these terms. Each vendor is responsible for their listed products, pricing accuracy, and order fulfillment.

Orders are subject to availability. Returns and exchanges follow individual shop policies and platform guidelines. Commission is deducted from vendor payouts as agreed during onboarding.`,
  },
  faq: {
    title: 'FAQ',
    faqs: [
      { q: 'How does multi-vendor checkout work?', a: 'Add items from any shop to one cart. At checkout, we split your order by shop — each vendor fulfills their portion separately.' },
      { q: 'Are products certified?', a: 'Vendors list BIS-hallmarked gold and IGI/GIA certified diamonds where applicable. Check product details for certification info.' },
      { q: 'How do I track my order?', a: 'Go to My Orders — each shop order shows its own status and tracking when shipped.' },
      { q: 'Can I apply a coupon?', a: 'Enter your code at checkout. Platform and shop-specific coupons may apply.' },
    ],
  },
  shipping: {
    title: 'Shipping Policy',
    content: `Standard delivery takes 5–10 business days depending on the vendor and your location. Insured shipping is available on high-value orders. Each shop may have specific shipping timelines shown on product pages.`,
  },
};

export default function StaticPage({ pageKey }) {
  const page = PAGES[pageKey] || PAGES.about;

  return (
    <>
      <Helmet><title>{page.title} | VK Jewellers</title></Helmet>
      <div className="container-luxury py-12 max-w-3xl">
        <h1 className="font-heading text-3xl font-bold text-gray-900 mb-6">{page.title}</h1>

        {page.content && (
          <div className="prose prose-sm text-gray-600 whitespace-pre-line leading-relaxed">{page.content}</div>
        )}

        {page.faqs && (
          <div className="space-y-4 mt-4">
            {page.faqs.map((f) => (
              <div key={f.q} className="card-luxury p-5">
                <h3 className="font-semibold text-gray-900 mb-2">{f.q}</h3>
                <p className="text-sm text-gray-600">{f.a}</p>
              </div>
            ))}
          </div>
        )}

        {page.showForm && (
          <div className="grid md:grid-cols-2 gap-8 mt-6">
            <div className="space-y-4 text-sm text-gray-600">
              <p><strong>Email:</strong> {page.email}</p>
              <p><strong>Phone:</strong> {page.phone}</p>
              <p><strong>Address:</strong> {page.address}</p>
              <form className="space-y-3 mt-6" onSubmit={(e) => { e.preventDefault(); alert('Thank you! We will get back to you soon.'); }}>
                <input className="input-luxury w-full" placeholder="Your name" required />
                <input className="input-luxury w-full" type="email" placeholder="Email" required />
                <textarea className="input-luxury w-full resize-none" rows={4} placeholder="Message" required />
                <button type="submit" className="btn-primary">Send Inquiry</button>
              </form>
            </div>
            {page.mapEmbed && (
              <iframe title="Map" src={page.mapEmbed} className="w-full h-64 md:h-full min-h-[280px] rounded-xl border border-gray-100" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            )}
          </div>
        )}
      </div>
    </>
  );
}

export { PAGES };
