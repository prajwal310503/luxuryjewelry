function getRemainingAmount(order) {
  if (!order?.payment || order.payment.status !== 'partial') return 0;
  const paid = order.payment.amount || 0;
  return Math.max(0, (order.total || 0) - paid);
}

function enrichOrderPayment(order) {
  const doc = order?.toObject ? order.toObject({ virtuals: true }) : { ...order };
  const remaining = getRemainingAmount(doc);
  doc.paymentDue = remaining > 0;
  doc.remainingAmount = remaining;
  if (doc.payment) {
    doc.payment.remainingAmount = remaining;
  }
  return doc;
}

function assertCanDispatch(order) {
  if (order?.payment?.status === 'partial') {
    const remaining = getRemainingAmount(order);
    return {
      allowed: false,
      message: `Cannot dispatch — remaining payment of ₹${remaining.toLocaleString('en-IN')} pending. Customer must pay 50% balance first.`,
    };
  }
  return { allowed: true };
}

module.exports = { getRemainingAmount, enrichOrderPayment, assertCanDispatch };
