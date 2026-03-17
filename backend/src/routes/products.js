const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadProduct } = require('../config/cloudinary');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
  vendorGetProducts,
} = require('../controllers/productController');

// Public
router.get('/', getProducts);
router.get('/:slug', getProduct);

// Vendor
router.post('/', protect, authorize('vendor'), createProduct);
router.put('/:id', protect, authorize('vendor'), updateProduct);
router.delete('/:id', protect, authorize('vendor'), deleteProduct);
router.post('/:id/images', protect, authorize('vendor'), uploadProduct.array('images', 10), uploadProductImages);
router.get('/vendor/my', protect, authorize('vendor'), vendorGetProducts);

module.exports = router;
