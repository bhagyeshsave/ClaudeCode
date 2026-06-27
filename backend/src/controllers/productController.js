const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const { Product, Category } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, buildPagination } = require('../utils/response');
const { parsePagination } = require('../utils/pagination');
const { PRODUCT_IMAGES_DIR } = require('../config/paths');

const ALLOWED_SORT_FIELDS = new Set(['price', 'createdAt']);

function serializeProduct(product) {
  const plain = product.get({ plain: true });
  return {
    id: plain.id,
    uniqueId: plain.uniqueId,
    name: plain.name,
    image: plain.image,
    price: plain.price,
    category: plain.Category
      ? { id: plain.Category.id, uniqueId: plain.Category.uniqueId, name: plain.Category.name }
      : null,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
}

function imagePathToPublicUrl(filename) {
  if (!filename) return null;
  return `/uploads/products/${filename}`;
}

const listProducts = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { search, categoryId } = req.query;

  let sortBy = req.query.sortBy;
  let sortOrder = (req.query.sortOrder || '').toLowerCase();

  if (!ALLOWED_SORT_FIELDS.has(sortBy)) {
    sortBy = 'createdAt';
  }
  if (sortOrder !== 'asc' && sortOrder !== 'desc') {
    sortOrder = sortBy === 'createdAt' ? 'desc' : 'asc';
  }

  const where = {};
  if (categoryId) {
    where.categoryId = categoryId;
  }

  const include = [
    {
      model: Category,
      required: true,
    },
  ];

  if (search) {
    const term = `%${search}%`;
    where[Op.or] = [{ name: { [Op.iLike]: term } }, { '$Category.name$': { [Op.iLike]: term } }];
  }

  const { rows, count } = await Product.findAndCountAll({
    where,
    include,
    limit,
    offset,
    order: [[sortBy, sortOrder.toUpperCase()]],
    distinct: true,
  });

  return sendSuccess(res, {
    message: 'Products retrieved successfully',
    data: rows.map(serializeProduct),
    pagination: buildPagination(page, limit, count),
  });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id, { include: [{ model: Category }] });
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  return sendSuccess(res, { message: 'Product retrieved successfully', data: serializeProduct(product) });
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, price, categoryId } = req.body;

  const category = await Category.findByPk(categoryId);
  if (!category) {
    if (req.file) fs.unlink(req.file.path, () => {});
    throw new ApiError(400, 'Invalid categoryId: category does not exist');
  }

  const product = await Product.create({
    name,
    price,
    categoryId,
    image: req.file ? imagePathToPublicUrl(req.file.filename) : null,
  });

  const created = await Product.findByPk(product.id, { include: [{ model: Category }] });

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Product created successfully',
    data: serializeProduct(created),
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) {
    if (req.file) fs.unlink(req.file.path, () => {});
    throw new ApiError(404, 'Product not found');
  }

  const { name, price, categoryId } = req.body;

  if (categoryId) {
    const category = await Category.findByPk(categoryId);
    if (!category) {
      if (req.file) fs.unlink(req.file.path, () => {});
      throw new ApiError(400, 'Invalid categoryId: category does not exist');
    }
    product.categoryId = categoryId;
  }

  if (name) product.name = name;
  if (price !== undefined) product.price = price;

  if (req.file) {
    const previousImage = product.image;
    product.image = imagePathToPublicUrl(req.file.filename);

    if (previousImage) {
      const previousFilename = path.basename(previousImage);
      const previousPath = path.join(PRODUCT_IMAGES_DIR, previousFilename);
      fs.unlink(previousPath, () => {});
    }
  }

  await product.save();

  const updated = await Product.findByPk(product.id, { include: [{ model: Category }] });

  return sendSuccess(res, { message: 'Product updated successfully', data: serializeProduct(updated) });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (product.image) {
    const filename = path.basename(product.image);
    const imagePath = path.join(PRODUCT_IMAGES_DIR, filename);
    fs.unlink(imagePath, () => {});
  }

  await product.destroy();
  return res.status(204).send();
});

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  serializeProduct,
};
