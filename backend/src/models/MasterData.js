const mongoose = require('mongoose');

const MasterDataSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    metalRates: {
      gold:     { p999: Number, p916: Number, p750: Number, p585: Number },
      silver:   { p999: Number, p925: Number, p800: Number },
      roseGold: { p750: Number, p585: Number },
      platinum: { p950: Number, p900: Number },
    },
    diamondGrades: {
      labGrown: mongoose.Schema.Types.Mixed,
      natural:  mongoose.Schema.Types.Mixed,
    },
    gemstones: [{ name: String, perCarat: Number, color: String }],
    priceFormula: {
      gstPct: { type: Number, default: 3 },
      description: {
        type: String,
        default: 'Selling Price = (Metal Weight × Rate × Purity%) + Making Charges + Stone Cost + GST',
      },
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MasterData', MasterDataSchema);
