const MasterData = require('../models/MasterData');
const PriceSyncLog = require('../models/PriceSyncLog');
const { getOrCreateMasterData, syncAllProductPrices } = require('../services/priceSyncService');
const { sendSuccess, sendError } = require('../utils/response');

exports.getMasterData = async (req, res, next) => {
  try {
    const data = await getOrCreateMasterData();
    sendSuccess(res, 200, 'Master data fetched', data);
  } catch (error) {
    next(error);
  }
};

exports.updateMasterData = async (req, res, next) => {
  try {
    const { metalRates, diamondGrades, gemstones, priceFormula } = req.body;
    const data = await MasterData.findOneAndUpdate(
      { key: 'global' },
      {
        ...(metalRates && { metalRates }),
        ...(diamondGrades && { diamondGrades }),
        ...(gemstones && { gemstones }),
        ...(priceFormula && { priceFormula }),
        updatedBy: req.user.id,
      },
      { new: true, upsert: true, runValidators: true }
    );
    sendSuccess(res, 200, 'Master data saved', data);
  } catch (error) {
    next(error);
  }
};

exports.syncPrices = async (req, res, next) => {
  try {
    const result = await syncAllProductPrices(req.user.id);
    sendSuccess(res, 200, `Synced ${result.updated} products`, result);
  } catch (error) {
    next(error);
  }
};

exports.getSyncLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      PriceSyncLog.find().sort('-createdAt').skip(skip).limit(limit).populate('triggeredBy', 'name email'),
      PriceSyncLog.countDocuments(),
    ]);
    sendSuccess(res, 200, 'Sync logs fetched', { logs, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    next(error);
  }
};
