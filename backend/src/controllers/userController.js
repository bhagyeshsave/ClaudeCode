const { User } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, buildPagination } = require('../utils/response');
const { parsePagination } = require('../utils/pagination');

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);

  const { rows, count } = await User.findAndCountAll({
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return sendSuccess(res, {
    message: 'Users retrieved successfully',
    data: rows.map(serializeUser),
    pagination: buildPagination(page, limit, count),
  });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return sendSuccess(res, { message: 'User retrieved successfully', data: serializeUser(user) });
});

const updateUser = asyncHandler(async (req, res) => {
  const targetId = parseInt(req.params.id, 10);

  if (req.user.id !== targetId) {
    throw new ApiError(403, 'You may only update your own account');
  }

  const user = await User.findByPk(targetId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const { email, password } = req.body;

  if (email && email !== user.email) {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new ApiError(400, 'Email is already registered', ['email already in use']);
    }
    user.email = email;
  }

  if (password) {
    user.password = password;
  }

  await user.save();

  return sendSuccess(res, { message: 'User updated successfully', data: serializeUser(user) });
});

const deleteUser = asyncHandler(async (req, res) => {
  const targetId = parseInt(req.params.id, 10);

  if (req.user.id !== targetId) {
    throw new ApiError(403, 'You may only delete your own account');
  }

  const user = await User.findByPk(targetId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  await user.destroy();
  return res.status(204).send();
});

module.exports = { listUsers, getUser, updateUser, deleteUser };
