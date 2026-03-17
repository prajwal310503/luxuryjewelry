const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema(
  {
    group: { type: String, required: true, unique: true },
    data:  { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', SettingsSchema);
