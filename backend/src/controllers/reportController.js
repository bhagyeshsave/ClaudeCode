const fs = require('fs');
const { ReportJob, Category } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { processReportJob } = require('../jobs/reportProcessor');

const MIME_TYPES = {
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

function serializeJob(job) {
  return {
    jobId: job.id,
    status: job.status,
    format: job.format,
    fileName: job.fileName,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
  };
}

const generateReport = asyncHandler(async (req, res) => {
  const { format, categoryId } = req.body;

  if (!['csv', 'xlsx'].includes(format)) {
    throw new ApiError(400, "format must be 'csv' or 'xlsx'");
  }

  if (categoryId) {
    const category = await Category.findByPk(categoryId);
    if (!category) {
      throw new ApiError(400, 'Invalid categoryId: category does not exist');
    }
  }

  const job = await ReportJob.create({
    status: 'pending',
    format,
    categoryId: categoryId || null,
  });

  setImmediate(() => {
    processReportJob(job.id).catch((err) => {
      // eslint-disable-next-line no-console
      console.error(`Report job ${job.id} crashed:`, err);
    });
  });

  return sendSuccess(res, {
    statusCode: 202,
    message: 'Report generation started',
    data: { jobId: job.id, status: job.status },
  });
});

const getReportStatus = asyncHandler(async (req, res) => {
  const job = await ReportJob.findByPk(req.params.jobId);
  if (!job) {
    throw new ApiError(404, 'Report job not found');
  }
  return sendSuccess(res, { message: 'Report job status retrieved', data: serializeJob(job) });
});

const downloadReport = asyncHandler(async (req, res) => {
  const job = await ReportJob.findByPk(req.params.jobId);
  if (!job) {
    throw new ApiError(404, 'Report job not found');
  }

  if (job.status === 'failed') {
    throw new ApiError(409, 'Report generation failed and cannot be downloaded');
  }

  if (job.status !== 'completed') {
    throw new ApiError(409, 'Report is not ready yet');
  }

  if (!job.filePath || !fs.existsSync(job.filePath)) {
    throw new ApiError(404, 'Report file not found on disk');
  }

  res.setHeader('Content-Type', MIME_TYPES[job.format] || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${job.fileName}"`);

  const stream = fs.createReadStream(job.filePath);
  stream.on('error', (err) => {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Failed to stream report file', errors: [err.message] });
    } else {
      res.end();
    }
  });
  stream.pipe(res);
});

module.exports = { generateReport, getReportStatus, downloadReport };
