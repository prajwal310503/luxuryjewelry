const mongoose = require('mongoose');

const PincodeSchema = new mongoose.Schema({
  pincode: { type: String, required: true, unique: true, index: true },
});

module.exports = mongoose.model('Pincode', PincodeSchema);
