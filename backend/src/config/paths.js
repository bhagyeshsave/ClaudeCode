const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', '..');
const STORAGE_DIR = path.join(ROOT_DIR, 'storage');
const PRODUCT_IMAGES_DIR = path.join(STORAGE_DIR, 'uploads', 'products');
const BULK_UPLOADS_DIR = path.join(STORAGE_DIR, 'bulk-uploads');
const REPORTS_DIR = path.join(STORAGE_DIR, 'reports');

module.exports = {
  ROOT_DIR,
  STORAGE_DIR,
  PRODUCT_IMAGES_DIR,
  BULK_UPLOADS_DIR,
  REPORTS_DIR,
};
