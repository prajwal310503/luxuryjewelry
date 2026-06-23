const crypto = require('crypto');
const MasterData = require('../models/MasterData');
const Product = require('../models/Product');
const Store = require('../models/Store');
const PriceSyncLog = require('../models/PriceSyncLog');

const PURITY_MAP = {
  '24kt': 1, '24k': 1, '999': 1, 'p999': 1,
  '22kt': 0.916, '22k': 0.916, '916': 0.916, 'p916': 0.916,
  '18kt': 0.75, '18k': 0.75, '750': 0.75, 'p750': 0.75,
  '14kt': 0.585, '14k': 0.585, '585': 0.585, 'p585': 0.585,
  '925': 0.925, 'p925': 0.925,
  '800': 0.8, 'p800': 0.8,
  '950': 0.95, 'p950': 0.95,
  '900': 0.9, 'p900': 0.9,
};

function detectMetalKey(metalType = '') {
  const m = metalType.toLowerCase();
  if (m.includes('platinum')) return 'platinum';
  if (m.includes('rose')) return 'roseGold';
  if (m.includes('silver')) return 'silver';
  return 'gold';
}

function detectPurityKey(purity = '', metalKey) {
  const p = String(purity).toLowerCase().replace(/\s/g, '');
  for (const [key, val] of Object.entries(PURITY_MAP)) {
    if (p.includes(key)) return { key, factor: val };
  }
  if (metalKey === 'silver') return { key: 'p925', factor: 0.925 };
  if (metalKey === 'platinum') return { key: 'p950', factor: 0.95 };
  return { key: 'p916', factor: 0.916 };
}

function getMetalRate(metalRates, metalKey, purityKey) {
  const rates = metalRates?.[metalKey] || {};
  return rates[purityKey] || rates.p916 || rates.p925 || rates.p950 || 0;
}

function getMakingCharge(store, categorySlug, weightGrams) {
  const charges = store?.makingCharges || [];
  const match = charges.find((c) => c.category === categorySlug)
    || charges.find((c) => c.category === '*')
    || charges[0];
  if (!match || !match.value) return 0;
  if (match.type === 'percent') {
    return 0; // applied as % on metal amount in caller if needed
  }
  return (match.value || 0) * (weightGrams || 1);
}

async function getOrCreateMasterData() {
  let doc = await MasterData.findOne({ key: 'global' });
  if (!doc) {
    doc = await MasterData.create({ key: 'global', metalRates: {}, gemstones: [], diamondGrades: {} });
  }
  return doc;
}

function calculateProductPrice(product, store, masterData) {
  const pb = product.priceBreakup || {};
  const weight = pb.netWeight || pb.grossWeight || product.metalWeight || 1;
  const metalType = pb.metalType || product.purity || '22kt';
  const metalKey = detectMetalKey(metalType);
  const { key: purityKey, factor } = detectPurityKey(product.purity || metalType, metalKey);
  const rate = getMetalRate(masterData.metalRates, metalKey, purityKey);
  const metalAmount = weight * rate * factor;
  const stoneCost = (pb.diamondAmount || 0) + (pb.stoneCost || 0);
  let making = pb.makingCharges || 0;
  if (!making && store) {
    making = getMakingCharge(store, product.category?.slug, weight);
  }
  const subtotal = metalAmount + stoneCost + making;
  const gstPct = masterData.priceFormula?.gstPct ?? 3;
  const gst = (subtotal * gstPct) / 100;
  return Math.round(subtotal + gst);
}

async function syncAllProductPrices(userId) {
  const start = Date.now();
  const masterData = await getOrCreateMasterData();
  const products = await Product.find({ isActive: true, status: { $in: ['approved', 'pending'] } })
    .populate('category', 'slug name')
    .populate('store');

  const storeCache = {};
  let updated = 0;
  const sampleChanges = [];

  for (const product of products) {
    const storeId = product.store?._id || product.store;
    let store = product.store;
    if (storeId && !store?.makingCharges) {
      if (!storeCache[storeId]) storeCache[storeId] = await Store.findById(storeId);
      store = storeCache[storeId];
    }

    const oldPrice = product.price;
    const newPrice = calculateProductPrice(product, store, masterData);
    if (!newPrice || newPrice <= 0) continue;

    if (Math.abs(newPrice - oldPrice) >= 1) {
      product.price = newPrice;
      if (product.priceBreakup) {
        product.priceBreakup.metalRate = getMetalRate(
          masterData.metalRates,
          detectMetalKey(product.priceBreakup.metalType || ''),
          detectPurityKey(product.purity || '', detectMetalKey(product.priceBreakup.metalType || '')).key
        );
        product.priceBreakup.metalAmount = Math.round(newPrice * 0.7);
        product.priceBreakup.makingCharges = product.priceBreakup.makingCharges || getMakingCharge(store, product.category?.slug, product.metalWeight);
      }
      await product.save({ validateBeforeSave: false });
      updated++;
      if (sampleChanges.length < 20) {
        sampleChanges.push({
          productId: product._id,
          productTitle: product.title,
          oldPrice,
          newPrice,
          storeName: store?.name || 'Platform',
        });
      }
    }
  }

  const storesAffected = new Set(products.filter((p) => p.store).map((p) => String(p.store?._id || p.store))).size;

  const log = await PriceSyncLog.create({
    triggeredBy: userId,
    productsUpdated: updated,
    storesAffected,
    sampleChanges,
    status: 'success',
    durationMs: Date.now() - start,
  });

  return { updated, storesAffected, log, sampleChanges };
}

module.exports = {
  getOrCreateMasterData,
  calculateProductPrice,
  syncAllProductPrices,
  PURITY_MAP,
};
