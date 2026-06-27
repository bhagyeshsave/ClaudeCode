function sendSuccess(res, { statusCode = 200, message = 'OK', data, pagination } = {}) {
  const body = { success: true, message };
  if (data !== undefined) body.data = data;
  if (pagination !== undefined) body.pagination = pagination;
  return res.status(statusCode).json(body);
}

function buildPagination(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

module.exports = { sendSuccess, buildPagination };
