const express = require('express');
const { body } = require('express-validator');
const productController = require('../controllers/productController');
const bulkUploadController = require('../controllers/bulkUploadController');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const validateIdParam = require('../middleware/validateIdParam');
const { uploadProductImage, uploadBulkCsv } = require('../middleware/upload');

const router = express.Router();

router.use(authenticate);

// IMPORTANT: bulk-upload routes must be declared before the `/:id` routes
// so that path segments like "bulk-upload" are never captured as an :id.
router.get('/bulk-upload/template', bulkUploadController.downloadTemplate);
router.post('/bulk-upload', uploadBulkCsv.single('file'), bulkUploadController.startBulkUpload);
router.get(
  '/bulk-upload/:jobId',
  validateIdParam('jobId'),
  bulkUploadController.getBulkUploadStatus
);

const productValidators = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .bail()
    .isFloat({ gt: 0 })
    .withMessage('Price must be a number greater than 0'),
  body('categoryId')
    .notEmpty()
    .withMessage('categoryId is required')
    .bail()
    .isInt()
    .withMessage('categoryId must be an integer'),
];

const productUpdateValidators = [
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be a number greater than 0'),
  body('categoryId').optional().isInt().withMessage('categoryId must be an integer'),
];

router.get('/', productController.listProducts);
router.get('/:id', validateIdParam('id'), productController.getProduct);
router.post(
  '/',
  uploadProductImage.single('image'),
  productValidators,
  validate,
  productController.createProduct
);
router.put(
  '/:id',
  validateIdParam('id'),
  uploadProductImage.single('image'),
  productUpdateValidators,
  validate,
  productController.updateProduct
);
router.delete('/:id', validateIdParam('id'), productController.deleteProduct);

module.exports = router;
