const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAttributes,
  getAttribute,
  createAttribute,
  updateAttribute,
  deleteAttribute,
  createAttributeValue,
  updateAttributeValue,
  deleteAttributeValue,
  bulkCreateAttributeValues,
} = require('../controllers/attributeController');

// Public
router.get('/', getAttributes);
router.get('/:id', getAttribute);

// Admin
router.post('/', protect, authorize('admin'), createAttribute);
router.put('/:id', protect, authorize('admin'), updateAttribute);
router.delete('/:id', protect, authorize('admin'), deleteAttribute);
router.post('/:id/values', protect, authorize('admin'), createAttributeValue);
router.put('/:id/values/:valueId', protect, authorize('admin'), updateAttributeValue);
router.delete('/:id/values/:valueId', protect, authorize('admin'), deleteAttributeValue);
router.post('/:id/values/bulk', protect, authorize('admin'), bulkCreateAttributeValues);

module.exports = router;
