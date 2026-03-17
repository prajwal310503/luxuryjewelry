class APIFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  filter() {
    const queryObj = { ...this.queryStr };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Advanced filtering with operators
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|ne|in|nin)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  search(fields = ['title']) {
    if (this.queryStr.search) {
      const searchRegex = new RegExp(this.queryStr.search, 'i');
      const searchConditions = fields.map((field) => ({ [field]: searchRegex }));
      this.query = this.query.find({ $or: searchConditions });
    }
    return this;
  }

  sort() {
    if (this.queryStr.sort) {
      const sortBy = this.queryStr.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryStr.fields) {
      const fields = this.queryStr.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate(defaultLimit = 20) {
    const page = parseInt(this.queryStr.page, 10) || 1;
    const limit = parseInt(this.queryStr.limit, 10) || defaultLimit;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    this.page = page;
    this.limit = limit;
    return this;
  }

  priceRange() {
    if (this.queryStr.minPrice || this.queryStr.maxPrice) {
      const priceFilter = {};
      if (this.queryStr.minPrice) priceFilter.$gte = parseInt(this.queryStr.minPrice);
      if (this.queryStr.maxPrice) priceFilter.$lte = parseInt(this.queryStr.maxPrice);
      this.query = this.query.find({ price: priceFilter });
    }
    return this;
  }
}

module.exports = APIFeatures;
