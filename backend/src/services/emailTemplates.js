const BRAND = process.env.FROM_NAME || 'VK Luxury Jewelry';
const PRIMARY = '#5a413f';
const GOLD = '#C9A84C';
const FRONTEND = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

function emailShell({ title, preheader = '', bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <!--[if !mso]><!--><link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"><!--<![endif]-->
</head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f0eb;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(90,65,63,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,${PRIMARY} 0%,#3a2520 100%);padding:28px 32px;text-align:center;">
              <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:700;color:#fff;letter-spacing:0.08em;">${BRAND}</div>
              <div style="margin-top:6px;font-size:11px;color:${GOLD};letter-spacing:0.28em;text-transform:uppercase;">Fine Jewelry</div>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 28px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid #f0e8e2;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">Need help? Reply to this email or visit our support page.</p>
              <a href="${FRONTEND()}" style="font-size:12px;color:${PRIMARY};text-decoration:none;font-weight:600;">Visit ${BRAND}</a>
              <p style="margin:16px 0 0;font-size:11px;color:#c4b5a8;">© ${new Date().getFullYear()} ${BRAND}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(href, label) {
  return `<a href="${href}" style="display:inline-block;background:${PRIMARY};color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;letter-spacing:0.02em;">${label}</a>`;
}

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

module.exports = { emailShell, ctaButton, money, BRAND, FRONTEND, PRIMARY, GOLD };
