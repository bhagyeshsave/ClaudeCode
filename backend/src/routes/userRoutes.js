const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const validateIdParam = require('../middleware/validateIdParam');

const router = express.Router();

router.use(authenticate);

router.get('/', userController.listUsers);
router.get('/:id', validateIdParam('id'), userController.getUser);
router.put(
  '/:id',
  validateIdParam('id'),
  [
    body('email').optional().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  validate,
  userController.updateUser
);
router.delete('/:id', validateIdParam('id'), userController.deleteUser);

module.exports = router;
