const { Op } = require('sequelize');
const { Category, Product } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, buildPagination } = require('../utils/response');
const { parsePagination } = require('../utils/pagination');

const listCategories = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { search } = req.query;

  const where = {};
  if (search) {
    where.name = { [Op.iLike]: `%${search}%` };
  }

  const { rows, count } = await Category.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return sendSuccess(res, {
    message: 'Categories retrieved successfully',
    data: rows,
    pagination: buildPagination(page, limit, count),
  });
});

const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  return sendSuccess(res, { message: 'Category retrieved successfully', data: category });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const category = await Category.create({ name });
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Category created successfully',
    data: category,
  });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  const { name } = req.body;
  if (name) category.name = name;
  await category.save();

  return sendSuccess(res, { message: 'Category updated successfully', data: category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  // Proactively check for associated products so we return a clean 409
  // instead of relying solely on the DB-level FK violation bubbling up.
  const productCount = await Product.count({ where: { categoryId: category.id } });
  if (productCount > 0) {
    throw new ApiError(409, 'Category has associated products and cannot be deleted');
  }

  try {
    await category.destroy();
  } catch (err) {
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      throw new ApiError(409, 'Category has associated products and cannot be deleted');
    }
    throw err;
  }

  return res.status(204).send();
});

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
