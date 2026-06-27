const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { PRODUCT_IMAGES_DIR, BULK_UPLOADS_DIR } = require('../config/paths');

[PRODUCT_IMAGES_DIR, BULK_UPLOADS_DIR].forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

const productImageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PRODUCT_IMAGES_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const uploadProductImage = multer({
  storage: productImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only image files are allowed'));
    }
    return cb(null, true);
  },
});

const bulkCsvStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, BULK_UPLOADS_DIR),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${uuidv4()}.csv`);
  },
});

const uploadBulkCsv = multer({
  storage: bulkCsvStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const isCsv =
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/octet-stream' ||
      path.extname(file.originalname).toLowerCase() === '.csv';
    if (!isCsv) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only CSV files are allowed'));
    }
    return cb(null, true);
  },
});

module.exports = { uploadProductImage, uploadBulkCsv };
