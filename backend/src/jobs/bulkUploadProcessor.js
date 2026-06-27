const fs = require('fs');
const csv = require('csv-parser');
const { Op } = require('sequelize');
const { BulkUploadJob, Category, Product } = require('../models');

const BATCH_SIZE = 500;

function normalizeCategoryKey(name) {
  return String(name || '').trim().toLowerCase();
}

/**
 * Runs in the background (fire-and-forget, invoked via setImmediate from the
 * controller AFTER the HTTP response has already been sent). Streams the CSV
 * off disk row-by-row, never loading the whole file into memory, resolves
 * categoryName -> categoryId, batches valid rows and bulkCreates them in
 * chunks, and periodically persists progress to the job row.
 */
async function processBulkUploadJob(jobId) {
  const job = await BulkUploadJob.findByPk(jobId);
  if (!job) return;

  try {
    job.status = 'processing';
    await job.save();

    // Pre-load all categories once; case-insensitive trimmed name -> id map.
    const categories = await Category.findAll({ attributes: ['id', 'name'] });
    const categoryMap = new Map();
    categories.forEach((c) => categoryMap.set(normalizeCategoryKey(c.name), c.id));

    const errors = [];
    let totalRows = 0;
    let processedRows = 0;
    let successCount = 0;
    let failedCount = 0;
    let batch = [];

    const flushBatch = async () => {
      if (batch.length === 0) return;
      try {
        await Product.bulkCreate(batch, { validate: true });
        successCount += batch.length;
      } catch (err) {
        // If the whole-batch insert fails (e.g. one bad row), fall back to
        // row-by-row insert for THIS batch so one bad row doesn't sink the
        // rest of the batch.
        for (const row of batch) {
          try {
            await Product.create(row);
            successCount += 1;
          } catch (rowErr) {
            failedCount += 1;
            errors.push({ row: row.__rowNumber, message: rowErr.message });
          }
        }
      }
      batch = [];
    };

    await new Promise((resolve, reject) => {
      const stream = fs
        .createReadStream(job.filePath)
        .pipe(csv());

      stream.on('data', (row) => {
        totalRows += 1;
        const rowNumber = totalRows;

        stream.pause();

        (async () => {
          const name = (row.name || '').trim();
          const priceRaw = (row.price || '').trim();
          const categoryName = (row.categoryName || '').trim();
          const image = (row.image || '').trim() || null;

          const price = parseFloat(priceRaw);

          if (!name) {
            failedCount += 1;
            processedRows += 1;
            errors.push({ row: rowNumber, message: 'Missing required field: name' });
            stream.resume();
            return;
          }

          if (!priceRaw || Number.isNaN(price) || price <= 0) {
            failedCount += 1;
            processedRows += 1;
            errors.push({ row: rowNumber, message: `Invalid price value: '${priceRaw}'` });
            stream.resume();
            return;
          }

          if (!categoryName) {
            failedCount += 1;
            processedRows += 1;
            errors.push({ row: rowNumber, message: 'Missing required field: categoryName' });
            stream.resume();
            return;
          }

          const categoryId = categoryMap.get(normalizeCategoryKey(categoryName));
          if (!categoryId) {
            failedCount += 1;
            processedRows += 1;
            errors.push({ row: rowNumber, message: `Category '${categoryName}' not found` });
            stream.resume();
            return;
          }

          batch.push({ name, price, categoryId, image, __rowNumber: rowNumber });

          if (batch.length >= BATCH_SIZE) {
            await flushBatch();
          }

          processedRows += 1;

          // Persist progress periodically (every batch boundary).
          if (processedRows % BATCH_SIZE === 0) {
            job.totalRows = totalRows;
            job.processedRows = processedRows;
            job.successCount = successCount;
            job.failedCount = failedCount;
            // Assign a fresh array reference (not the same `errors` object
            // we keep mutating in place) so Sequelize's dirty-checking -
            // which compares by reference/deep-equality against the value
            // it already stored last time - actually sees this as changed
            // and includes it in the UPDATE. Reusing the same mutated
            // reference across saves makes Sequelize believe the JSONB
            // column never changed, silently dropping all row errors.
            job.errors = [...errors];
            await job.save();
          }

          stream.resume();
        })().catch((err) => {
          stream.destroy(err);
        });
      });

      stream.on('end', () => {
        resolve();
      });

      stream.on('error', (err) => {
        reject(err);
      });
    });

    // Flush any remaining partial batch.
    await flushBatch();

    job.status = 'completed';
    job.totalRows = totalRows;
    job.processedRows = processedRows;
    job.successCount = successCount;
    job.failedCount = failedCount;
    job.errors = [...errors];
    job.completedAt = new Date();
    await job.save();
  } catch (err) {
    job.status = 'failed';
    job.failureReason = err.message;
    job.completedAt = new Date();
    await job.save();
  }
}

module.exports = { processBulkUploadJob };
