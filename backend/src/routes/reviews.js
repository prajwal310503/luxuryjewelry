const express = require('express');
const router  = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const Review  = require('../models/Review');
const { uploadProduct, getFileUrl } = require('../config/cloudinary');
const { sendSuccess, sendError, sendPaginated } = require('../utils/response');

// GET reviews for a product
router.get('/product/:productId', optionalAuth, async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const filter = { product: req.params.productId, isApproved: true };
    const total  = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .populate('user', 'name avatar')
      .skip(skip).limit(limit).sort('-createdAt');

    sendPaginated(res, reviews, page, limit, total);
  } catch (error) { next(error); }
});

// POST create review (with optional photos)
router.post('/', protect, uploadProduct.array('photos', 5), async (req, res, next) => {
  try {
    const { product, rating, title, comment, order } = req.body;

    const existing = await Review.findOne({ product, user: req.user.id });
    if (existing) return sendError(res, 400, 'You have already reviewed this product');

    const images = (req.files || []).map((f) => ({
      url:      getFileUrl(f),
      publicId: f.filename || f.public_id || '',
    }));

    const review = await Review.create({
      product,
      user: req.user.id,
      order,
      rating: parseInt(rating),
      title,
      comment,
      images,
      isVerifiedPurchase: !!order,
      isApproved: true,
    });

    const populated = await Review.findById(review._id).populate('user', 'name avatar');
    sendSuccess(res, 201, 'Review submitted successfully', populated);
  } catch (error) { next(error); }
});

// PUT update review
router.put('/:id', protect, async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, user: req.user.id });
    if (!review) return sendError(res, 404, 'Review not found');
    const { rating, title, comment } = req.body;
    Object.assign(review, { rating, title, comment, isApproved: true });
    await review.save();
    sendSuccess(res, 200, 'Review updated', review);
  } catch (error) { next(error); }
});

// DELETE review
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, user: req.user.id });
    if (!review) return sendError(res, 404, 'Review not found');
    await review.deleteOne();
    sendSuccess(res, 200, 'Review deleted');
  } catch (error) { next(error); }
});

module.exports = router;
