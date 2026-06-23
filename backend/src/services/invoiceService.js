const PDFDocument = require('pdfkit');

function generateInvoiceBuffer(order, customer) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).fillColor('#5a413f').text('VK JEWELLERS', { align: 'center' });
    doc.fontSize(10).fillColor('#666').text('Tax Invoice', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10).fillColor('#000');
    doc.text(`Invoice #: ${order.orderNumber}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`);
    if (order.storeName) doc.text(`Shop: ${order.storeName}`);
    doc.moveDown();

    doc.text('Bill To:', { underline: true });
    doc.text(customer?.name || order.shippingAddress?.fullName || 'Customer');
    doc.text(order.shippingAddress?.addressLine1 || '');
    if (order.shippingAddress?.addressLine2) doc.text(order.shippingAddress.addressLine2);
    doc.text(`${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}`);
    doc.text(`Phone: ${order.shippingAddress?.phone || customer?.phone || ''}`);
    doc.moveDown();

    const tableTop = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Item', 50, tableTop);
    doc.text('Qty', 280, tableTop);
    doc.text('Price', 330, tableTop);
    doc.text('Amount', 420, tableTop);
    doc.font('Helvetica');

    let y = tableTop + 18;
    (order.items || []).forEach((item) => {
      doc.text(String(item.title || '').slice(0, 40), 50, y);
      doc.text(String(item.quantity), 280, y);
      doc.text(`₹${Math.round(item.price).toLocaleString('en-IN')}`, 330, y);
      doc.text(`₹${Math.round(item.subtotal || item.price * item.quantity).toLocaleString('en-IN')}`, 420, y);
      y += 20;
    });

    doc.moveDown(2);
    y = doc.y;
    doc.text(`Subtotal: ₹${Math.round(order.subtotal).toLocaleString('en-IN')}`, 330, y);
    if (order.couponDiscount > 0) {
      y += 16;
      doc.text(`Coupon (${order.couponCode}): -₹${Math.round(order.couponDiscount).toLocaleString('en-IN')}`, 330, y);
    }
    if (order.shippingCost > 0) {
      y += 16;
      doc.text(`Shipping: ₹${Math.round(order.shippingCost).toLocaleString('en-IN')}`, 330, y);
    }
    y += 16;
    doc.font('Helvetica-Bold').text(`Total: ₹${Math.round(order.total).toLocaleString('en-IN')}`, 330, y);
    doc.font('Helvetica');

    doc.moveDown(3);
    doc.fontSize(9).fillColor('#888').text('Thank you for shopping with VK Jewellers!', { align: 'center' });

    doc.end();
  });
}

module.exports = { generateInvoiceBuffer };
