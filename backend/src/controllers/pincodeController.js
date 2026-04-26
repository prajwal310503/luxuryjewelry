const XLSX = require('xlsx');
const Pincode = require('../models/Pincode');

// Admin: upload Excel/XLS file of serviceable pincodes
exports.uploadPincodes = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const seen = new Set();
    for (const row of rows) {
      for (const cell of row) {
        const str = String(cell ?? '').trim().replace(/\D/g, '');
        if (str.length === 6) seen.add(str);
      }
    }

    if (seen.size === 0) {
      return res.status(400).json({ success: false, message: 'No valid 6-digit pincodes found in the file' });
    }

    const ops = [...seen].map((p) => ({
      updateOne: { filter: { pincode: p }, update: { $set: { pincode: p } }, upsert: true },
    }));
    await Pincode.bulkWrite(ops);

    res.json({ success: true, message: `${seen.size} pincodes uploaded`, count: seen.size });
  } catch (err) {
    console.error('uploadPincodes error:', err);
    res.status(500).json({ success: false, message: 'Failed to process file' });
  }
};

// Public: check if a pincode is serviceable
exports.checkPincode = async (req, res) => {
  try {
    const { pincode } = req.query;
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ success: false, message: 'Enter a valid 6-digit pincode' });
    }

    const total = await Pincode.estimatedDocumentCount();
    if (total === 0) {
      // No pincodes configured yet — treat all as available
      return res.json({ success: true, available: true });
    }

    const found = await Pincode.exists({ pincode });
    res.json({ success: true, available: !!found });
  } catch (err) {
    console.error('checkPincode error:', err);
    res.status(500).json({ success: false, message: 'Error checking pincode' });
  }
};

// Admin: get total count
exports.getPincodeStats = async (req, res) => {
  try {
    const count = await Pincode.countDocuments();
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
};

// Admin: clear all pincodes
exports.clearPincodes = async (req, res) => {
  try {
    await Pincode.deleteMany({});
    res.json({ success: true, message: 'All pincodes cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error clearing pincodes' });
  }
};
