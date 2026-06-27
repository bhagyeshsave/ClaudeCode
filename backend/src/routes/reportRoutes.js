const express = require('express');
const { body } = require('express-validator');
const reportController = require('../controllers/reportController');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const validateIdParam = require('../middleware/validateIdParam');

const router = express.Router();

router.use(authenticate);

router.post(
  '/generate',
  [
    body('format').isIn(['csv', 'xlsx']).withMessage("format must be 'csv' or 'xlsx'"),
    body('categoryId').optional().isInt().withMessage('categoryId must be an integer'),
  ],
  validate,
  reportController.generateReport
);

router.get('/:jobId/download', validateIdParam('jobId'), reportController.downloadReport);
router.get('/:jobId', validateIdParam('jobId'), reportController.getReportStatus);

module.exports = router;
