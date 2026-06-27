const express = require('express');
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.get('/', categoryController.listCategories);
router.get('/:id', categoryController.getCategory);
router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Category name is required')],
  validate,
  categoryController.createCategory
);
router.put(
  '/:id',
  [body('name').trim().notEmpty().withMessage('Category name is required')],
  validate,
  categoryController.updateCategory
);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
