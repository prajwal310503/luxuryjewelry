const Attribute = require('../models/Attribute');
const AttributeValue = require('../models/AttributeValue');
const { sendSuccess, sendError } = require('../utils/response');

// @desc    Get all attributes with values
// @route   GET /api/attributes
// @access  Public
exports.getAttributes = async (req, res, next) => {
  try {
    const filter = { isVisible: true };
    if (req.query.filterable) filter.isFilterable = true;
    if (req.query.group) filter.group = req.query.group;

    const attributes = await Attribute.find(filter).sort('sortOrder');

    const attributesWithValues = await Promise.all(
      attributes.map(async (attr) => {
        const values = await AttributeValue.find({ attribute: attr._id, isActive: true }).sort('sortOrder');
        return { ...attr.toObject(), values };
      })
    );

    sendSuccess(res, 200, 'Attributes fetched', attributesWithValues);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single attribute
// @route   GET /api/attributes/:id
// @access  Public
exports.getAttribute = async (req, res, next) => {
  try {
    const attribute = await Attribute.findById(req.params.id);
    if (!attribute) return sendError(res, 404, 'Attribute not found');

    const values = await AttributeValue.find({ attribute: attribute._id, isActive: true }).sort('sortOrder');

    sendSuccess(res, 200, 'Attribute fetched', { ...attribute.toObject(), values });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create attribute
// @route   POST /api/admin/attributes
// @access  Admin
exports.createAttribute = async (req, res, next) => {
  try {
    const attribute = await Attribute.create(req.body);
    sendSuccess(res, 201, 'Attribute created', attribute);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update attribute
// @route   PUT /api/admin/attributes/:id
// @access  Admin
exports.updateAttribute = async (req, res, next) => {
  try {
    const attribute = await Attribute.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!attribute) return sendError(res, 404, 'Attribute not found');
    sendSuccess(res, 200, 'Attribute updated', attribute);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete attribute
// @route   DELETE /api/admin/attributes/:id
// @access  Admin
exports.deleteAttribute = async (req, res, next) => {
  try {
    const attribute = await Attribute.findByIdAndDelete(req.params.id);
    if (!attribute) return sendError(res, 404, 'Attribute not found');

    await AttributeValue.deleteMany({ attribute: req.params.id });

    sendSuccess(res, 200, 'Attribute deleted');
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create attribute value
// @route   POST /api/admin/attributes/:id/values
// @access  Admin
exports.createAttributeValue = async (req, res, next) => {
  try {
    const attribute = await Attribute.findById(req.params.id);
    if (!attribute) return sendError(res, 404, 'Attribute not found');

    const value = await AttributeValue.create({ ...req.body, attribute: req.params.id });
    sendSuccess(res, 201, 'Attribute value created', value);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update attribute value
// @route   PUT /api/admin/attributes/:id/values/:valueId
// @access  Admin
exports.updateAttributeValue = async (req, res, next) => {
  try {
    const value = await AttributeValue.findOneAndUpdate(
      { _id: req.params.valueId, attribute: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!value) return sendError(res, 404, 'Attribute value not found');
    sendSuccess(res, 200, 'Attribute value updated', value);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete attribute value
// @route   DELETE /api/admin/attributes/:id/values/:valueId
// @access  Admin
exports.deleteAttributeValue = async (req, res, next) => {
  try {
    const value = await AttributeValue.findOneAndDelete({ _id: req.params.valueId, attribute: req.params.id });
    if (!value) return sendError(res, 404, 'Attribute value not found');
    sendSuccess(res, 200, 'Attribute value deleted');
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Bulk create attribute values
// @route   POST /api/admin/attributes/:id/values/bulk
// @access  Admin
exports.bulkCreateAttributeValues = async (req, res, next) => {
  try {
    const { values } = req.body;
    if (!Array.isArray(values) || values.length === 0) {
      return sendError(res, 400, 'Values array is required');
    }

    const attribute = await Attribute.findById(req.params.id);
    if (!attribute) return sendError(res, 404, 'Attribute not found');

    const docs = values.map((v) => ({ ...v, attribute: req.params.id }));
    const created = await AttributeValue.insertMany(docs, { ordered: false });

    sendSuccess(res, 201, `${created.length} values created`, created);
  } catch (error) {
    next(error);
  }
};
