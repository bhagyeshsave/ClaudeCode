const { BulkUploadJob } = require('../models');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { processBulkUploadJob } = require('../jobs/bulkUploadProcessor');

const TEMPLATE_CSV = [
  'name,price,categoryName,image',
  'Wireless Mouse,19.99,Electronics,https://example.com/images/mouse.jpg',
  'Cotton T-Shirt,9.99,Apparel,',
].join('\n');

function serializeJob(job) {
  return {
    jobId: job.id,
    status: job.status,
    fileName: job.fileName,
    totalRows: job.totalRows,
    processedRows: job.processedRows,
    successCount: job.successCount,
    failedCount: job.failedCount,
    errors: job.errors || [],
    createdAt: job.createdAt,
    completedAt: job.completedAt,
  };
}

const downloadTemplate = (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition',
    'attachment; filename="product-bulk-upload-template.csv"'
  );
  res.status(200).send(TEMPLATE_CSV);
};

const startBulkUpload = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'CSV file is required (field name: file)');
  }

  const job = await BulkUploadJob.create({
    status: 'pending',
    fileName: req.file.originalname,
    filePath: req.file.path,
  });

  // Fire-and-forget: schedule the heavy CSV parse/insert work to run AFTER
  // this response has been flushed to the client. We deliberately do not
  // await this call.
  setImmediate(() => {
    processBulkUploadJob(job.id).catch((err) => {
      // eslint-disable-next-line no-console
      console.error(`Bulk upload job ${job.id} crashed:`, err);
    });
  });

  return sendSuccess(res, {
    statusCode: 202,
    message: 'Bulk upload accepted and is processing in the background',
    data: { jobId: job.id, status: job.status },
  });
});

const getBulkUploadStatus = asyncHandler(async (req, res) => {
  const job = await BulkUploadJob.findByPk(req.params.jobId);
  if (!job) {
    throw new ApiError(404, 'Bulk upload job not found');
  }
  return sendSuccess(res, { message: 'Bulk upload job status retrieved', data: serializeJob(job) });
});

module.exports = { downloadTemplate, startBulkUpload, getBulkUploadStatus };
