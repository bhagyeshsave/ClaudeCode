const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const { ReportJob, Product, Category } = require('../models');
const { REPORTS_DIR } = require('../config/paths');

const PAGE_SIZE = 500;

function csvEscape(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function* iterateProducts(where) {
  let offset = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const rows = await Product.findAll({
      where,
      include: [{ model: Category }],
      order: [['id', 'ASC']],
      limit: PAGE_SIZE,
      offset,
    });
    if (rows.length === 0) return;
    for (const row of rows) yield row;
    offset += PAGE_SIZE;
    if (rows.length < PAGE_SIZE) return;
  }
}

async function generateCsvReport(filePath, where) {
  const writeStream = fs.createWriteStream(filePath);
  await new Promise((resolve, reject) => {
    writeStream.on('error', reject);
    writeStream.write('Unique ID,Name,Category,Price,Created At\n', (err) => {
      if (err) reject(err);
    });
    resolve();
  });

  for await (const product of iterateProducts(where)) {
    const line = [
      csvEscape(product.uniqueId),
      csvEscape(product.name),
      csvEscape(product.Category ? product.Category.name : ''),
      csvEscape(product.price),
      csvEscape(product.createdAt ? product.createdAt.toISOString() : ''),
    ].join(',');

    const canContinue = writeStream.write(`${line}\n`);
    if (!canContinue) {
      await new Promise((resolve) => writeStream.once('drain', resolve));
    }
  }

  await new Promise((resolve, reject) => {
    writeStream.end((err) => (err ? reject(err) : resolve()));
  });
}

async function generateXlsxReport(filePath, where) {
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ filename: filePath, useStyles: false });
  const sheet = workbook.addWorksheet('Report');

  sheet.columns = [
    { header: 'Unique ID', key: 'uniqueId', width: 38 },
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Price', key: 'price', width: 12 },
    { header: 'Created At', key: 'createdAt', width: 24 },
  ];

  for await (const product of iterateProducts(where)) {
    sheet
      .addRow({
        uniqueId: product.uniqueId,
        name: product.name,
        category: product.Category ? product.Category.name : '',
        price: product.price,
        createdAt: product.createdAt ? product.createdAt.toISOString() : '',
      })
      .commit();
  }

  sheet.commit();
  await workbook.commit();
}

/**
 * Runs in the background after the HTTP response for POST /api/reports/generate
 * has already been sent. Generates the report file on disk using a streaming
 * writer so memory stays flat even for large product tables.
 */
async function processReportJob(jobId) {
  const job = await ReportJob.findByPk(jobId);
  if (!job) return;

  try {
    job.status = 'processing';
    await job.save();

    const where = {};
    if (job.categoryId) where.categoryId = job.categoryId;

    const ext = job.format === 'xlsx' ? 'xlsx' : 'csv';
    const fileName = `report-${job.id}-${Date.now()}.${ext}`;
    const filePath = path.join(REPORTS_DIR, fileName);

    fs.mkdirSync(REPORTS_DIR, { recursive: true });

    if (job.format === 'xlsx') {
      await generateXlsxReport(filePath, where);
    } else {
      await generateCsvReport(filePath, where);
    }

    job.fileName = fileName;
    job.filePath = filePath;
    job.status = 'completed';
    job.completedAt = new Date();
    await job.save();
  } catch (err) {
    job.status = 'failed';
    job.failureReason = err.message;
    job.completedAt = new Date();
    await job.save();
  }
}

module.exports = { processReportJob };
